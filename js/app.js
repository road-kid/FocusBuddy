const App = {
  currentPage: 'goals',
  currentParams: {},

  init() {
    this.initData();
    this.initHashRouter();
    this.handleRoute();

    window.addEventListener('hashchange', () => this.handleRoute());
  },

  initData() {
    const config = Storage.getConfig();
    if (!config.inited) {
      Storage.init();
    }
    // Initialize demo data
    if (DemoData && typeof DemoData.initDemoData === 'function') {
      DemoData.initDemoData();
    }
  },

  initHashRouter() {
    if (!window.location.hash) {
      const config = Storage.getConfig();
      if (config.onboarded) {
        // Default to map view if goals exist
        const goals = Storage.getGoals().filter(g => !g.archived);
        if (goals.length > 0) {
          window.location.hash = `#/map/${goals[0].id}`;
        } else {
          window.location.hash = '#/goals';
        }
      } else {
        window.location.hash = '#/onboard';
      }
    }
  },

  handleRoute() {
    const hash = window.location.hash.slice(2) || 'goals';
    const parts = hash.split('/');
    const page = parts[0];
    const params = parts.slice(1);

    if (Timer && typeof Timer.destroy === 'function') {
      Timer.destroy();
    }

    // Cleanup map/sidebar when navigating away
    if (this.currentPage === 'map' && page !== 'map') {
      if (GoalMap && typeof GoalMap.destroy === 'function') {
        GoalMap.unbindEvents();
        GoalMap.destroy();
      }
    }

    switch (page) {
      case 'onboard':
        Onboard.init();
        break;
      case 'chat':
        Chat.init();
        break;
      case 'goals':
        Goals.init();
        break;
      case 'map':
        this.initMapPage(params[0]);
        break;
      case 'schedule':
        Schedule.init();
        break;
      case 'analytics':
        Analytics.init();
        break;
      case 'settings':
        Settings.init();
        break;
      case 'goal':
        GoalDetail.init(params[0]);
        break;
      case 'timer':
        Timer.init(params[0]);
        break;
      default:
        Goals.init();
    }

    this.currentPage = page;
    this.currentParams = params;
    window.scrollTo(0, 0);
  },

  initMapPage(goalId) {
    const app = document.getElementById('app');

    // If no goalId, redirect to first available goal
    if (!goalId) {
      const goals = Storage.getGoals().filter(g => !g.archived);
      if (goals.length > 0) {
        window.location.hash = `#/map/${goals[0].id}`;
        return;
      }
      window.location.hash = '#/goals';
      return;
    }

    const goal = Storage.getGoals().find(g => g.id === goalId);
    if (!goal) {
      window.location.hash = '#/goals';
      return;
    }

    const goals = Storage.getGoals().filter(g => !g.archived);
    const goalColor = Utils.getGoalColor(goal.color || 'purple');
    const progress = Progress.calculateGoalProgress(goalId);
    const progressPct = Math.round(progress * 100);

    app.innerHTML = `
      <div class="map-page-container">
        <header class="map-header">
          <div class="map-header-left">
            <a href="#/goals" class="map-back-btn" aria-label="返回目标列表">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </a>
            <div class="map-header-info">
              <span class="map-header-dot" style="background: ${goalColor}"></span>
              <h1 class="map-header-title">${Utils.escapeHtml(goal.name)}</h1>
            </div>
          </div>
          <div class="map-header-right">
            <span class="map-header-progress">${progressPct}%</span>
            ${goals.length > 1 ? `
              <div class="map-goal-switcher" id="map-goal-switcher">
                <button class="map-switcher-btn" id="map-switcher-btn" aria-label="切换目标">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
            ` : ''}
          </div>
        </header>

        <div class="goal-map-container" id="goal-map-canvas"></div>

        <div class="map-toolbar">
          <button class="map-tool-btn" id="map-btn-fit" aria-label="适应视图">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
          <button class="map-tool-btn" id="map-btn-zoom-in" aria-label="放大">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button class="map-tool-btn" id="map-btn-zoom-out" aria-label="缩小">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </div>

        ${this.renderTabBar('map')}
      </div>
    `;

    // Initialize the map
    const container = document.getElementById('goal-map-canvas');
    if (container && GoalMap) {
      GoalMap.init(goalId, container);
    }

    // Toolbar events
    const fitBtn = document.getElementById('map-btn-fit');
    if (fitBtn) fitBtn.addEventListener('click', () => GoalMap.fitToView());

    const zoomInBtn = document.getElementById('map-btn-zoom-in');
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
      const rect = GoalMap.svg.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const newScale = Math.min(3, GoalMap.scale * 1.3);
      GoalMap.tx = cx - (cx - GoalMap.tx) * (newScale / GoalMap.scale);
      GoalMap.ty = cy - (cy - GoalMap.ty) * (newScale / GoalMap.scale);
      GoalMap.scale = newScale;
      GoalMap.updateTransform();
    });

    const zoomOutBtn = document.getElementById('map-btn-zoom-out');
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
      const rect = GoalMap.svg.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const newScale = Math.max(0.15, GoalMap.scale * 0.7);
      GoalMap.tx = cx - (cx - GoalMap.tx) * (newScale / GoalMap.scale);
      GoalMap.ty = cy - (cy - GoalMap.ty) * (newScale / GoalMap.scale);
      GoalMap.scale = newScale;
      GoalMap.updateTransform();
    });

    // Goal switcher
    const switcherBtn = document.getElementById('map-switcher-btn');
    if (switcherBtn) {
      switcherBtn.addEventListener('click', () => this.showGoalSwitcher(goals, goalId));
    }
  },

  showGoalSwitcher(goals, currentGoalId) {
    const overlay = document.createElement('div');
    overlay.className = 'action-sheet-overlay show';
    overlay.innerHTML = `
      <div class="action-sheet">
        <div style="padding: var(--space-md) var(--space-lg); font-size: var(--text-sm); color: var(--color-text-tertiary);">选择目标</div>
        ${goals.map(g => {
          const color = Utils.getGoalColor(g.color);
          const pct = Math.round(Progress.calculateGoalProgress(g.id) * 100);
          const isActive = g.id === currentGoalId;
          return `
            <div class="action-sheet-item ${isActive ? 'action-sheet-item--active' : ''}" data-goal-id="${g.id}" style="display: flex; align-items: center; gap: var(--space-md);">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; flex-shrink: 0;"></span>
              <span style="flex: 1; text-align: left;">${Utils.escapeHtml(g.name)}</span>
              <span style="font-size: var(--text-sm); color: var(--color-text-tertiary);">${pct}%</span>
              ${isActive ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--state-success)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </div>
          `;
        }).join('')}
        <div class="action-sheet-item action-sheet-item--cancel">取消</div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.action-sheet-item[data-goal-id]').forEach(el => {
      el.addEventListener('click', () => {
        overlay.remove();
        const gId = el.dataset.goalId;
        if (gId !== currentGoalId) {
          window.location.hash = `#/map/${gId}`;
        }
      });
    });

    overlay.querySelector('.action-sheet-item--cancel').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },

  renderTabBar(active) {
    return `
      <nav class="bottom-tab-bar" role="tablist">
        <a href="#/goals" class="tab-item ${active === 'goals' ? 'active' : ''}" role="tab" aria-selected="${active === 'goals'}">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
          <span>目标</span>
        </a>
        <a href="#/map" class="tab-item ${active === 'map' ? 'active' : ''}" role="tab" aria-selected="${active === 'map'}">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <span>地图</span>
        </a>
        <a href="#/analytics" class="tab-item ${active === 'analytics' ? 'active' : ''}" role="tab" aria-selected="${active === 'analytics'}">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>统计</span>
        </a>
        <a href="#/settings" class="tab-item ${active === 'settings' ? 'active' : ''}" role="tab" aria-selected="${active === 'settings'}">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>设置</span>
        </a>
      </nav>
    `;
  },

  navigate(path) {
    window.location.hash = `#/${path}`;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
