const Timer = {
  goalId: null,
  nodeId: null,
  nodeTitle: null,
  seconds: 0,
  totalSeconds: 0,
  isRunning: false,
  timerInterval: null,
  mode: 'focus',
  sessionCount: 0,
  config: null,

  init(goalId) {
    this.goalId = goalId || null;
    this.nodeId = null;
    this.nodeTitle = null;
    this.isRunning = false;
    this.mode = 'focus';
    this.sessionCount = 0;
    this.config = Storage.getConfig();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.seconds = this.config.focusDuration * 60;
    this.totalSeconds = this.config.focusDuration * 60;

    const leafTasks = this.getLeafTasks();
    if (leafTasks.length > 0) {
      this.showTaskSelector(leafTasks);
    } else {
      this.render();
    }
  },

  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
  },

  getLeafTasks() {
    if (!this.goalId) return [];
    const allNodes = Storage.getGoalNodes(this.goalId);
    return allNodes.filter(node => {
      const children = Storage.getChildNodes(node.id);
      return children.length === 0;
    });
  },

  showTaskSelector(tasks) {
    const app = document.getElementById('app');
    const goal = this.goalId ? Storage.getGoals().find(g => g.id === this.goalId) : null;
    const color = goal ? Utils.getGoalColor(goal.color) : 'var(--color-primary)';

    app.innerHTML = `
      <div class="page-container" style="display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh;">
        <div style="height: var(--status-bar-height);"></div>
        <header class="flex items-center justify-between" style="padding: var(--space-md) var(--space-lg); height: var(--nav-height);">
          <button class="icon-btn" id="btn-task-selector-back" aria-label="返回">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0;">选择任务</h1>
          <div style="width: 40px;"></div>
        </header>

        <div class="flex-1" style="padding: 0 var(--space-lg); overflow-y: auto;">
          ${goal ? `
            <div class="flex items-center gap-2" style="margin-bottom: var(--space-lg);">
              <span style="width: 3px; height: 16px; background: ${color}; border-radius: 2px;"></span>
              <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">${Utils.escapeHtml(goal.title)}</span>
            </div>
          ` : ''}

          <p style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin: 0 0 var(--space-md);">选择一个要专注的任务</p>

          <div class="card" style="padding: 0; overflow: hidden;">
            ${tasks.map(task => `
              <button class="task-select-item" data-node-id="${task.id}" data-node-title="${Utils.escapeHtml(task.title)}" style="
                display: flex; align-items: center; gap: var(--space-md);
                width: 100%; padding: var(--space-md) var(--space-lg);
                background: none; border: none; border-bottom: 1px solid var(--color-border);
                cursor: pointer; text-align: left; transition: background 0.15s;
              ">
                <div class="task-select-radio" data-node-id="${task.id}" style="
                  width: 20px; height: 20px; border-radius: 50%;
                  border: 2px solid var(--color-border);
                  flex-shrink: 0; transition: all 0.15s;
                "></div>
                <span style="font-size: var(--text-base); color: var(--color-text-primary);">${Utils.escapeHtml(task.title)}</span>
              </button>
            `).join('')}
          </div>

          <div class="flex gap-3" style="margin-top: var(--space-xl);">
            <button class="btn-secondary flex-1" id="btn-skip-task" style="padding: var(--space-md);">跳过</button>
            <button class="btn-primary flex-1" id="btn-confirm-task" disabled style="padding: var(--space-md);">开始专注</button>
          </div>
        </div>
      </div>
    `;

    let selectedNodeId = null;
    let selectedNodeTitle = null;

    document.getElementById('btn-task-selector-back').addEventListener('click', () => {
      const goal = this.goalId ? Storage.getGoals().find(g => g.id === this.goalId) : null;
      App.navigate(goal ? `goal/${goal.id}` : 'goals');
    });

    document.querySelectorAll('.task-select-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedNodeId = item.dataset.nodeId;
        selectedNodeTitle = item.dataset.nodeTitle;

        document.querySelectorAll('.task-select-item').forEach(i => {
          i.style.background = 'none';
        });
        document.querySelectorAll('.task-select-radio').forEach(r => {
          r.style.borderColor = 'var(--color-border)';
          r.style.background = 'none';
        });

        item.style.background = 'var(--color-bg-card-alt)';
        const radio = document.querySelector(`.task-select-radio[data-node-id="${selectedNodeId}"]`);
        if (radio) {
          radio.style.borderColor = color;
          radio.style.background = color;
        }

        const confirmBtn = document.getElementById('btn-confirm-task');
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
      });
    });

    document.getElementById('btn-skip-task').addEventListener('click', () => {
      this.nodeId = null;
      this.nodeTitle = null;
      this.render();
    });

    document.getElementById('btn-confirm-task').addEventListener('click', () => {
      if (selectedNodeId) {
        this.nodeId = selectedNodeId;
        this.nodeTitle = selectedNodeTitle;
      }
      this.render();
    });
  },

  render() {
    const app = document.getElementById('app');
    const goal = this.goalId ? Storage.getGoals().find(g => g.id === this.goalId) : null;
    const color = goal ? Utils.getGoalColor(goal.color) : 'var(--color-primary)';

    const minutes = Math.floor(this.seconds / 60);
    const secs = this.seconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const progress = this.totalSeconds > 0 ? 1 - (this.seconds / this.totalSeconds) : 0;

    const circumference = 2 * Math.PI * 120;
    const offset = circumference * (1 - progress);

    const gradientColors = this.getGradientColors();
    const modeLabel = this.getModeLabel();

    const sessionInfo = this.mode === 'focus'
      ? `第 ${this.sessionCount + 1} 个番茄钟`
      : (this.mode === 'longBreak'
        ? `已完成 ${this.sessionCount} 个番茄钟`
        : `已完成 ${this.sessionCount} 个番茄钟`);

    app.innerHTML = `
      <div class="page-container" style="display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh;">
        <div style="height: var(--status-bar-height);"></div>

        <header class="flex items-center justify-between" style="padding: var(--space-md) var(--space-lg); height: var(--nav-height);">
          <button class="icon-btn" id="btn-timer-back" aria-label="返回">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0;">专注计时</h1>
          <button class="icon-btn" id="btn-timer-settings" aria-label="设置">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-secondary);">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </header>

        <div class="flex-1 flex flex-col items-center justify-center" style="padding: 0 var(--space-xl);">
          ${goal ? `
            <span class="goal-tag" style="background: ${color}26; color: ${color}; margin-bottom: var(--space-sm);">
              ${Utils.escapeHtml(goal.title)}
            </span>
          ` : ''}

          ${this.nodeTitle ? `
            <span class="task-pill" style="margin-bottom: var(--space-lg); font-size: var(--text-sm); color: var(--color-text-secondary);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; flex-shrink: 0;">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              ${Utils.escapeHtml(this.nodeTitle)}
            </span>
          ` : ''}

          <div class="timer-ring" style="position: relative; width: 260px; height: 260px; margin-bottom: var(--space-lg);">
            <svg style="width: 100%; height: 100%; transform: rotate(-90deg);">
              <circle cx="130" cy="130" r="120" stroke="var(--color-bg-card-alt)" stroke-width="8" fill="none" />
              <circle cx="130" cy="130" r="120"
                stroke="url(#timerGradient)"
                stroke-width="8"
                fill="none"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                style="transition: ${this.isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.5s ease'};"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="${gradientColors[0]}" />
                  <stop offset="100%" stop-color="${gradientColors[1]}" />
                </linearGradient>
              </defs>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span class="timer-display" style="font-size: 48px; font-weight: 700; color: var(--color-text-primary); letter-spacing: 2px; font-variant-numeric: tabular-nums; line-height: 1;">
                ${timeStr}
              </span>
              <span style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-sm);">
                ${modeLabel}
              </span>
              <span style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 4px;">
                ${sessionInfo}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4" style="margin-bottom: var(--space-lg);">
            <button class="timer-btn timer-btn--secondary" id="btn-reset" aria-label="重置">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>

            <button class="timer-btn timer-btn--primary" id="btn-toggle-timer" aria-label="${this.isRunning ? '暂停' : '开始'}">
              ${this.isRunning ? `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ` : `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" style="margin-left: 2px;"/>
                </svg>
              `}
            </button>

            <button class="timer-btn timer-btn--secondary" id="btn-skip" aria-label="跳过">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 4 15 12 5 20 5 4"/>
                <line x1="19" y1="5" x2="19" y2="19"/>
              </svg>
            </button>
          </div>

          <div class="flex flex-col items-center gap-1" style="margin-bottom: var(--space-xl);">
            <div class="flex items-center gap-2">
              <span class="mode-badge mode-badge--${this.mode}" style="
                display: inline-flex; align-items: center; gap: 4px;
                padding: 4px 12px; border-radius: var(--radius-full);
                font-size: var(--text-xs); font-weight: var(--font-weight-medium);
                background: ${gradientColors[0]}18; color: ${gradientColors[0]};
              ">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${gradientColors[0]};"></span>
                ${this.getModeBadgeLabel()}
              </span>
            </div>
          </div>
        </div>

        ${this.renderSettingsModal(gradientColors[0])}
      </div>
    `;

    document.getElementById('btn-timer-back').addEventListener('click', () => {
      this.destroy();
      if (this.goalId) {
        const g = Storage.getGoals().find(g => g.id === this.goalId);
        App.navigate(g ? `goal/${g.id}` : 'goals');
      } else {
        App.navigate('goals');
      }
    });

    document.getElementById('btn-timer-settings').addEventListener('click', () => {
      this.showSettingsModal();
    });

    document.getElementById('btn-toggle-timer').addEventListener('click', () => this.toggleTimer());
    document.getElementById('btn-reset').addEventListener('click', () => this.resetTimer());
    document.getElementById('btn-skip').addEventListener('click', () => this.skipTimer());

    this.bindSettingsModalEvents();
  },

  getGradientColors() {
    switch (this.mode) {
      case 'focus':
        return ['#6366F1', '#8B5CF6'];
      case 'break':
        return ['#22C55E', '#14B8A6'];
      case 'longBreak':
        return ['#3B82F6', '#06B6D4'];
      default:
        return ['#6366F1', '#8B5CF6'];
    }
  },

  getModeLabel() {
    switch (this.mode) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'longBreak':
        return '长休息';
      default:
        return '';
    }
  },

  getModeBadgeLabel() {
    const duration = this.totalSeconds / 60;
    switch (this.mode) {
      case 'focus':
        return `番茄钟 ${duration}分钟`;
      case 'break':
        return `短休息 ${duration}分钟`;
      case 'longBreak':
        return `长休息 ${duration}分钟`;
      default:
        return '';
    }
  },

  renderSettingsModal(accentColor) {
    const f = this.config.focusDuration;
    const b = this.config.breakDuration;
    const lb = this.config.longBreakDuration;
    const li = this.config.longBreakInterval;

    const focusPresets = [15, 20, 25, 30, 45, 60];
    const breakPresets = [3, 5, 10, 15];
    const longBreakPresets = [10, 15, 20, 30];
    const intervalPresets = [2, 3, 4, 5];

    const renderPresets = (presets, current, prefix) => presets.map(p => `
      <button class="settings-preset-btn ${p === current ? 'settings-preset-btn--active' : ''}"
        data-${prefix}-value="${p}"
        style="
          padding: 6px 14px; border-radius: var(--radius-full);
          font-size: var(--text-sm); border: 1px solid var(--color-border);
          background: ${p === current ? accentColor : 'transparent'};
          color: ${p === current ? '#fff' : 'var(--color-text-primary)'};
          cursor: pointer; transition: all 0.15s;
        ">${p}分钟</button>
    `).join('');

    const renderIntervalPresets = (presets, current) => presets.map(p => `
      <button class="settings-preset-btn ${p === current ? 'settings-preset-btn--active' : ''}"
        data-interval-value="${p}"
        style="
          padding: 6px 14px; border-radius: var(--radius-full);
          font-size: var(--text-sm); border: 1px solid var(--color-border);
          background: ${p === current ? accentColor : 'transparent'};
          color: ${p === current ? '#fff' : 'var(--color-text-primary)'};
          cursor: pointer; transition: all 0.15s;
        ">${p}次</button>
    `).join('');

    return `
      <div class="modal-overlay" id="settings-modal" style="display: none;">
        <div class="modal-sheet">
          <div class="modal-header">
            <span class="modal-title">计时设置</span>
            <button class="icon-btn" id="btn-close-settings" aria-label="关闭" style="color: var(--color-text-secondary);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom: var(--space-xl);">
              <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); display: block; margin-bottom: var(--space-sm);">专注时长</label>
              <div class="flex flex-wrap gap-2" id="focus-presets">
                ${renderPresets(focusPresets, f, 'focus')}
              </div>
              <div class="flex items-center gap-2" style="margin-top: var(--space-sm);">
                <input type="number" id="input-focus-duration" value="${f}" min="1" max="120"
                  style="width: 72px; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-primary); font-size: var(--text-sm); text-align: center;">
                <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">分钟</span>
              </div>
            </div>

            <div style="margin-bottom: var(--space-xl);">
              <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); display: block; margin-bottom: var(--space-sm);">短休息时长</label>
              <div class="flex flex-wrap gap-2" id="break-presets">
                ${renderPresets(breakPresets, b, 'break')}
              </div>
              <div class="flex items-center gap-2" style="margin-top: var(--space-sm);">
                <input type="number" id="input-break-duration" value="${b}" min="1" max="60"
                  style="width: 72px; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-primary); font-size: var(--text-sm); text-align: center;">
                <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">分钟</span>
              </div>
            </div>

            <div style="margin-bottom: var(--space-xl);">
              <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); display: block; margin-bottom: var(--space-sm);">长休息时长</label>
              <div class="flex flex-wrap gap-2" id="longbreak-presets">
                ${renderPresets(longBreakPresets, lb, 'longbreak')}
              </div>
              <div class="flex items-center gap-2" style="margin-top: var(--space-sm);">
                <input type="number" id="input-longbreak-duration" value="${lb}" min="1" max="120"
                  style="width: 72px; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-primary); font-size: var(--text-sm); text-align: center;">
                <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">分钟</span>
              </div>
            </div>

            <div style="margin-bottom: var(--space-xl);">
              <label style="font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); display: block; margin-bottom: var(--space-sm);">长休息间隔</label>
              <div class="flex flex-wrap gap-2" id="interval-presets">
                ${renderIntervalPresets(intervalPresets, li)}
              </div>
              <div class="flex items-center gap-2" style="margin-top: var(--space-sm);">
                <input type="number" id="input-interval" value="${li}" min="1" max="10"
                  style="width: 72px; padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-primary); font-size: var(--text-sm); text-align: center;">
                <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">个番茄钟后</span>
              </div>
            </div>

            <div class="flex gap-3" style="margin-top: var(--space-xl);">
              <button class="btn-secondary flex-1" id="btn-reset-settings" style="padding: var(--space-md);">恢复默认</button>
              <button class="btn-primary flex-1" id="btn-save-settings" style="padding: var(--space-md);">保存</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindSettingsModalEvents() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    const accentColor = this.getGradientColors()[0];

    const updatePresetStyles = (containerId, value) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.querySelectorAll('.settings-preset-btn').forEach(btn => {
        const isActive = parseInt(btn.dataset[Object.keys(btn.dataset)[0]]) === value;
        btn.style.background = isActive ? accentColor : 'transparent';
        btn.style.color = isActive ? '#fff' : 'var(--color-text-primary)';
        btn.classList.toggle('settings-preset-btn--active', isActive);
      });
    };

    document.getElementById('btn-close-settings').addEventListener('click', () => this.hideSettingsModal());

    const focusPresets = document.getElementById('focus-presets');
    if (focusPresets) {
      focusPresets.querySelectorAll('.settings-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.focusValue);
          document.getElementById('input-focus-duration').value = val;
          updatePresetStyles('focus-presets', val);
        });
      });
    }

    const breakPresets = document.getElementById('break-presets');
    if (breakPresets) {
      breakPresets.querySelectorAll('.settings-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.breakValue);
          document.getElementById('input-break-duration').value = val;
          updatePresetStyles('break-presets', val);
        });
      });
    }

    const longbreakPresets = document.getElementById('longbreak-presets');
    if (longbreakPresets) {
      longbreakPresets.querySelectorAll('.settings-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.longbreakValue);
          document.getElementById('input-longbreak-duration').value = val;
          updatePresetStyles('longbreak-presets', val);
        });
      });
    }

    const intervalPresets = document.getElementById('interval-presets');
    if (intervalPresets) {
      intervalPresets.querySelectorAll('.settings-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.intervalValue);
          document.getElementById('input-interval').value = val;
          updatePresetStyles('interval-presets', val);
        });
      });
    }

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      const focusDuration = Math.max(1, Math.min(120, parseInt(document.getElementById('input-focus-duration').value) || 25));
      const breakDuration = Math.max(1, Math.min(60, parseInt(document.getElementById('input-break-duration').value) || 5));
      const longBreakDuration = Math.max(1, Math.min(120, parseInt(document.getElementById('input-longbreak-duration').value) || 15));
      const longBreakInterval = Math.max(1, Math.min(10, parseInt(document.getElementById('input-interval').value) || 4));

      const newConfig = {
        ...this.config,
        focusDuration,
        breakDuration,
        longBreakDuration,
        longBreakInterval,
      };
      Storage.saveConfig(newConfig);
      this.config = newConfig;

      this.hideSettingsModal();

      this.pauseTimer();
      this.sessionCount = 0;
      this.mode = 'focus';
      this.seconds = this.config.focusDuration * 60;
      this.totalSeconds = this.config.focusDuration * 60;
      this.render();
    });

    document.getElementById('btn-reset-settings').addEventListener('click', () => {
      document.getElementById('input-focus-duration').value = 25;
      document.getElementById('input-break-duration').value = 5;
      document.getElementById('input-longbreak-duration').value = 15;
      document.getElementById('input-interval').value = 4;
      updatePresetStyles('focus-presets', 25);
      updatePresetStyles('break-presets', 5);
      updatePresetStyles('longbreak-presets', 15);
      updatePresetStyles('interval-presets', 4);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideSettingsModal();
      }
    });
  },

  showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'flex';
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
    }
  },

  hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  },

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timerInterval = setInterval(() => {
      if (this.seconds > 0) {
        this.seconds--;
        this.updateDisplay();
      } else {
        this.completeTimer();
      }
    }, 1000);
    this.render();
  },

  pauseTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.render();
  },

  resetTimer() {
    this.pauseTimer();
    this.seconds = this.getModeDuration() * 60;
    this.totalSeconds = this.seconds;
    this.render();
  },

  skipTimer() {
    this.pauseTimer();
    this.goToNextMode();
    this.render();
  },

  completeTimer() {
    this.pauseTimer();

    if (this.mode === 'focus') {
      this.sessionCount++;
      const durationMinutes = this.config.focusDuration;
      const record = {
        id: Utils.generateId(),
        goalId: this.goalId,
        nodeId: this.nodeId || null,
        type: 'timer',
        duration: durationMinutes * 60,
        date: Utils.getTodayStr(),
        mode: this.mode,
      };
      Storage.addRecord(record);
    }

    this.goToNextMode();
    this.render();
  },

  goToNextMode() {
    if (this.mode === 'focus') {
      if (this.sessionCount > 0 && this.sessionCount % this.config.longBreakInterval === 0) {
        this.mode = 'longBreak';
        this.seconds = this.config.longBreakDuration * 60;
        this.totalSeconds = this.config.longBreakDuration * 60;
      } else {
        this.mode = 'break';
        this.seconds = this.config.breakDuration * 60;
        this.totalSeconds = this.config.breakDuration * 60;
      }
    } else {
      this.mode = 'focus';
      this.seconds = this.config.focusDuration * 60;
      this.totalSeconds = this.config.focusDuration * 60;
    }
  },

  getModeDuration() {
    switch (this.mode) {
      case 'focus':
        return this.config.focusDuration;
      case 'break':
        return this.config.breakDuration;
      case 'longBreak':
        return this.config.longBreakDuration;
      default:
        return this.config.focusDuration;
    }
  },

  updateDisplay() {
    const minutes = Math.floor(this.seconds / 60);
    const secs = this.seconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const timeEl = document.querySelector('.timer-ring .timer-display');
    if (timeEl) {
      timeEl.textContent = timeStr;
    }

    const progress = this.totalSeconds > 0 ? 1 - (this.seconds / this.totalSeconds) : 0;
    const circumference = 2 * Math.PI * 120;
    const offset = circumference * (1 - progress);
    const progressCircle = document.querySelector('.timer-ring circle:nth-child(2)');
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = offset;
    }
  },
};