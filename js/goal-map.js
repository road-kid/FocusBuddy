/**
 * GoalMap - SVG-based tree visualization with pan/zoom
 * Renders goal → task → subtask hierarchy as a node-link diagram
 */
const GoalMap = {
  svg: null,
  gRoot: null,
  gLinks: null,
  gNodes: null,
  container: null,
  goalId: null,
  goal: null,
  nodes: [],
  collapsed: new Set(),
  selectedNodeId: null,

  // Layout constants
  NODE_W: 200,
  NODE_H: 64,
  H_GAP: 60,
  V_GAP: 28,
  PADDING: 80,

  // Pan/zoom state
  scale: 1,
  tx: 0,
  ty: 0,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  panOrigin: { x: 0, y: 0 },

  // Touch state
  lastTouchDist: 0,
  lastTouchCenter: null,

  init(goalId, container) {
    this.goalId = goalId;
    this.goal = Storage.getGoals().find(g => g.id === goalId);
    this.container = container;
    this.nodes = [];
    this.collapsed = new Set();
    this.selectedNodeId = null;
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;

    if (!this.goal) {
      container.innerHTML = '<div class="map-empty"><p>目标不存在</p></div>';
      return;
    }

    this.createSVG();
    this.bindEvents();
    this.render();
    this.fitToView();
  },

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.svg = null;
    this.gRoot = null;
  },

  createSVG() {
    this.container.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'goal-map-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    // Defs for gradients and filters
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Drop shadow filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'node-shadow');
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    const feGauss = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGauss.setAttribute('in', 'SourceAlpha');
    feGauss.setAttribute('stdDeviation', '4');
    const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
    feOffset.setAttribute('dx', '0');
    feOffset.setAttribute('dy', '2');
    feOffset.setAttribute('result', 'offsetblur');
    const feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
    feFlood.setAttribute('flood-color', 'rgba(0,0,0,0.3)');
    const feComp = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    feComp.setAttribute('in2', 'offsetblur');
    feComp.setAttribute('operator', 'in');
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feGauss);
    filter.appendChild(feOffset);
    filter.appendChild(feFlood);
    filter.appendChild(feComp);
    filter.appendChild(feMerge);
    defs.appendChild(filter);

    // Glow filter for selected
    const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glowFilter.setAttribute('id', 'node-glow');
    glowFilter.setAttribute('x', '-50%');
    glowFilter.setAttribute('y', '-50%');
    glowFilter.setAttribute('width', '200%');
    glowFilter.setAttribute('height', '200%');
    const feGlow = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGlow.setAttribute('stdDeviation', '6');
    feGlow.setAttribute('result', 'glow');
    const feMergeGlow = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const fmn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    fmn1.setAttribute('in', 'glow');
    const fmn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    fmn2.setAttribute('in', 'glow');
    const fmn3 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    fmn3.setAttribute('in', 'SourceGraphic');
    feMergeGlow.appendChild(fmn1);
    feMergeGlow.appendChild(fmn2);
    feMergeGlow.appendChild(fmn3);
    glowFilter.appendChild(feGlow);
    glowFilter.appendChild(feMergeGlow);
    defs.appendChild(glowFilter);

    svg.appendChild(defs);

    this.gRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.gRoot.setAttribute('class', 'map-root');
    this.gLinks = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.gLinks.setAttribute('class', 'map-links');
    this.gNodes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.gNodes.setAttribute('class', 'map-nodes');
    this.gRoot.appendChild(this.gLinks);
    this.gRoot.appendChild(this.gNodes);
    svg.appendChild(this.gRoot);

    this.container.appendChild(svg);
    this.svg = svg;
  },

  buildTree() {
    const allNodes = Storage.getNodes().filter(n => n.goalId === this.goalId);
    const rootNodes = allNodes.filter(n => !n.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));

    const buildNode = (node) => {
      const children = allNodes
        .filter(n => n.parentId === node.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const isCollapsed = this.collapsed.has(node.id);
      const progress = Progress.calculateNodeProgress(node.id);
      const hasChildren = children.length > 0;

      return {
        ...node,
        progress,
        hasChildren,
        isCollapsed,
        childNodes: isCollapsed ? [] : children.map(c => buildNode(c)),
        x: 0,
        y: 0,
      };
    };

    // Virtual root = the goal itself
    const goalProgress = Progress.calculateGoalProgress(this.goalId);
    return {
      id: this.goalId,
      name: this.goal.name,
      color: this.goal.color,
      progress: goalProgress,
      hasChildren: rootNodes.length > 0,
      isCollapsed: false,
      isGoal: true,
      childNodes: rootNodes.map(r => buildNode(r)),
      x: 0,
      y: 0,
    };
  },

  layoutTree(root) {
    // First pass: compute subtree widths (bottom-up)
    const computeWidth = (node) => {
      if (!node.childNodes || node.childNodes.length === 0) {
        node._subtreeW = this.NODE_W;
        return node._subtreeW;
      }
      let totalW = 0;
      node.childNodes.forEach((child, i) => {
        totalW += computeWidth(child);
        if (i < node.childNodes.length - 1) totalW += this.V_GAP;
      });
      node._subtreeW = Math.max(this.NODE_W, totalW);
      return node._subtreeW;
    };
    computeWidth(root);

    // Second pass: assign positions (top-down)
    const assignPos = (node, cx, cy) => {
      node.x = cx;
      node.y = cy;
      if (!node.childNodes || node.childNodes.length === 0) return;

      const totalChildW = node.childNodes.reduce((s, c) => s + c._subtreeW, 0)
        + (node.childNodes.length - 1) * this.V_GAP;
      let startX = cx - totalChildW / 2;

      node.childNodes.forEach(child => {
        const childCx = startX + child._subtreeW / 2;
        assignPos(child, childCx, cy + this.NODE_H + this.H_GAP);
        startX += child._subtreeW + this.V_GAP;
      });
    };

    assignPos(root, 0, 0);
    return root;
  },

  render() {
    const tree = this.buildTree();
    this.layoutTree(tree);
    this.treeRoot = tree;

    // Clear
    this.gLinks.innerHTML = '';
    this.gNodes.innerHTML = '';

    // Render links and nodes
    this.renderNode(tree, null);

    // Update transform
    this.updateTransform();
  },

  renderNode(node, parentNode) {
    // Draw link from parent
    if (parentNode) {
      this.drawLink(parentNode, node);
    }

    // Draw node
    this.drawNode(node);

    // Render children
    if (node.childNodes) {
      node.childNodes.forEach(child => this.renderNode(child, node));
    }
  },

  drawLink(parent, child) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = parent.x;
    const y1 = parent.y + this.NODE_H / 2;
    const x2 = child.x;
    const y2 = child.y - this.NODE_H / 2;
    const midY = (y1 + y2) / 2;

    const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('class', 'map-link');

    // Color based on child progress
    const progress = child.progress || 0;
    const color = this.getProgressColor(progress);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-opacity', '0.5');

    this.gLinks.appendChild(path);
  },

  drawNode(node) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const x = node.x - this.NODE_W / 2;
    const y = node.y - this.NODE_H / 2;

    g.setAttribute('class', 'map-node');
    g.setAttribute('transform', `translate(${x}, ${y})`);
    g.setAttribute('data-id', node.id);
    g.style.cursor = 'pointer';

    const isSelected = this.selectedNodeId === node.id;
    const isGoal = node.isGoal;

    // Background rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', this.NODE_W);
    rect.setAttribute('height', this.NODE_H);
    rect.setAttribute('rx', '12');
    rect.setAttribute('ry', '12');
    rect.setAttribute('class', 'map-node-bg');

    if (isGoal) {
      rect.setAttribute('fill', '#1C1C1E');
      rect.setAttribute('stroke', Utils.getGoalColor(node.color || 'purple'));
      rect.setAttribute('stroke-width', '2');
    } else {
      rect.setAttribute('fill', '#1C1C1E');
      rect.setAttribute('stroke', isSelected ? Utils.getGoalColor(this.goal.color) : '#38383A');
      rect.setAttribute('stroke-width', isSelected ? '2' : '1');
    }

    if (isSelected) {
      rect.setAttribute('filter', 'url(#node-glow)');
    }

    g.appendChild(rect);

    // Color indicator dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const dotColor = isGoal
      ? Utils.getGoalColor(node.color || 'purple')
      : Utils.getGoalColor(this.goal.color);
    dot.setAttribute('cx', '16');
    dot.setAttribute('cy', String(this.NODE_H / 2));
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', dotColor);
    g.appendChild(dot);

    // Title text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '30');
    text.setAttribute('y', '26');
    text.setAttribute('class', 'map-node-title');
    text.setAttribute('fill', '#FFFFFF');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-weight', '600');

    const maxChars = 12;
    const displayName = node.name.length > maxChars
      ? node.name.substring(0, maxChars) + '...'
      : node.name;
    text.textContent = displayName;
    g.appendChild(text);

    // Progress bar background
    const pbBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    pbBg.setAttribute('x', '30');
    pbBg.setAttribute('y', '38');
    pbBg.setAttribute('width', String(this.NODE_W - 50));
    pbBg.setAttribute('height', '4');
    pbBg.setAttribute('rx', '2');
    pbBg.setAttribute('fill', '#2C2C2E');
    g.appendChild(pbBg);

    // Progress bar fill
    const progress = node.progress || 0;
    if (progress > 0) {
      const pbFill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      pbFill.setAttribute('x', '30');
      pbFill.setAttribute('y', '38');
      pbFill.setAttribute('width', String((this.NODE_W - 50) * progress));
      pbFill.setAttribute('height', '4');
      pbFill.setAttribute('rx', '2');
      pbFill.setAttribute('fill', this.getProgressColor(progress));
      g.appendChild(pbFill);
    }

    // Progress text
    const pText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    pText.setAttribute('x', '30');
    pText.setAttribute('y', '56');
    pText.setAttribute('fill', '#8E8E93');
    pText.setAttribute('font-size', '10');
    pText.textContent = `${Math.round(progress * 100)}%`;
    g.appendChild(pText);

    // Expand/collapse toggle
    if (node.hasChildren && !isGoal) {
      const toggleG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      toggleG.setAttribute('class', 'map-toggle');
      toggleG.setAttribute('transform', `translate(${this.NODE_W / 2}, ${this.NODE_H})`);
      toggleG.style.cursor = 'pointer';

      const toggleCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      toggleCircle.setAttribute('r', '10');
      toggleCircle.setAttribute('fill', '#2C2C2E');
      toggleCircle.setAttribute('stroke', '#38383A');
      toggleCircle.setAttribute('stroke-width', '1');
      toggleG.appendChild(toggleCircle);

      const toggleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      toggleText.setAttribute('text-anchor', 'middle');
      toggleText.setAttribute('dominant-baseline', 'central');
      toggleText.setAttribute('fill', '#8E8E93');
      toggleText.setAttribute('font-size', '12');
      toggleText.setAttribute('font-weight', '600');
      toggleText.textContent = node.isCollapsed ? '+' : '−';
      toggleG.appendChild(toggleText);

      // Count badge
      const allChildren = Storage.getNodes().filter(n => n.parentId === node.id);
      const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      countText.setAttribute('x', '16');
      countText.setAttribute('text-anchor', 'middle');
      countText.setAttribute('dominant-baseline', 'central');
      countText.setAttribute('fill', '#636366');
      countText.setAttribute('font-size', '9');
      countText.textContent = String(allChildren.length);
      toggleG.appendChild(countText);

      toggleG.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse(node.id);
      });

      g.appendChild(toggleG);
    }

    // Click handler
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isGoal) {
        this.selectNode(node.id);
      }
    });

    this.gNodes.appendChild(g);
  },

  getProgressColor(progress) {
    if (progress >= 1) return '#34C759'; // green
    if (progress > 0) return '#FF9500';  // yellow/orange
    return '#636366';                     // gray
  },

  toggleCollapse(nodeId) {
    if (this.collapsed.has(nodeId)) {
      this.collapsed.delete(nodeId);
    } else {
      this.collapsed.add(nodeId);
    }
    this.render();
  },

  selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    this.render();
    if (Sidebar) {
      Sidebar.show(nodeId, this.goalId);
    }
  },

  deselectNode() {
    this.selectedNodeId = null;
    this.render();
  },

  refresh() {
    if (this.goalId) {
      this.goal = Storage.getGoals().find(g => g.id === this.goalId);
      this.render();
    }
  },

  // === Pan & Zoom ===

  updateTransform() {
    if (this.gRoot) {
      this.gRoot.setAttribute('transform',
        `translate(${this.tx}, ${this.ty}) scale(${this.scale})`);
    }
  },

  fitToView() {
    if (!this.svg || !this.treeRoot) return;

    const rect = this.svg.getBoundingClientRect();
    const bounds = this.getTreeBounds();

    const treeW = bounds.maxX - bounds.minX + this.NODE_W + this.PADDING * 2;
    const treeH = bounds.maxY - bounds.minY + this.NODE_H + this.PADDING * 2;

    const scaleX = rect.width / treeW;
    const scaleY = rect.height / treeH;
    this.scale = Math.min(scaleX, scaleY, 1.2);
    this.scale = Math.max(this.scale, 0.2);

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    this.tx = rect.width / 2 - centerX * this.scale;
    this.ty = rect.height / 2 - centerY * this.scale;

    this.updateTransform();
  },

  getTreeBounds() {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    const traverse = (node) => {
      minX = Math.min(minX, node.x - this.NODE_W / 2);
      maxX = Math.max(maxX, node.x + this.NODE_W / 2);
      minY = Math.min(minY, node.y - this.NODE_H / 2);
      maxY = Math.max(maxY, node.y + this.NODE_H / 2 + (node.hasChildren ? 20 : 0));
      if (node.childNodes) {
        node.childNodes.forEach(traverse);
      }
    };

    if (this.treeRoot) traverse(this.treeRoot);
    return { minX, maxX, minY, maxY };
  },

  bindEvents() {
    if (!this.svg) return;

    // Mouse wheel zoom
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.15, Math.min(3, this.scale * delta));

      // Zoom towards mouse position
      const rect = this.svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      this.tx = mx - (mx - this.tx) * (newScale / this.scale);
      this.ty = my - (my - this.ty) * (newScale / this.scale);
      this.scale = newScale;
      this.updateTransform();
    }, { passive: false });

    // Mouse pan
    this.svg.addEventListener('mousedown', (e) => {
      if (e.target === this.svg || e.target === this.gRoot ||
          e.target === this.gLinks || e.target === this.gNodes) {
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.panOrigin = { x: this.tx, y: this.ty };
        this.svg.style.cursor = 'grabbing';

        // Deselect if clicking on empty space
        this.selectedNodeId = null;
        this.render();
        if (Sidebar) Sidebar.hide();
      }
    });

    window.addEventListener('mousemove', this._onMouseMove = (e) => {
      if (!this.isPanning) return;
      this.tx = this.panOrigin.x + (e.clientX - this.panStart.x);
      this.ty = this.panOrigin.y + (e.clientY - this.panStart.y);
      this.updateTransform();
    });

    window.addEventListener('mouseup', this._onMouseUp = () => {
      this.isPanning = false;
      if (this.svg) this.svg.style.cursor = 'grab';
    });

    this.svg.style.cursor = 'grab';

    // Touch events for mobile
    this.svg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isPanning = true;
        this.panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.panOrigin = { x: this.tx, y: this.ty };
      } else if (e.touches.length === 2) {
        this.isPanning = false;
        this.lastTouchDist = this.getTouchDist(e.touches);
        this.lastTouchCenter = this.getTouchCenter(e.touches);
      }
    }, { passive: true });

    this.svg.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.isPanning) {
        this.tx = this.panOrigin.x + (e.touches[0].clientX - this.panStart.x);
        this.ty = this.panOrigin.y + (e.touches[0].clientY - this.panStart.y);
        this.updateTransform();
      } else if (e.touches.length === 2) {
        const dist = this.getTouchDist(e.touches);
        const center = this.getTouchCenter(e.touches);
        const scaleFactor = dist / this.lastTouchDist;
        const newScale = Math.max(0.15, Math.min(3, this.scale * scaleFactor));

        const rect = this.svg.getBoundingClientRect();
        const cx = center.x - rect.left;
        const cy = center.y - rect.top;

        this.tx = cx - (cx - this.tx) * (newScale / this.scale);
        this.ty = cy - (cy - this.ty) * (newScale / this.scale);
        this.scale = newScale;

        this.lastTouchDist = dist;
        this.lastTouchCenter = center;
        this.updateTransform();
      }
    }, { passive: false });

    this.svg.addEventListener('touchend', () => {
      this.isPanning = false;
    });

    // Resize handler
    window.addEventListener('resize', this._onResize = Utils.debounce(() => {
      this.fitToView();
    }, 200));
  },

  getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  getTouchCenter(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  },

  unbindEvents() {
    if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
    if (this._onMouseUp) window.removeEventListener('mouseup', this._onMouseUp);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
  },
};
