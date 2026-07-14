const Goals = {
  currentView: 'active',

  init() {
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    const goals = Storage.getGoals().filter(g => !g.archived);
    const quote = Utils.getRandomQuote();

    app.innerHTML = `
      <div class="page-container">
        <div style="height: var(--status-bar-height);"></div>

        <header class="page-header">
          <h1 style="font-size: var(--text-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0;">我的目标</h1>
          <button class="flex items-center gap-1 no-underline" style="color: var(--color-text-secondary); font-size: var(--text-sm); background: none; border: none; cursor: pointer; padding: 0; font-family: inherit;">
            <span>🌟 已达成目标</span>
            <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </button>
        </header>

        <div class="page-content flex flex-col gap-4">
          <div class="card relative overflow-hidden" style="background: var(--color-bg-card);">
            <p style="font-size: var(--text-base); color: var(--color-text-primary); line-height: var(--line-height-relaxed); margin: 0;">💗 ${quote}</p>
            <span class="absolute bottom-2 right-3 opacity-30" style="font-size: 48px; color: var(--state-info); line-height: 1; transform: rotate(180deg); pointer-events: none;" aria-hidden="true">"</span>
          </div>

          ${goals.length === 0 ? this.renderEmptyState() : this.renderGoalsList(goals)}

          <button class="btn-primary" id="btn-create-goal" style="margin-top: var(--space-lg);">
            <i data-lucide="plus" style="width: 18px; height: 18px; margin-right: var(--space-sm);"></i>
            创建新目标
          </button>
        </div>

        ${this.renderTabBar('goals')}
      </div>
    `;

    document.getElementById('btn-create-goal').addEventListener('click', () => {
      App.navigate('chat');
    });

    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        App.navigate(tabName);
      });
    });

    document.querySelectorAll('.goal-card').forEach(card => {
      card.addEventListener('click', () => {
        const goalId = card.dataset.goalId;
        App.navigate(`goal/${goalId}`);
      });
    });

    lucide.createIcons();
  },

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="target" style="width: 40px; height: 40px; color: var(--color-text-tertiary);"></i>
        </div>
        <p class="empty-state-text">还没有目标，创建一个开始吧！</p>
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
          <span>${daysLeft > 0 ? `剩余 ${daysLeft} 天` : '已到期'}</span>
        </div>
      </div>
    `;
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
