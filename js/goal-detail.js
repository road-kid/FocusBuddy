const GoalDetail = {
  goalId: null,
  expandedNodes: new Set(),

  init(goalId) {
    this.goalId = goalId;
    this.expandedNodes = new Set();
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    const goal = Storage.getGoals().find(g => g.id === this.goalId);

    if (!goal) {
      app.innerHTML = '<div class="page-container"><div class="page-content">目标不存在</div></div>';
      return;
    }

    const progress = Progress.calculateGoalProgress(goal.id);
    const progressPercent = Math.round(progress * 100);
    const daysLeft = Utils.daysBetween(new Date(), goal.endDate);
    const completedCount = Progress.getCompletedCount(goal.id);
    const color = Utils.getGoalColor(goal.color);
    const topNodes = Storage.getNodes().filter(n => n.goalId === goal.id && !n.parentId);

    app.innerHTML = `
      <div class="page-container">
        <div style="height: var(--status-bar-height);"></div>

        <header class="page-header" style="padding-bottom: var(--space-md);">
          <button class="icon-btn" id="btn-back" aria-label="返回" style="color: var(--color-text-primary);">
            <i data-lucide="chevron-left" style="width: 24px; height: 24px;"></i>
          </button>
          <div class="flex items-center gap-2.5 min-w-0 flex-1 justify-center">
            <span style="width: 3px; height: 20px; background: ${color}; border-radius: 2px;"></span>
            <span style="font-size: 20px; font-weight: 700; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${Utils.escapeHtml(goal.category || '目标')}</span>
          </div>
          <button class="icon-btn" aria-label="更多操作" style="color: var(--color-text-secondary);">
            <i data-lucide="ellipsis-vertical" style="width: 20px; height: 20px;"></i>
          </button>
        </header>

        <div class="page-content" style="padding-bottom: var(--space-3xl);">
          <h2 style="font-size: var(--text-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-lg) 0;">${Utils.escapeHtml(goal.title)}</h2>

          <div class="grid grid-cols-2 gap-3" style="margin-bottom: var(--space-3xl);">
            <div class="card" style="padding: var(--space-md) var(--space-md) var(--space-lg);">
              <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-xs); line-height: 1.4;">剩余 ${daysLeft} 天</p>
              <p style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin: 0; line-height: 1.4;">${Utils.formatDateShort(goal.endDate)} 截止</p>
            </div>

            <div class="card relative" style="padding: var(--space-md) var(--space-md) var(--space-lg);">
              <p style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); margin: 0 0 var(--space-xs); line-height: 1.25; font-variant-numeric: tabular-nums;">${progressPercent}%</p>
              <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; line-height: 1.4;">目标进度</p>
              <svg style="position: absolute; top: var(--space-md); right: var(--space-md); width: 36px; height: 36px; transform: rotate(-90deg);" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="14" stroke-width="2.5" style="stroke: var(--color-border-light);" />
                <circle cx="18" cy="18" r="14" stroke-width="2.5" stroke-dasharray="${2 * Math.PI * 14}" stroke-dashoffset="${2 * Math.PI * 14 * (1 - progress)}" stroke="${color}" fill="none" stroke-linecap="round"/>
              </svg>
            </div>

            <div class="card" style="padding: var(--space-md) var(--space-md) var(--space-lg);">
              <div class="flex items-baseline gap-1.5" style="margin-bottom: var(--space-xs);">
                <span style="font-size: 18px; line-height: 1;">🚩</span>
                <span style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); line-height: 1.25; font-variant-numeric: tabular-nums;">${completedCount}</span>
              </div>
              <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; line-height: 1.4;">已完成次数</p>
            </div>

            <div class="card relative" style="padding: var(--space-md) var(--space-md) var(--space-lg); overflow: hidden;">
              <div class="flex items-baseline gap-1.5" style="margin-bottom: var(--space-xs);">
                <span style="font-size: 18px; line-height: 1;">⏱️</span>
                <span style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); line-height: 1.25; font-variant-numeric: tabular-nums;">${topNodes.length}</span>
              </div>
              <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; line-height: 1.4;">任务数</p>
              <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--color-border);">
                <div style="width: ${progressPercent}%; height: 100%; background: ${color}; border-radius: 0 2px 2px 0;"></div>
              </div>
            </div>
          </div>

          <h2 style="font-size: var(--text-md); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-lg);">任务结构</h2>

          ${topNodes.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i data-lucide="list-todo" style="width: 40px; height: 40px; color: var(--color-text-tertiary);"></i>
              </div>
              <p class="empty-state-text">还没有任务</p>
            </div>
          ` : `
            <div class="card" style="padding: 0 var(--space-lg);">
              ${topNodes.map(node => this.renderNode(node, color)).join('')}
            </div>
          `}

          <button class="btn-primary" style="margin-top: var(--space-xl);" id="btn-start-timer">
            <i data-lucide="timer" style="width: 18px; height: 18px; margin-right: var(--space-sm);"></i>
            开始计时
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-back').addEventListener('click', () => App.navigate('goals'));

    document.querySelectorAll('.collapse-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = toggle.dataset.nodeId;
        if (this.expandedNodes.has(nodeId)) {
          this.expandedNodes.delete(nodeId);
        } else {
          this.expandedNodes.add(nodeId);
        }
        this.render();
      });
    });

    document.querySelectorAll('.task-node-checkbox').forEach(checkbox => {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = checkbox.dataset.nodeId;
        const node = Storage.getNodes().find(n => n.id === nodeId);
        if (node && node.progressType === 'completion') {
          const children = Storage.getChildNodes(nodeId);
          if (children.length === 0) {
            Progress.toggleTaskCompletion(nodeId);
            this.render();
          }
        }
      });
    });

    document.getElementById('btn-start-timer').addEventListener('click', () => {
      App.navigate(`timer/${this.goalId}`);
    });

    lucide.createIcons();
  },

  renderNode(node, color, depth = 0) {
    const children = Storage.getChildNodes(node.id);
    const hasChildren = children.length > 0;
    const isExpanded = this.expandedNodes.has(node.id) || depth < 1;
    const progress = Progress.calculateNodeProgress(node.id);
    const progressPercent = Math.round(progress * 100);

    if (depth === 0) {
      this.expandedNodes.add(node.id);
    }

    const isLeaf = !hasChildren;
    const isCompleted = isLeaf && progress >= 1;

    return `
      <div class="task-node">
        <div class="task-node-header">
          ${hasChildren ? `
            <div class="collapse-toggle ${isExpanded ? '' : 'collapsed'}" data-node-id="${node.id}">
              <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
            </div>
          ` : `<div style="width: 20px; flex-shrink: 0;"></div>`}
          <div class="checkbox-circle task-node-checkbox ${isCompleted && isLeaf ? 'checked' : ''}" data-node-id="${node.id}" style="${!isLeaf ? 'opacity: 0.5;' : ''}"></div>
          <div class="flex-1 min-w-0">
            <p style="font-size: var(--text-base); font-weight: ${isCompleted ? 'var(--font-weight-regular)' : 'var(--font-weight-semibold)'}; color: ${isCompleted ? 'var(--color-text-secondary)' : 'var(--color-text-primary)'}; margin: 0; text-decoration: ${isCompleted ? 'line-through' : 'none'};">
              ${Utils.escapeHtml(node.title)}
            </p>
            ${node.progressType === 'quantify' && isLeaf ? `
              <p style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin: var(--space-xs) 0 0 0;">
                ${Progress.getTodayQuantifyValue(node.id)} / ${node.targetValue} ${node.targetUnit || ''}
              </p>
            ` : ''}
            ${!isLeaf ? `
              <div style="margin-top: var(--space-xs);">
                <div class="progress-bar" style="height: 4px;">
                  <div class="progress-bar-fill" style="width: ${progressPercent}%; background: linear-gradient(90deg, ${color}, ${color}dd);"></div>
                </div>
              </div>
            ` : ''}
          </div>
          ${node.resetCycle && node.resetCycle !== 'none' ? `
            <span style="font-size: var(--text-xs); color: var(--color-text-tertiary); flex-shrink: 0; margin-left: var(--space-sm);">
              ${this.getCycleLabel(node.resetCycle)}
            </span>
          ` : ''}
        </div>
        ${hasChildren && isExpanded ? `
          <div class="task-node-children">
            ${children.map(child => this.renderNode(child, color, depth + 1)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  getCycleLabel(cycle) {
    const labels = {
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      none: '',
    };
    return labels[cycle] || '';
  },
};
