/**
 * Sidebar - Slide-in detail panel for node operations
 * Supports: view details, edit, add child, delete, toggle completion
 */
const Sidebar = {
  overlay: null,
  panel: null,
  nodeId: null,
  goalId: null,

  init() {
    // Create overlay + panel once
    this.overlay = document.createElement('div');
    this.overlay.className = 'sidebar-overlay';
    this.overlay.addEventListener('click', () => this.hide());

    this.panel = document.createElement('div');
    this.panel.className = 'sidebar-panel';
    this.panel.addEventListener('click', (e) => e.stopPropagation());

    this.overlay.appendChild(this.panel);
    document.body.appendChild(this.overlay);
  },

  show(nodeId, goalId) {
    if (!this.overlay) this.init();
    this.nodeId = nodeId;
    this.goalId = goalId;

    const node = Storage.getNodes().find(n => n.id === nodeId);
    if (!node) return;

    const goal = Storage.getGoals().find(g => g.id === goalId);
    const progress = Progress.calculateNodeProgress(nodeId);
    const children = Storage.getChildNodes(nodeId);
    const isLeaf = children.length === 0;

    // Build breadcrumb
    const breadcrumb = this.buildBreadcrumb(node, goal);

    this.panel.innerHTML = `
      <div class="sidebar-header">
        <button class="sidebar-close-btn" aria-label="关闭">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="sidebar-header-info">
          <span class="sidebar-color-dot" style="background: ${Utils.getGoalColor(goal?.color || 'purple')}"></span>
          <h3 class="sidebar-title">${Utils.escapeHtml(node.name)}</h3>
        </div>
        <button class="sidebar-more-btn" aria-label="更多操作">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </div>

      <div class="sidebar-breadcrumb">
        ${breadcrumb}
      </div>

      <div class="sidebar-body">
        <!-- Progress Section -->
        <div class="sidebar-section">
          <div class="sidebar-progress-card">
            <div class="sidebar-progress-header">
              <span class="sidebar-progress-value">${Math.round(progress * 100)}%</span>
              <span class="sidebar-progress-label">当前进度</span>
            </div>
            <div class="progress-bar" style="margin-top: 8px;">
              <div class="progress-bar-fill" style="width: ${progress * 100}%"></div>
            </div>
          </div>
        </div>

        ${isLeaf ? `
        <!-- Leaf node: completion toggle -->
        <div class="sidebar-section">
          <button class="sidebar-complete-btn ${progress >= 1 ? 'completed' : ''}" data-action="toggle-complete">
            <div class="checkbox-circle ${progress >= 1 ? 'checked' : ''}"></div>
            <span>${progress >= 1 ? '已完成' : '标记为完成'}</span>
          </button>
        </div>
        ` : ''}

        <!-- Subtasks section -->
        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <h4>子任务 (${children.length})</h4>
          </div>
          <div class="sidebar-children-list">
            ${children.sort((a, b) => (a.order || 0) - (b.order || 0)).map(child => {
              const childProgress = Progress.calculateNodeProgress(child.id);
              return `
                <div class="sidebar-child-item" data-child-id="${child.id}">
                  <div class="checkbox-circle ${childProgress >= 1 ? 'checked' : ''}" data-action="toggle-child" data-child-id="${child.id}"></div>
                  <div class="sidebar-child-info">
                    <span class="sidebar-child-name">${Utils.escapeHtml(child.name)}</span>
                    <div class="progress-bar" style="height: 3px; margin-top: 4px;">
                      <div class="progress-bar-fill" style="width: ${childProgress * 100}%"></div>
                    </div>
                  </div>
                  <span class="sidebar-child-pct">${Math.round(childProgress * 100)}%</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Action buttons -->
        <div class="sidebar-actions">
          <button class="sidebar-action-btn" data-action="add-child">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            添加子任务
          </button>
          <button class="sidebar-action-btn" data-action="edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            编辑
          </button>
          <button class="sidebar-action-btn danger" data-action="delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            删除
          </button>
        </div>
      </div>
    `;

    // Bind events
    this.panel.querySelector('.sidebar-close-btn').addEventListener('click', () => this.hide());
    this.panel.querySelector('.sidebar-more-btn').addEventListener('click', () => this.showMoreMenu());

    // Toggle complete
    const completeBtn = this.panel.querySelector('[data-action="toggle-complete"]');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        Progress.toggleTaskCompletion(this.nodeId);
        this.refresh();
      });
    }

    // Toggle child completion
    this.panel.querySelectorAll('[data-action="toggle-child"]').forEach(el => {
      el.addEventListener('click', () => {
        Progress.toggleTaskCompletion(el.dataset.childId);
        this.refresh();
      });
    });

    // Click child to select
    this.panel.querySelectorAll('.sidebar-child-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="toggle-child"]')) return;
        const childId = el.dataset.childId;
        this.show(childId, this.goalId);
        if (GoalMap) GoalMap.selectNode(childId);
      });
    });

    // Add child
    this.panel.querySelector('[data-action="add-child"]').addEventListener('click', () => {
      this.showAddChildForm();
    });

    // Edit
    this.panel.querySelector('[data-action="edit"]').addEventListener('click', () => {
      this.showEditForm();
    });

    // Delete
    this.panel.querySelector('[data-action="delete"]').addEventListener('click', () => {
      this.showDeleteConfirm();
    });

    // Show
    requestAnimationFrame(() => {
      this.overlay.classList.add('show');
    });
  },

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('show');
    }
    if (GoalMap) GoalMap.deselectNode();
  },

  refresh() {
    if (this.nodeId && this.goalId) {
      this.show(this.nodeId, this.goalId);
      if (GoalMap) GoalMap.refresh();
    }
  },

  buildBreadcrumb(node, goal) {
    const parts = [];
    if (goal) {
      parts.push(`<span class="breadcrumb-item">${Utils.escapeHtml(goal.name)}</span>`);
    }

    // Build path from node to root
    const path = [];
    let current = node;
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = Storage.getNodes().find(n => n.id === current.parentId);
      } else {
        current = null;
      }
    }

    path.forEach((n, i) => {
      parts.push(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`);
      parts.push(`<span class="breadcrumb-item ${i === path.length - 1 ? 'active' : ''}">${Utils.escapeHtml(n.name)}</span>`);
    });

    return parts.join('');
  },

  showAddChildForm() {
    const body = this.panel.querySelector('.sidebar-body');
    const originalContent = body.innerHTML;

    body.innerHTML = `
      <div class="sidebar-form">
        <h4 class="sidebar-form-title">添加子任务</h4>
        <div class="sidebar-form-group">
          <label>任务名称</label>
          <input type="text" class="modal-input" id="sidebar-child-name" placeholder="输入任务名称..." autofocus>
        </div>
        <div class="sidebar-form-actions">
          <button class="btn-secondary" data-action="cancel-form">取消</button>
          <button class="btn-primary" style="height: 44px; width: auto; padding: 0 24px;" data-action="save-child">添加</button>
        </div>
      </div>
    `;

    body.querySelector('[data-action="cancel-form"]').addEventListener('click', () => {
      body.innerHTML = originalContent;
      this.show(this.nodeId, this.goalId);
    });

    body.querySelector('[data-action="save-child"]').addEventListener('click', () => {
      const name = body.querySelector('#sidebar-child-name').value.trim();
      if (!name) return;

      const siblings = Storage.getChildNodes(this.nodeId);
      const node = Storage.getNodes().find(n => n.id === this.nodeId);

      Storage.addNode({
        id: Utils.generateId(),
        goalId: this.goalId,
        parentId: this.nodeId,
        name: name,
        progressType: 'completion',
        resetCycle: 'none',
        order: siblings.length + 1,
      });

      // Expand parent if collapsed
      if (GoalMap) GoalMap.collapsed.delete(this.nodeId);

      this.refresh();
    });

    // Focus input
    setTimeout(() => {
      const input = body.querySelector('#sidebar-child-name');
      if (input) input.focus();
    }, 100);
  },

  showEditForm() {
    const node = Storage.getNodes().find(n => n.id === this.nodeId);
    if (!node) return;

    const body = this.panel.querySelector('.sidebar-body');
    const originalContent = body.innerHTML;

    body.innerHTML = `
      <div class="sidebar-form">
        <h4 class="sidebar-form-title">编辑任务</h4>
        <div class="sidebar-form-group">
          <label>任务名称</label>
          <input type="text" class="modal-input" id="sidebar-edit-name" value="${Utils.escapeHtml(node.name)}">
        </div>
        <div class="sidebar-form-actions">
          <button class="btn-secondary" data-action="cancel-form">取消</button>
          <button class="btn-primary" style="height: 44px; width: auto; padding: 0 24px;" data-action="save-edit">保存</button>
        </div>
      </div>
    `;

    body.querySelector('[data-action="cancel-form"]').addEventListener('click', () => {
      this.show(this.nodeId, this.goalId);
    });

    body.querySelector('[data-action="save-edit"]').addEventListener('click', () => {
      const name = body.querySelector('#sidebar-edit-name').value.trim();
      if (!name) return;

      Storage.updateNode(this.nodeId, { name });
      this.refresh();
    });

    setTimeout(() => {
      const input = body.querySelector('#sidebar-edit-name');
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  },

  showDeleteConfirm() {
    const node = Storage.getNodes().find(n => n.id === this.nodeId);
    if (!node) return;

    const children = Storage.getChildNodes(this.nodeId);
    const hasChildren = children.length > 0;

    // Create confirm dialog
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay show';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <h3 class="confirm-dialog-title">删除任务</h3>
        <p class="confirm-dialog-text">
          确定要删除「${Utils.escapeHtml(node.name)}」吗？
          ${hasChildren ? `<br>该任务有 ${children.length} 个子任务，将一并删除。` : ''}
          <br>此操作不可撤销。
        </p>
        <div class="confirm-dialog-actions">
          <button class="btn-secondary" data-action="cancel-delete">取消</button>
          <button class="btn-danger" data-action="confirm-delete">删除</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('[data-action="cancel-delete"]').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.querySelector('[data-action="confirm-delete"]').addEventListener('click', () => {
      Storage.deleteNode(this.nodeId);
      overlay.remove();
      this.hide();
      if (GoalMap) GoalMap.refresh();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },

  showMoreMenu() {
    // Simple action sheet
    const overlay = document.createElement('div');
    overlay.className = 'action-sheet-overlay show';
    overlay.innerHTML = `
      <div class="action-sheet">
        <div class="action-sheet-item" data-action="edit">编辑名称</div>
        <div class="action-sheet-item action-sheet-item--danger" data-action="delete">删除任务</div>
        <div class="action-sheet-item action-sheet-item--cancel">取消</div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('[data-action="edit"]').addEventListener('click', () => {
      overlay.remove();
      this.showEditForm();
    });

    overlay.querySelector('[data-action="delete"]').addEventListener('click', () => {
      overlay.remove();
      this.showDeleteConfirm();
    });

    overlay.querySelector('.action-sheet-item--cancel').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },
};
