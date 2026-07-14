const Analytics = {
  currentPeriod: 'day',
  currentDate: new Date(),

  init() {
    this.currentPeriod = 'day';
    this.currentDate = new Date();
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    const stats = Progress.getTodayStats();

    const dateText = `${this.currentDate.getMonth() + 1}月${this.currentDate.getDate()}日 ${Utils.getDayOfWeek(this.currentDate)}`;

    app.innerHTML = `
      <div class="page-container">
        <div style="height: var(--status-bar-height);"></div>

        <header class="page-header" style="justify-content: flex-start;">
          <h1 style="font-size: var(--text-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0;">分析</h1>
        </header>

        <div class="page-content" style="display: flex; flex-direction: column; gap: var(--space-xl);">
          <div class="segment-control">
            <div class="segment-control-item ${this.currentPeriod === 'day' ? 'active' : ''}" data-period="day">日</div>
            <div class="segment-control-item ${this.currentPeriod === 'week' ? 'active' : ''}" data-period="week">周</div>
            <div class="segment-control-item ${this.currentPeriod === 'month' ? 'active' : ''}" data-period="month">月</div>
            <div class="segment-control-item ${this.currentPeriod === 'year' ? 'active' : ''}" data-period="year">年</div>
          </div>

          <div class="date-nav">
            <button class="icon-btn" id="date-prev" aria-label="前一天" style="color: var(--color-text-tertiary);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span class="date-nav-text">${dateText}</span>
            <button class="icon-btn" id="date-next" aria-label="后一天" style="color: var(--color-text-tertiary);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          ${stats.total === 0 ? this.renderEmptyState() : ''}

          <section class="card" style="padding: var(--space-lg);">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">已完成</span>
                <span class="stat-value">${stats.completed}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">完成率</span>
                <span class="stat-value">${stats.rate}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">计时</span>
                <span class="stat-value">${this.formatMinutes(stats.totalTime)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">待完成</span>
                <span class="stat-value">${stats.pending}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已跳过</span>
                <span class="stat-value">0</span>
              </div>
            </div>
          </section>

          <section class="card" style="padding: var(--space-lg); position: relative; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-lg);">
              <span style="font-size: var(--text-base); color: var(--color-text-primary); font-weight: var(--font-weight-medium);">目标计时分布</span>
              <span class="badge-pro">PRO</span>
            </div>

            <div style="position: relative; height: 120px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: var(--space-lg);">
              <div style="display: flex; align-items: flex-end; gap: 6px; height: 100%; padding: 8px; filter: blur(4px); opacity: 0.4;">
                <div style="flex: 1; background: var(--color-primary); border-radius: 3px 3px 0 0; height: 30%;"></div>
                <div style="flex: 1; background: var(--color-primary); border-radius: 3px 3px 0 0; height: 55%;"></div>
                <div style="flex: 1; background: var(--color-primary); border-radius: 3px 3px 0 0; height: 40%;"></div>
                <div style="flex: 1; background: var(--color-primary); border-radius: 3px 3px 0 0; height: 70%;"></div>
                <div style="flex: 1; background: var(--color-primary); border-radius: 3px 3px 0 0; height: 25%;"></div>
                <div style="flex: 1; background: var(--color-primary); border-radius: 3px 3px 0 0; height: 60%;"></div>
                <div style="flex: 1; background: var(--color-primary); border-radius: 3px 3px 0 0; height: 45%;"></div>
              </div>
              <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(28, 28, 30, 0.5);">
                <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; text-align: center; padding: 0 var(--space-md);">解锁 pro 版本，查看目标计时分布数据</p>
              </div>
            </div>

            <button style="background: #6366F1; color: #FFFFFF; border: none; border-radius: var(--radius-md); padding: 10px 24px; font-size: var(--text-base); font-weight: var(--font-weight-semibold); cursor: pointer; width: 100%; height: 44px; display: flex; align-items: center; justify-content: center;">
              解锁会员
            </button>
          </section>
        </div>

        ${Goals.renderTabBar('analytics')}
      </div>
    `;

    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        App.navigate(tabName);
      });
    });

    document.querySelectorAll('.segment-control-item').forEach(item => {
      item.addEventListener('click', () => {
        this.currentPeriod = item.dataset.period;
        this.render();
      });
    });

    document.getElementById('date-prev').addEventListener('click', () => {
      this.changeDate(-1);
    });

    document.getElementById('date-next').addEventListener('click', () => {
      this.changeDate(1);
    });

    lucide.createIcons();
  },

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-text-tertiary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.6;">
            <path d="M8 20h24v14a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V20z"/>
            <path d="M32 24h4a4 4 0 0 1 0 8h-4"/>
            <line x1="6" y1="42" x2="34" y2="42"/>
            <path d="M16 16c0-2 2-4 0-8" style="opacity: 0.4;"/>
            <path d="M20 16c0-2 2-4 0-8" style="opacity: 0.5;"/>
            <path d="M24 16c0-2 2-4 0-8" style="opacity: 0.4;"/>
          </svg>
        </div>
        <p class="empty-state-text">准备迎接充实的一天！</p>
      </div>
    `;
  },

  changeDate(delta) {
    if (this.currentPeriod === 'day') {
      this.currentDate = Utils.addDays(this.currentDate, delta);
    } else if (this.currentPeriod === 'week') {
      this.currentDate = Utils.addDays(this.currentDate, delta * 7);
    } else if (this.currentPeriod === 'month') {
      const d = new Date(this.currentDate);
      d.setMonth(d.getMonth() + delta);
      this.currentDate = d;
    } else if (this.currentPeriod === 'year') {
      const d = new Date(this.currentDate);
      d.setFullYear(d.getFullYear() + delta);
      this.currentDate = d;
    }
    this.render();
  },

  formatMinutes(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h${rm}m`;
  },
};
