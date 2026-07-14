const App = {
  currentPage: 'goals',
  currentParams: {},

  init() {
    this.initHashRouter();
    this.initData();
    this.handleRoute();

    window.addEventListener('hashchange', () => this.handleRoute());
  },

  initData() {
    const config = Storage.getConfig();
    if (!config.inited) {
      Storage.init();
    }
  },

  initHashRouter() {
    if (!window.location.hash) {
      const config = Storage.getConfig();
      if (config.onboarded) {
        window.location.hash = '#/goals';
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

  navigate(path) {
    window.location.hash = `#/${path}`;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
