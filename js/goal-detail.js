const GoalDetail = {
  goalId: null,
  expandedNodes: new Set(),
  modalType: null,
  deleteTarget: null,
  editNodeTarget: null,
  parentNodeId: null,
  origGoal: null,

  init(goalId) {
    this.goalId = goalId;
    this.expandedNodes = new Set();
    this.modalType = null;
    this.deleteTarget = null;
    this.editNodeTarget = null;
    this.parentNodeId = null;
    this.origGoal = null;
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
    const allGoalNodes = Storage.getGoalNodes(goal.id);

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
          <button class="icon-btn" id="btn-more" aria-label="更多操作" style="color: var(--color-text-secondary);">
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

          <div class="flex items-center justify-between" style="margin-bottom: var(--space-lg);">
            <h2 style="font-size: var(--text-md); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0;">任务结构</h2>
            <button class="btn-secondary" id="btn-add-task" style="font-size: var(--text-sm); padding: var(--space-xs) var(--space-md); display: flex; align-items: center; gap: var(--space-xs);">
              <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
              添加子任务
            </button>
          </div>

          ${topNodes.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i data-lucide="list-todo" style="width: 40px; height: 40px; color: var(--color-text-tertiary);"></i>
              </div>
              <p class="empty-state-text">还没有任务</p>
            </div>
          ` : `
            <div class="card" style="padding: 0 var(--space-lg);" id="task-tree">
              ${topNodes.map(node => this.renderNode(node, color, 0)).join('')}
            </div>
          `}

          <button class="btn-primary" style="margin-top: var(--space-xl);" id="btn-start-timer">
            <i data-lucide="timer" style="width: 18px; height: 18px; margin-right: var(--space-sm);"></i>
            开始计时
          </button>
        </div>

        ${this.renderModal()}
      </div>
    `;

    this.bindEvents();
    lucide.createIcons();
  },

  renderModal() {
    if (!this.modalType) return '';

    const goal = Storage.getGoals().find(g => g.id === this.goalId);
    if (!goal && this.modalType !== 'delete-goal-confirm') return '';

    switch (this.modalType) {
      case 'goal-menu':
        return this.renderGoalMenuModal(goal);
      case 'edit-goal':
        return this.renderEditGoalModal(goal);
      case 'add-task':
        return this.renderAddTaskModal(goal);
      case 'edit-node':
        return this.renderEditNodeModal();
      case 'add-child':
        return this.renderAddChildModal(goal);
      case 'node-action':
        return this.renderNodeActionModal();
      case 'delete-goal-confirm':
        return this.renderDeleteGoalConfirmModal();
      case 'delete-node-confirm':
        return this.renderDeleteNodeConfirmModal();
      default:
        return '';
    }
  },

  renderGoalMenuModal(goal) {
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-lg); text-align: center;">${Utils.escapeHtml(goal.title)}</h3>
          <button class="modal-action-btn" id="btn-edit-goal">
            <i data-lucide="pencil" style="width: 18px; height: 18px; margin-right: var(--space-md); color: var(--color-text-secondary);"></i>
            <span>编辑目标</span>
          </button>
          <button class="modal-action-btn" id="btn-archive-goal">
            <i data-lucide="archive" style="width: 18px; height: 18px; margin-right: var(--space-md); color: var(--color-text-secondary);"></i>
            <span>归档目标</span>
          </button>
          <button class="modal-action-btn" id="btn-delete-goal" style="color: var(--state-error);">
            <i data-lucide="trash-2" style="width: 18px; height: 18px; margin-right: var(--space-md); color: var(--state-error);"></i>
            <span>删除目标</span>
          </button>
          <button class="modal-cancel-btn" id="btn-close-modal" style="margin-top: var(--space-lg);">取消</button>
        </div>
      </div>
    `;
  },

  renderEditGoalModal(goal) {
    const colors = Utils.goalColors;
    const endDateStr = Utils.formatDateISO(goal.endDate);
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet" style="max-height: 90vh; overflow-y: auto;">
          <div class="modal-handle"></div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-xl); text-align: center;">编辑目标</h3>
          <form id="form-edit-goal" style="display: flex; flex-direction: column; gap: var(--space-lg);">
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">标题</label>
              <input type="text" id="edit-goal-title" value="${Utils.escapeHtml(goal.title)}" required class="modal-input" placeholder="目标标题">
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">描述</label>
              <textarea id="edit-goal-desc" class="modal-input" placeholder="目标描述（可选）" rows="2" style="resize: vertical;">${Utils.escapeHtml(goal.description || '')}</textarea>
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">分类</label>
              <input type="text" id="edit-goal-category" value="${Utils.escapeHtml(goal.category || '')}" class="modal-input" placeholder="目标分类">
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">颜色</label>
              <div class="flex gap-2 flex-wrap" id="color-picker">
                ${colors.map(c => `
                  <button type="button" class="color-option ${goal.color === c.name ? 'color-option-selected' : ''}" data-color="${c.name}" style="background: ${c.value}; width: 28px; height: 28px; border-radius: 50%; border: ${goal.color === c.name ? '2px solid var(--color-text-primary)' : '2px solid transparent'}; cursor: pointer; flex-shrink: 0;"></button>
                `).join('')}
              </div>
              <input type="hidden" id="edit-goal-color" value="${goal.color}">
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">截止日期</label>
              <input type="date" id="edit-goal-enddate" value="${endDateStr}" class="modal-input">
            </div>
            <div class="flex gap-3" style="margin-top: var(--space-sm);">
              <button type="button" class="modal-cancel-btn flex-1" id="btn-close-modal">取消</button>
              <button type="submit" class="btn-primary flex-1">保存</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderAddTaskModal(goal) {
    const allNodes = Storage.getGoalNodes(goal.id);
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet" style="max-height: 90vh; overflow-y: auto;">
          <div class="modal-handle"></div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-xl); text-align: center;">添加子任务</h3>
          <form id="form-add-task" style="display: flex; flex-direction: column; gap: var(--space-lg);">
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">任务标题 <span style="color: var(--state-error);">*</span></label>
              <input type="text" id="add-task-title" required class="modal-input" placeholder="输入任务标题">
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">描述</label>
              <textarea id="add-task-desc" class="modal-input" placeholder="任务描述（可选）" rows="2" style="resize: vertical;"></textarea>
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">所属父任务</label>
              <select id="add-task-parent" class="modal-input">
                <option value="">顶级（无父任务）</option>
                ${allNodes.map(n => `<option value="${n.id}">${Utils.escapeHtml(n.title)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">进度类型</label>
              <div class="flex gap-3">
                <label class="flex items-center gap-2" style="cursor: pointer;">
                  <input type="radio" name="add-task-progress" value="completion" checked>
                  <span style="font-size: var(--text-sm); color: var(--color-text-primary);">完成制</span>
                </label>
                <label class="flex items-center gap-2" style="cursor: pointer;">
                  <input type="radio" name="add-task-progress" value="quantify">
                  <span style="font-size: var(--text-sm); color: var(--color-text-primary);">量化制</span>
                </label>
              </div>
            </div>
            <div id="quantify-fields" style="display: none; flex-direction: column; gap: var(--space-md);">
              <div>
                <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">目标值</label>
                <input type="number" id="add-task-target" class="modal-input" placeholder="例如: 30" min="1" value="1">
              </div>
              <div>
                <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">单位</label>
                <input type="text" id="add-task-unit" class="modal-input" placeholder="例如: 分钟、页、次">
              </div>
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">重置周期</label>
              <select id="add-task-cycle" class="modal-input">
                <option value="none">不重置</option>
                <option value="daily" selected>每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
            <div class="flex gap-3" style="margin-top: var(--space-sm);">
              <button type="button" class="modal-cancel-btn flex-1" id="btn-close-modal">取消</button>
              <button type="submit" class="btn-primary flex-1">添加</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderEditNodeModal() {
    const node = Storage.getNodes().find(n => n.id === this.editNodeTarget);
    if (!node) {
      this.modalType = null;
      return this.render();
    }
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet" style="max-height: 90vh; overflow-y: auto;">
          <div class="modal-handle"></div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-xl); text-align: center;">编辑任务</h3>
          <form id="form-edit-node" style="display: flex; flex-direction: column; gap: var(--space-lg);">
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">任务标题</label>
              <input type="text" id="edit-node-title" value="${Utils.escapeHtml(node.title)}" required class="modal-input" placeholder="任务标题">
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">描述</label>
              <textarea id="edit-node-desc" class="modal-input" placeholder="任务描述（可选）" rows="2" style="resize: vertical;">${Utils.escapeHtml(node.description || '')}</textarea>
            </div>
            <div class="flex gap-3" style="margin-top: var(--space-sm);">
              <button type="button" class="modal-cancel-btn flex-1" id="btn-close-modal">取消</button>
              <button type="submit" class="btn-primary flex-1">保存</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderAddChildModal(goal) {
    const parentNode = Storage.getNodes().find(n => n.id === this.parentNodeId);
    const parentTitle = parentNode ? parentNode.title : '';
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet" style="max-height: 90vh; overflow-y: auto;">
          <div class="modal-handle"></div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-xs); text-align: center;">添加子任务</h3>
          <p style="font-size: var(--text-sm); color: var(--color-text-tertiary); text-align: center; margin: 0 0 var(--space-xl);">父任务: ${Utils.escapeHtml(parentTitle)}</p>
          <form id="form-add-child" style="display: flex; flex-direction: column; gap: var(--space-lg);">
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">任务标题 <span style="color: var(--state-error);">*</span></label>
              <input type="text" id="add-child-title" required class="modal-input" placeholder="输入任务标题">
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">描述</label>
              <textarea id="add-child-desc" class="modal-input" placeholder="任务描述（可选）" rows="2" style="resize: vertical;"></textarea>
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">进度类型</label>
              <div class="flex gap-3">
                <label class="flex items-center gap-2" style="cursor: pointer;">
                  <input type="radio" name="add-child-progress" value="completion" checked>
                  <span style="font-size: var(--text-sm); color: var(--color-text-primary);">完成制</span>
                </label>
                <label class="flex items-center gap-2" style="cursor: pointer;">
                  <input type="radio" name="add-child-progress" value="quantify">
                  <span style="font-size: var(--text-sm); color: var(--color-text-primary);">量化制</span>
                </label>
              </div>
            </div>
            <div id="child-quantify-fields" style="display: none; flex-direction: column; gap: var(--space-md);">
              <div>
                <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">目标值</label>
                <input type="number" id="add-child-target" class="modal-input" placeholder="例如: 30" min="1" value="1">
              </div>
              <div>
                <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">单位</label>
                <input type="text" id="add-child-unit" class="modal-input" placeholder="例如: 分钟、页、次">
              </div>
            </div>
            <div>
              <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">重置周期</label>
              <select id="add-child-cycle" class="modal-input">
                <option value="none">不重置</option>
                <option value="daily" selected>每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
            <div class="flex gap-3" style="margin-top: var(--space-sm);">
              <button type="button" class="modal-cancel-btn flex-1" id="btn-close-modal">取消</button>
              <button type="submit" class="btn-primary flex-1">添加</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderNodeActionModal() {
    const node = Storage.getNodes().find(n => n.id === this.editNodeTarget);
    if (!node) {
      this.modalType = null;
      return this.render();
    }
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-lg); text-align: center;">${Utils.escapeHtml(node.title)}</h3>
          <button class="modal-action-btn" id="btn-edit-node">
            <i data-lucide="pencil" style="width: 18px; height: 18px; margin-right: var(--space-md); color: var(--color-text-secondary);"></i>
            <span>编辑任务</span>
          </button>
          <button class="modal-action-btn" id="btn-add-child-node">
            <i data-lucide="plus-circle" style="width: 18px; height: 18px; margin-right: var(--space-md); color: var(--color-text-secondary);"></i>
            <span>添加子任务</span>
          </button>
          <button class="modal-action-btn" id="btn-delete-node" style="color: var(--state-error);">
            <i data-lucide="trash-2" style="width: 18px; height: 18px; margin-right: var(--space-md); color: var(--state-error);"></i>
            <span>删除任务</span>
          </button>
          <button class="modal-cancel-btn" id="btn-close-modal" style="margin-top: var(--space-lg);">取消</button>
        </div>
      </div>
    `;
  },

  renderDeleteGoalConfirmModal() {
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div style="text-align: center; margin-bottom: var(--space-lg);">
            <i data-lucide="alert-triangle" style="width: 40px; height: 40px; color: var(--state-error); margin-bottom: var(--space-md);"></i>
            <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-sm);">确认删除</h3>
            <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">删除目标后，所有关联的任务和记录都将被永久移除，此操作不可撤销。</p>
          </div>
          <div class="flex gap-3">
            <button class="modal-cancel-btn flex-1" id="btn-close-modal">取消</button>
            <button class="btn-primary flex-1" id="btn-confirm-delete-goal" style="background: var(--state-error);">确认删除</button>
          </div>
        </div>
      </div>
    `;
  },

  renderDeleteNodeConfirmModal() {
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div style="text-align: center; margin-bottom: var(--space-lg);">
            <i data-lucide="alert-triangle" style="width: 40px; height: 40px; color: var(--state-error); margin-bottom: var(--space-md);"></i>
            <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-sm);">确认删除任务</h3>
            <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">删除此任务后，其所有子任务也将被一并移除。</p>
          </div>
          <div class="flex gap-3">
            <button class="modal-cancel-btn flex-1" id="btn-close-modal">取消</button>
            <button class="btn-primary flex-1" id="btn-confirm-delete-node" style="background: var(--state-error);">确认删除</button>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    document.getElementById('btn-back').addEventListener('click', () => App.navigate('goals'));

    document.getElementById('btn-more').addEventListener('click', () => {
      this.modalType = 'goal-menu';
      this.render();
    });

    document.getElementById('btn-add-task').addEventListener('click', () => {
      this.modalType = 'add-task';
      this.parentNodeId = null;
      this.render();
    });

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

    document.querySelectorAll('.task-node-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.collapse-toggle') || e.target.closest('.task-node-checkbox')) return;
        const nodeId = header.dataset.nodeId;
        if (nodeId) {
          this.editNodeTarget = nodeId;
          this.modalType = 'node-action';
          this.render();
        }
      });
    });

    document.getElementById('btn-start-timer').addEventListener('click', () => {
      App.navigate(`timer/${this.goalId}`);
    });

    this.bindModalEvents();
  },

  bindModalEvents() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal();
        }
      });
    }

    const closeBtn = document.getElementById('btn-close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    switch (this.modalType) {
      case 'goal-menu':
        this.bindGoalMenuEvents();
        break;
      case 'edit-goal':
        this.bindEditGoalEvents();
        break;
      case 'add-task':
        this.bindAddTaskEvents();
        break;
      case 'edit-node':
        this.bindEditNodeEvents();
        break;
      case 'add-child':
        this.bindAddChildEvents();
        break;
      case 'node-action':
        this.bindNodeActionEvents();
        break;
      case 'delete-goal-confirm':
        this.bindDeleteGoalConfirmEvents();
        break;
      case 'delete-node-confirm':
        this.bindDeleteNodeConfirmEvents();
        break;
    }
  },

  bindGoalMenuEvents() {
    document.getElementById('btn-edit-goal').addEventListener('click', () => {
      this.modalType = 'edit-goal';
      this.render();
    });
    document.getElementById('btn-archive-goal').addEventListener('click', () => this.handleArchiveGoal());
    document.getElementById('btn-delete-goal').addEventListener('click', () => {
      this.modalType = 'delete-goal-confirm';
      this.render();
    });
  },

  bindEditGoalEvents() {
    const colorPicker = document.getElementById('color-picker');
    colorPicker.querySelectorAll('.color-option').forEach(btn => {
      btn.addEventListener('click', () => {
        colorPicker.querySelectorAll('.color-option').forEach(b => {
          b.classList.remove('color-option-selected');
          b.style.border = '2px solid transparent';
        });
        btn.classList.add('color-option-selected');
        btn.style.border = '2px solid var(--color-text-primary)';
        document.getElementById('edit-goal-color').value = btn.dataset.color;
      });
    });

    document.getElementById('form-edit-goal').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditGoal();
    });
  },

  bindAddTaskEvents() {
    const progressRadios = document.querySelectorAll('input[name="add-task-progress"]');
    const quantifyFields = document.getElementById('quantify-fields');
    const updateQuantify = () => {
      const selected = document.querySelector('input[name="add-task-progress"]:checked');
      quantifyFields.style.display = selected && selected.value === 'quantify' ? 'flex' : 'none';
    };
    progressRadios.forEach(r => r.addEventListener('change', updateQuantify));

    document.getElementById('form-add-task').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTask();
    });
  },

  bindEditNodeEvents() {
    document.getElementById('form-edit-node').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditNode();
    });
  },

  bindAddChildEvents() {
    const progressRadios = document.querySelectorAll('input[name="add-child-progress"]');
    const quantifyFields = document.getElementById('child-quantify-fields');
    const updateQuantify = () => {
      const selected = document.querySelector('input[name="add-child-progress"]:checked');
      quantifyFields.style.display = selected && selected.value === 'quantify' ? 'flex' : 'none';
    };
    progressRadios.forEach(r => r.addEventListener('change', updateQuantify));

    document.getElementById('form-add-child').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddChild();
    });
  },

  bindNodeActionEvents() {
    document.getElementById('btn-edit-node').addEventListener('click', () => {
      this.modalType = 'edit-node';
      this.render();
    });
    document.getElementById('btn-add-child-node').addEventListener('click', () => {
      this.parentNodeId = this.editNodeTarget;
      this.modalType = 'add-child';
      this.render();
    });
    document.getElementById('btn-delete-node').addEventListener('click', () => {
      this.modalType = 'delete-node-confirm';
      this.render();
    });
  },

  bindDeleteGoalConfirmEvents() {
    document.getElementById('btn-confirm-delete-goal').addEventListener('click', () => this.handleDeleteGoal());
  },

  bindDeleteNodeConfirmEvents() {
    document.getElementById('btn-confirm-delete-node').addEventListener('click', () => this.handleDeleteNode());
  },

  closeModal() {
    this.modalType = null;
    this.editNodeTarget = null;
    this.parentNodeId = null;
    this.deleteTarget = null;
    this.render();
  },

  handleEditGoal() {
    const title = document.getElementById('edit-goal-title').value.trim();
    const description = document.getElementById('edit-goal-desc').value.trim();
    const category = document.getElementById('edit-goal-category').value.trim();
    const color = document.getElementById('edit-goal-color').value;
    const endDate = document.getElementById('edit-goal-enddate').value;

    if (!title) return;

    Storage.updateGoal(this.goalId, {
      title,
      description,
      category,
      color,
      endDate: new Date(endDate).toISOString(),
    });

    this.closeModal();
  },

  handleArchiveGoal() {
    Storage.archiveGoal(this.goalId);
    App.navigate('goals');
  },

  handleDeleteGoal() {
    Storage.deleteGoal(this.goalId);
    App.navigate('goals');
  },

  handleAddTask() {
    const title = document.getElementById('add-task-title').value.trim();
    const description = document.getElementById('add-task-desc').value.trim();
    const parentId = document.getElementById('add-task-parent').value || null;
    const progressType = document.querySelector('input[name="add-task-progress"]:checked').value;
    const cycle = document.getElementById('add-task-cycle').value;

    if (!title) return;

    const node = {
      id: Utils.generateId(),
      goalId: this.goalId,
      parentId: parentId,
      title,
      description,
      progressType,
      resetCycle: cycle,
      createdAt: new Date().toISOString(),
    };

    if (progressType === 'quantify') {
      node.targetValue = parseInt(document.getElementById('add-task-target').value, 10) || 1;
      node.targetUnit = document.getElementById('add-task-unit').value.trim() || '';
    }

    Storage.addNode(node);
    this.closeModal();
  },

  handleEditNode() {
    const title = document.getElementById('edit-node-title').value.trim();
    const description = document.getElementById('edit-node-desc').value.trim();

    if (!title) return;

    Storage.updateNode(this.editNodeTarget, { title, description });
    this.closeModal();
  },

  handleAddChild() {
    const title = document.getElementById('add-child-title').value.trim();
    const description = document.getElementById('add-child-desc').value.trim();
    const progressType = document.querySelector('input[name="add-child-progress"]:checked').value;
    const cycle = document.getElementById('add-child-cycle').value;

    if (!title) return;

    const node = {
      id: Utils.generateId(),
      goalId: this.goalId,
      parentId: this.parentNodeId,
      title,
      description,
      progressType,
      resetCycle: cycle,
      createdAt: new Date().toISOString(),
    };

    if (progressType === 'quantify') {
      node.targetValue = parseInt(document.getElementById('add-child-target').value, 10) || 1;
      node.targetUnit = document.getElementById('add-child-unit').value.trim() || '';
    }

    Storage.addNode(node);
    this.closeModal();
  },

  handleDeleteNode() {
    if (this.editNodeTarget) {
      Storage.deleteNode(this.editNodeTarget);
    }
    this.closeModal();
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
        <div class="task-node-header" data-node-id="${node.id}" style="cursor: pointer;">
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