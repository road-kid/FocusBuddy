const Goals = {
  currentView: 'active',

  init() {
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    const goals = Storage.getGoals();
    const activeGoals = goals.filter(g => !g.archived);
    const completedGoals = goals.filter(g => g.archived);
    const quote = Utils.getRandomQuote();

    app.innerHTML = `
      <div class="page-container">
        <div style="height: var(--status-bar-height);"></div>

        <header class="page-header">
          <h1 style="font-size: var(--text-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0;">我的目标</h1>
          <button class="flex items-center gap-1 no-underline" id="btn-toggle-view" style="color: var(--color-text-secondary); font-size: var(--text-sm); background: none; border: none; cursor: pointer; padding: 0; font-family: inherit;">
            <span>${this.currentView === 'active' ? '🌟 已达成目标' : '📋 活跃目标'}</span>
            <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </button>
        </header>

        <div class="page-content flex flex-col gap-4">
          <div class="card relative overflow-hidden" style="background: var(--color-bg-card);">
            <p style="font-size: var(--text-base); color: var(--color-text-primary); line-height: var(--line-height-relaxed); margin: 0;">💗 ${quote}</p>
            <span class="absolute bottom-2 right-3 opacity-30" style="font-size: 48px; color: var(--state-info); line-height: 1; transform: rotate(180deg); pointer-events: none;" aria-hidden="true">"</span>
          </div>

          ${this.currentView === 'active'
            ? (activeGoals.length === 0 ? this.renderEmptyActive() : this.renderGoalsList(activeGoals))
            : (completedGoals.length === 0 ? this.renderEmptyCompleted() : this.renderGoalsList(completedGoals))
          }

          ${this.currentView === 'active' ? `
            <button class="btn-primary" id="btn-create-goal" style="margin-top: var(--space-lg);">
              <i data-lucide="plus" style="width: 18px; height: 18px; margin-right: var(--space-sm);"></i>
              创建新目标
            </button>
          ` : ''}
        </div>

        ${this.renderTabBar('goals')}
      </div>
    `;

    this.attachEvents();
    lucide.createIcons();
  },

  renderEmptyActive() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="target" style="width: 40px; height: 40px; color: var(--color-text-tertiary);"></i>
        </div>
        <p class="empty-state-text">还没有目标，创建一个开始吧！</p>
        <button class="btn-primary" id="btn-create-goal-empty" style="margin-top: var(--space-lg);">
          <i data-lucide="plus" style="width: 18px; height: 18px; margin-right: var(--space-sm);"></i>
          创建新目标
        </button>
      </div>
    `;
  },

  renderEmptyCompleted() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="archive" style="width: 40px; height: 40px; color: var(--color-text-tertiary);"></i>
        </div>
        <p class="empty-state-text">还没有已达标的目标</p>
      </div>
    `;
  },

  renderGoalsList(goals) {
    return `
      <div class="flex flex-col gap-3">
        ${goals.map(goal => this.renderGoalCard(goal)).join('')}
      </div>
    `;
  },

  renderGoalCard(goal) {
    const progress = Progress.calculateGoalProgress(goal.id);
    const progressPercent = Math.round(progress * 100);
    const color = Utils.getGoalColor(goal.color);
    const daysLeft = Utils.daysBetween(new Date(), goal.endDate);
    const completedCount = Progress.getCompletedCount(goal.id);

    return `
      <div class="goal-card" data-goal-id="${goal.id}">
        <div class="goal-card-header">
          <span style="width: 3px; height: 20px; background: ${color}; border-radius: 2px; flex-shrink: 0;"></span>
          <span class="goal-card-title">${Utils.escapeHtml(goal.title)}</span>
          <span style="font-size: var(--text-sm); color: var(--color-text-secondary); flex-shrink: 0;">${progressPercent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${progressPercent}%; background: linear-gradient(90deg, ${color}, ${color}dd);"></div>
        </div>
        <div class="goal-card-progress-text">
          <span>${completedCount} 次完成</span>
          ${goal.archived && goal.archivedAt ? `
            <span>${Utils.formatDateShort(goal.archivedAt)} 达成</span>
          ` : `
            <span>${daysLeft > 0 ? `剩余 ${daysLeft} 天` : '已到期'}</span>
          `}
        </div>
        <button class="goal-card-menu-btn" data-goal-id="${goal.id}" aria-label="更多操作" style="position: absolute; top: var(--space-sm); right: var(--space-sm); background: none; border: none; cursor: pointer; padding: var(--space-xs); color: var(--color-text-tertiary); border-radius: var(--radius-sm);">
          <i data-lucide="more-horizontal" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
    `;
  },

  showActionSheet(goalId) {
    const goal = Storage.getGoals().find(g => g.id === goalId);
    if (!goal) return;

    const isArchived = goal.archived;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'action-sheet-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end;';

    overlay.innerHTML = `
      <div class="action-sheet" id="action-sheet" style="background: var(--color-bg-card); border-radius: var(--radius-xl) var(--radius-xl) 0 0; width: 100%; padding: var(--space-lg); padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom)); animation: slideUp 0.2s ease-out;">
        <div style="width: 36px; height: 4px; background: var(--color-border); border-radius: 2px; margin: 0 auto var(--space-lg);"></div>
        <h3 style="font-size: var(--text-md); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-md);">${Utils.escapeHtml(goal.title)}</h3>
        <div class="flex flex-col gap-2">
          ${isArchived ? `
            <button class="action-sheet-btn" data-action="unarchive" data-goal-id="${goalId}" style="display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); background: none; border: none; font-size: var(--text-base); color: var(--color-text-primary); cursor: pointer; font-family: inherit; border-radius: var(--radius-md); width: 100%; text-align: left;">
              <i data-lucide="rotate-ccw" style="width: 18px; height: 18px; color: var(--state-info);"></i>
              恢复目标
            </button>
          ` : `
            <button class="action-sheet-btn" data-action="edit" data-goal-id="${goalId}" style="display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); background: none; border: none; font-size: var(--text-base); color: var(--color-text-primary); cursor: pointer; font-family: inherit; border-radius: var(--radius-md); width: 100%; text-align: left;">
              <i data-lucide="pencil" style="width: 18px; height: 18px; color: var(--state-info);"></i>
              编辑目标
            </button>
            <button class="action-sheet-btn" data-action="archive" data-goal-id="${goalId}" style="display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); background: none; border: none; font-size: var(--text-base); color: var(--color-text-primary); cursor: pointer; font-family: inherit; border-radius: var(--radius-md); width: 100%; text-align: left;">
              <i data-lucide="archive" style="width: 18px; height: 18px; color: var(--state-warning);"></i>
              归档目标
            </button>
          `}
          <button class="action-sheet-btn" data-action="delete" data-goal-id="${goalId}" style="display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); background: none; border: none; font-size: var(--text-base); color: var(--state-error); cursor: pointer; font-family: inherit; border-radius: var(--radius-md); width: 100%; text-align: left;">
            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
            删除目标
          </button>
        </div>
        <button class="action-sheet-btn" data-action="cancel" style="display: flex; align-items: center; justify-content: center; gap: var(--space-sm); padding: var(--space-md); background: var(--color-bg-secondary); border: none; font-size: var(--text-base); color: var(--color-text-secondary); cursor: pointer; font-family: inherit; border-radius: var(--radius-md); width: 100%; margin-top: var(--space-md);">
          取消
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeActionSheet();
      }
    });

    overlay.querySelectorAll('.action-sheet-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const gId = btn.dataset.goalId;
        this.handleAction(action, gId);
      });
    });

    lucide.createIcons();
  },

  closeActionSheet() {
    const overlay = document.getElementById('action-sheet-overlay');
    if (overlay) {
      overlay.remove();
    }
  },

  handleAction(action, goalId) {
    this.closeActionSheet();

    switch (action) {
      case 'edit':
        this.showEditModal(goalId);
        break;
      case 'archive':
        Storage.archiveGoal(goalId);
        this.render();
        break;
      case 'unarchive':
        Storage.unarchiveGoal(goalId);
        this.render();
        break;
      case 'delete':
        this.showDeleteConfirm(goalId);
        break;
      case 'cancel':
        break;
    }
  },

  showEditModal(goalId) {
    const goal = Storage.getGoals().find(g => g.id === goalId);
    if (!goal) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'edit-modal-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end;';

    overlay.innerHTML = `
      <div class="edit-modal" id="edit-modal" style="background: var(--color-bg-card); border-radius: var(--radius-xl) var(--radius-xl) 0 0; width: 100%; max-height: 85vh; overflow-y: auto; padding: var(--space-lg); padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom)); animation: slideUp 0.2s ease-out;">
        <div style="width: 36px; height: 4px; background: var(--color-border); border-radius: 2px; margin: 0 auto var(--space-lg);"></div>
        <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-lg);">编辑目标</h3>

        <div class="flex flex-col gap-4">
          <div>
            <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-xs);">标题</label>
            <input type="text" class="input-field" id="edit-title" value="${Utils.escapeHtml(goal.title)}" style="width: 100%; box-sizing: border-box;" />
          </div>

          <div>
            <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-xs);">描述</label>
            <input type="text" class="input-field" id="edit-description" value="${Utils.escapeHtml(goal.description || '')}" style="width: 100%; box-sizing: border-box;" />
          </div>

          <div>
            <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-xs);">分类</label>
            <input type="text" class="input-field" id="edit-category" value="${Utils.escapeHtml(goal.category || '')}" style="width: 100%; box-sizing: border-box;" />
          </div>

          <div>
            <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-xs);">颜色</label>
            <div class="flex flex-wrap gap-2" id="edit-color-options">
              ${Utils.goalColors.map(c => `
                <button class="color-option ${goal.color === c.name ? 'active' : ''}" data-color="${c.name}" style="width: 32px; height: 32px; border-radius: 50%; background: ${c.value}; border: ${goal.color === c.name ? '3px solid var(--color-text-primary)' : '2px solid transparent'}; cursor: pointer; transition: border-color 0.15s;" aria-label="${c.name}"></button>
              `).join('')}
            </div>
          </div>

          <div>
            <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-xs);">截止日期</label>
            <input type="date" class="input-field" id="edit-end-date" value="${Utils.formatDateISO(goal.endDate)}" style="width: 100%; box-sizing: border-box;" />
          </div>
        </div>

        <div class="flex gap-3" style="margin-top: var(--space-xl);">
          <button class="btn-primary" id="btn-save-edit" style="flex: 1;">保存</button>
          <button class="btn-secondary" id="btn-cancel-edit" style="flex: 1;">取消</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeEditModal();
      }
    });

    let selectedColor = goal.color;

    overlay.querySelectorAll('.color-option').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.color-option').forEach(b => {
          b.classList.remove('active');
          b.style.border = '2px solid transparent';
        });
        btn.classList.add('active');
        btn.style.border = '3px solid var(--color-text-primary)';
        selectedColor = btn.dataset.color;
      });
    });

    document.getElementById('btn-save-edit').addEventListener('click', () => {
      const title = document.getElementById('edit-title').value.trim();
      if (!title) return;

      Storage.updateGoal(goalId, {
        title,
        description: document.getElementById('edit-description').value.trim(),
        category: document.getElementById('edit-category').value.trim(),
        color: selectedColor,
        endDate: new Date(document.getElementById('edit-end-date').value).toISOString(),
      });

      this.closeEditModal();
      this.render();
    });

    document.getElementById('btn-cancel-edit').addEventListener('click', () => {
      this.closeEditModal();
    });
  },

  closeEditModal() {
    const overlay = document.getElementById('edit-modal-overlay');
    if (overlay) {
      overlay.remove();
    }
  },

  showDeleteConfirm(goalId) {
    const goal = Storage.getGoals().find(g => g.id === goalId);
    if (!goal) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'delete-confirm-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;';

    overlay.innerHTML = `
      <div class="confirm-dialog" style="background: var(--color-bg-card); border-radius: var(--radius-xl); width: calc(100% - var(--space-2xl)); max-width: 320px; padding: var(--space-xl); text-align: center; animation: fadeIn 0.15s ease-out;">
        <i data-lucide="alert-triangle" style="width: 40px; height: 40px; color: var(--state-error); margin-bottom: var(--space-md);"></i>
        <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-sm);">确认删除</h3>
        <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-lg);">删除"${Utils.escapeHtml(goal.title)}"后，相关任务和记录也将被移除，此操作不可撤销。</p>
        <div class="flex gap-3">
          <button class="btn-secondary" id="btn-cancel-delete" style="flex: 1;">取消</button>
          <button class="btn-danger" id="btn-confirm-delete" style="flex: 1; background: var(--state-error); color: #fff; border: none; border-radius: var(--radius-md); padding: var(--space-sm) var(--space-md); font-size: var(--text-base); cursor: pointer; font-family: inherit;">删除</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeDeleteConfirm();
      }
    });

    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
      this.closeDeleteConfirm();
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
      Storage.deleteGoal(goalId);
      this.closeDeleteConfirm();
      this.render();
    });

    lucide.createIcons();
  },

  closeDeleteConfirm() {
    const overlay = document.getElementById('delete-confirm-overlay');
    if (overlay) {
      overlay.remove();
    }
  },

  attachEvents() {
    document.getElementById('btn-toggle-view').addEventListener('click', () => {
      this.currentView = this.currentView === 'active' ? 'completed' : 'active';
      this.render();
    });

    const btnCreateGoal = document.getElementById('btn-create-goal');
    if (btnCreateGoal) {
      btnCreateGoal.addEventListener('click', () => {
        App.navigate('chat');
      });
    }

    const btnCreateGoalEmpty = document.getElementById('btn-create-goal-empty');
    if (btnCreateGoalEmpty) {
      btnCreateGoalEmpty.addEventListener('click', () => {
        App.navigate('chat');
      });
    }

    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        App.navigate(tabName);
      });
    });

    document.querySelectorAll('.goal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.goal-card-menu-btn')) return;
        const goalId = card.dataset.goalId;
        App.navigate(`goal/${goalId}`);
      });
    });

    document.querySelectorAll('.goal-card-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const goalId = btn.dataset.goalId;
        this.showActionSheet(goalId);
      });
    });

    let longPressTimer;
    document.querySelectorAll('.goal-card').forEach(card => {
      card.addEventListener('touchstart', (e) => {
        if (e.target.closest('.goal-card-menu-btn')) return;
        longPressTimer = setTimeout(() => {
          const goalId = card.dataset.goalId;
          this.showActionSheet(goalId);
        }, 600);
      });

      card.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
      });

      card.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
      });
    });
  },

  renderTabBar(activeTab) {
    const todayTasks = Progress.getTodayTasks();
    const pendingCount = todayTasks.filter(t => !t.completed).length;

    return `
      <nav class="bottom-tab-bar" aria-label="底部导航">
        <button class="tab-item ${activeTab === 'goals' ? 'active' : ''}" data-tab="goals" aria-label="目标">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          <span>目标</span>
        </button>
        <button class="tab-item ${activeTab === 'schedule' ? 'active' : ''}" data-tab="schedule" aria-label="日程">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          ${pendingCount > 0 ? `<span class="tab-badge">${pendingCount}</span>` : ''}
          <span>日程</span>
        </button>
        <button class="tab-item ${activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics" aria-label="分析">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>分析</span>
        </button>
        <button class="tab-item ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings" aria-label="设置">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>设置</span>
        </button>
      </nav>
    `;
  },
};