const Analytics = {
  currentPeriod: 'day',
  currentDate: new Date(),

  init() {
    this.currentPeriod = 'day';
    this.currentDate = new Date();
    this.render();
  },

  /* ---------- period helpers ---------- */

  getPeriodRange() {
    const d = new Date(this.currentDate);
    let startDate, endDate;
    switch (this.currentPeriod) {
      case 'day':
        startDate = Utils.formatDateISO(d);
        endDate = startDate;
        break;
      case 'week':
        startDate = Utils.formatDateISO(Utils.getWeekStart(d));
        endDate = Utils.formatDateISO(Utils.getWeekEnd(d));
        break;
      case 'month':
        startDate = Utils.formatDateISO(Utils.getMonthStart(d));
        endDate = Utils.formatDateISO(Utils.getMonthEnd(d));
        break;
      case 'year':
        startDate = Utils.formatDateISO(Utils.getYearStart(d));
        endDate = Utils.formatDateISO(Utils.getYearEnd(d));
        break;
    }
    return { startDate, endDate };
  },

  getRecordsForPeriod() {
    const { startDate, endDate } = this.getPeriodRange();
    return Storage.getRecords().filter(r => {
      const datePart = r.date.substring(0, 10);
      return datePart >= startDate && datePart <= endDate;
    });
  },

  getDateText() {
    const d = new Date(this.currentDate);
    switch (this.currentPeriod) {
      case 'day':
        return `${d.getMonth() + 1}月${d.getDate()}日 ${Utils.getDayOfWeek(d)}`;
      case 'week': {
        const ws = Utils.getWeekStart(d);
        const we = Utils.getWeekEnd(d);
        return `${ws.getMonth() + 1}月${ws.getDate()}日 - ${we.getMonth() + 1}月${we.getDate()}日`;
      }
      case 'month':
        return `${d.getFullYear()}年${d.getMonth() + 1}月`;
      case 'year':
        return `${d.getFullYear()}年`;
    }
  },

  canGoNext() {
    const now = new Date();
    const d = new Date(this.currentDate);
    switch (this.currentPeriod) {
      case 'day':
        return Utils.formatDateISO(d) < Utils.formatDateISO(now);
      case 'week':
        return Utils.formatDateISO(Utils.getWeekStart(d)) < Utils.formatDateISO(Utils.getWeekStart(now));
      case 'month':
        return `${d.getFullYear()}-${d.getMonth()}` < `${now.getFullYear()}-${now.getMonth()}`;
      case 'year':
        return d.getFullYear() < now.getFullYear();
    }
  },

  /* ---------- data calculation ---------- */

  calculateStats(records) {
    const completed = records.filter(r => r.completed).length;
    const total = records.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalTime = records.reduce((sum, r) => sum + (r.duration || 0), 0);
    const pending = total - completed;
    return { completed, total, rate, totalTime, pending };
  },

  getChartData(records) {
    switch (this.currentPeriod) {
      case 'day':
        return null;
      case 'week':
        return this.getWeekChartData(records);
      case 'month':
        return this.getMonthChartData(records);
      case 'year':
        return this.getYearChartData(records);
    }
  },

  getWeekChartData(records) {
    const weekDates = Utils.getWeekDates(this.currentDate);
    return weekDates.map((date, i) => {
      const dateStr = Utils.formatDateISO(date);
      const dayRecords = records.filter(r => r.date.substring(0, 10) === dateStr);
      return {
        label: ['一', '二', '三', '四', '五', '六', '日'][i],
        totalTime: dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
        completed: dayRecords.filter(r => r.completed).length,
        total: dayRecords.length,
      };
    });
  },

  getMonthChartData(records) {
    const monthStart = Utils.getMonthStart(this.currentDate);
    const monthEnd = Utils.getMonthEnd(this.currentDate);
    const weeks = [];

    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(monthStart);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > monthEnd) weekEnd.setTime(monthEnd.getTime());

      const wss = Utils.formatDateISO(weekStart);
      const wes = Utils.formatDateISO(weekEnd);

      const weekRecords = records.filter(r => {
        const d = r.date.substring(0, 10);
        return d >= wss && d <= wes;
      });

      weeks.push({
        label: `第${w + 1}周`,
        totalTime: weekRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
        completed: weekRecords.filter(r => r.completed).length,
        total: weekRecords.length,
      });
    }

    return weeks;
  },

  getYearChartData(records) {
    const year = this.currentDate.getFullYear();
    const months = [];

    for (let m = 0; m < 12; m++) {
      const ms = new Date(year, m, 1);
      const me = new Date(year, m + 1, 0);
      const mss = Utils.formatDateISO(ms);
      const mes = Utils.formatDateISO(me);

      const monthRecords = records.filter(r => {
        const d = r.date.substring(0, 10);
        return d >= mss && d <= mes;
      });

      months.push({
        label: `${m + 1}月`,
        totalTime: monthRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
        completed: monthRecords.filter(r => r.completed).length,
        total: monthRecords.length,
      });
    }

    return months;
  },

  getGoalBreakdown(records) {
    const goals = Storage.getGoals();
    const goalMap = {};

    records.forEach(r => {
      if (!r.goalId) return;
      if (!goalMap[r.goalId]) {
        goalMap[r.goalId] = { totalTime: 0, completed: 0, total: 0 };
      }
      goalMap[r.goalId].totalTime += (r.duration || 0);
      if (r.completed) goalMap[r.goalId].completed++;
      goalMap[r.goalId].total++;
    });

    return goals
      .filter(g => goalMap[g.id])
      .map(g => ({
        id: g.id,
        title: g.title,
        color: Utils.getGoalColor(g.color),
        totalTime: goalMap[g.id].totalTime,
        completed: goalMap[g.id].completed,
        total: goalMap[g.id].total,
      }))
      .sort((a, b) => b.totalTime - a.totalTime);
  },

  /* ---------- formatting ---------- */

  formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0分钟';
    if (seconds < 60) return `${seconds}秒`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}分钟`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}小时${rm}分钟` : `${h}小时`;
  },

  formatDurationShort(seconds) {
    if (!seconds || seconds < 0) return '0';
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}分钟`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return rm > 0 ? `${h}h${rm}m` : `${h}h`;
  },

  /* ---------- rendering ---------- */

  render() {
    const app = document.getElementById('app');
    const records = this.getRecordsForPeriod();
    const stats = this.calculateStats(records);
    const chartData = this.getChartData(records);
    const goalBreakdown = this.getGoalBreakdown(records);
    const dateText = this.getDateText();
    const hasData = records.length > 0;
    const canNext = this.canGoNext();

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
            <button class="icon-btn" id="date-prev" aria-label="上${this.getPeriodLabel()}" style="color: var(--color-text-tertiary);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span class="date-nav-text">${dateText}</span>
            <button class="icon-btn" id="date-next" aria-label="下${this.getPeriodLabel()}" style="color: var(--color-text-tertiary); ${canNext ? '' : 'opacity: 0.3; pointer-events: none;'}" ${canNext ? '' : 'disabled'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          ${hasData ? this.renderStatsGrid(stats) : this.renderEmptyState()}

          ${hasData && chartData ? this.renderChart(chartData) : ''}

          ${hasData && goalBreakdown.length > 0 ? this.renderGoalBreakdown(goalBreakdown) : ''}
        </div>

        ${Goals.renderTabBar('analytics')}
      </div>
    `;

    this.attachEvents();
    lucide.createIcons();
  },

  getPeriodLabel() {
    const map = { day: '一天', week: '一周', month: '一月', year: '一年' };
    return map[this.currentPeriod] || '一天';
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
        <p class="empty-state-text">暂无数据，开始专注吧！</p>
      </div>
    `;
  },

  renderStatsGrid(stats) {
    return `
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
            <span class="stat-label">专注时长</span>
            <span class="stat-value">${this.formatDurationShort(stats.totalTime)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">待完成</span>
            <span class="stat-value">${stats.pending}</span>
          </div>
        </div>
      </section>
    `;
  },

  renderChart(chartData) {
    const maxTime = Math.max(...chartData.map(d => d.totalTime), 1);
    const barCount = chartData.length;

    const chartTitle = {
      week: '每日专注时长',
      month: '每周专注时长',
      year: '每月专注时长',
    }[this.currentPeriod] || '专注时长分布';

    return `
      <section class="card" style="padding: var(--space-lg);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-lg);">
          <span style="font-size: var(--text-base); color: var(--color-text-primary); font-weight: var(--font-weight-medium);">${chartTitle}</span>
        </div>
        <div style="display: flex; align-items: flex-end; gap: ${barCount <= 7 ? '6px' : '3px'}; height: 140px; padding: 0 2px;">
          ${chartData.map(d => {
            const heightPct = maxTime > 0 ? Math.max((d.totalTime / maxTime) * 100, 3) : 3;
            const showValue = d.totalTime > 0;
            const valueText = this.formatDurationShort(d.totalTime);
            return `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; min-width: 0;">
                ${showValue ? `<span style="font-size: 10px; color: var(--color-text-tertiary); margin-bottom: 4px; white-space: nowrap;">${valueText}</span>` : ''}
                <div style="width: 100%; max-width: ${barCount <= 7 ? '32px' : '24px'}; background: var(--color-primary); border-radius: 3px 3px 0 0; height: ${heightPct}%; transition: height 0.3s ease; opacity: ${d.totalTime > 0 ? '1' : '0.2'};"></div>
                <span style="font-size: 11px; color: var(--color-text-tertiary); margin-top: 6px; white-space: nowrap;">${d.label}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-sm); margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--color-border);">
          <span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">总计完成</span>
          <span style="font-size: var(--text-sm); color: var(--color-text-primary); font-weight: var(--font-weight-semibold);">${chartData.reduce((s, d) => s + d.completed, 0)} 次</span>
          <span style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-left: auto;">总专注</span>
          <span style="font-size: var(--text-sm); color: var(--color-text-primary); font-weight: var(--font-weight-semibold);">${this.formatDurationShort(chartData.reduce((s, d) => s + d.totalTime, 0))}</span>
        </div>
      </section>
    `;
  },

  renderGoalBreakdown(goalBreakdown) {
    const maxTime = Math.max(...goalBreakdown.map(g => g.totalTime), 1);

    return `
      <section class="card" style="padding: var(--space-lg);">
        <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-lg);">
          <span style="font-size: var(--text-base); color: var(--color-text-primary); font-weight: var(--font-weight-medium);">目标分布</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: var(--space-md);">
          ${goalBreakdown.map(g => {
            const barPct = (g.totalTime / maxTime) * 100;
            return `
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; align-items: center; gap: var(--space-sm);">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: ${g.color}; flex-shrink: 0;"></span>
                  <span style="font-size: var(--text-sm); color: var(--color-text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${Utils.escapeHtml(g.title)}</span>
                  <span style="font-size: var(--text-xs); color: var(--color-text-tertiary); flex-shrink: 0;">${this.formatDurationShort(g.totalTime)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-sm);">
                  <div style="flex: 1; height: 6px; background: var(--color-bg-secondary); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${barPct}%; background: ${g.color}; border-radius: 3px; transition: width 0.3s ease;"></div>
                  </div>
                  <span style="font-size: var(--text-xs); color: var(--color-text-tertiary); flex-shrink: 0;">${g.completed}次</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  },

  /* ---------- events ---------- */

  attachEvents() {
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        App.navigate(tabName);
      });
    });

    document.querySelectorAll('.segment-control-item').forEach(item => {
      item.addEventListener('click', () => {
        this.currentPeriod = item.dataset.period;
        this.currentDate = new Date();
        this.render();
      });
    });

    document.getElementById('date-prev').addEventListener('click', () => {
      this.changeDate(-1);
    });

    const nextBtn = document.getElementById('date-next');
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.addEventListener('click', () => {
        this.changeDate(1);
      });
    }
  },

  changeDate(delta) {
    if (delta > 0 && !this.canGoNext()) return;

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
};