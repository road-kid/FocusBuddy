const Timer = {
  goalId: null,
  seconds: 0,
  isRunning: false,
  timerInterval: null,
  totalSeconds: 25 * 60,
  mode: 'focus',

  init(goalId) {
    this.goalId = goalId;
    this.seconds = 25 * 60;
    this.totalSeconds = 25 * 60;
    this.isRunning = false;
    this.mode = 'focus';
    this.render();
  },

  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  render() {
    const app = document.getElementById('app');
    const goal = Storage.getGoals().find(g => g.id === this.goalId);
    const color = goal ? Utils.getGoalColor(goal.color) : 'var(--color-primary)';

    const minutes = Math.floor(this.seconds / 60);
    const secs = this.seconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const progress = 1 - (this.seconds / this.totalSeconds);

    const circumference = 2 * Math.PI * 120;
    const offset = circumference * (1 - progress);

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
          <button class="icon-btn" aria-label="设置" style="color: var(--color-text-secondary);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </header>

        <div class="flex-1 flex flex-col items-center justify-center" style="padding: 0 var(--space-xl);">
          ${goal ? `
            <span class="goal-tag" style="background: ${color}26; color: ${color}; margin-bottom: var(--space-2xl);">
              ${Utils.escapeHtml(goal.title)}
            </span>
          ` : ''}

          <div class="timer-circle" style="position: relative; width: 260px; height: 260px; margin-bottom: var(--space-2xl);">
            <svg style="width: 100%; height: 100%; transform: rotate(-90deg);">
              <circle cx="130" cy="130" r="120" stroke="var(--color-bg-card-alt)" stroke-width="8" fill="none" />
              <circle cx="130" cy="130" r="120"
                stroke="url(#timerGradient)"
                stroke-width="8"
                fill="none"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                style="transition: stroke-dashoffset 0.5s ease;"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#6366F1" />
                  <stop offset="100%" stop-color="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 48px; font-weight: 700; color: var(--color-text-primary); letter-spacing: 2px; font-variant-numeric: tabular-nums; line-height: 1;">
                ${timeStr}
              </span>
              <span style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-sm);">
                ${this.mode === 'focus' ? '专注中' : '休息中'}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4" style="margin-bottom: var(--space-2xl);">
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

          <div class="flex items-center gap-2 flex-wrap" style="justify-content: center;">
            <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">模式：</span>
            <span class="badge badge--secondary">番茄钟 25分钟</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-timer-back').addEventListener('click', () => {
      this.destroy();
      App.navigate(goal ? `goal/${goal.id}` : 'goals');
    });

    document.getElementById('btn-toggle-timer').addEventListener('click', () => this.toggleTimer());
    document.getElementById('btn-reset').addEventListener('click', () => this.resetTimer());
    document.getElementById('btn-skip').addEventListener('click', () => this.skipTimer());
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
    this.seconds = this.totalSeconds;
    this.render();
  },

  skipTimer() {
    this.pauseTimer();
    if (this.mode === 'focus') {
      this.mode = 'break';
      this.seconds = 5 * 60;
      this.totalSeconds = 5 * 60;
    } else {
      this.mode = 'focus';
      this.seconds = 25 * 60;
      this.totalSeconds = 25 * 60;
    }
    this.render();
  },

  completeTimer() {
    this.pauseTimer();
    const elapsedSeconds = this.totalSeconds;
    if (this.goalId && this.mode === 'focus') {
      const record = {
        id: Utils.generateId(),
        goalId: this.goalId,
        type: 'timer',
        duration: elapsedSeconds,
        date: new Date().toISOString(),
      };
      Storage.addRecord(record);
    }
    this.skipTimer();
  },

  updateDisplay() {
    const minutes = Math.floor(this.seconds / 60);
    const secs = this.seconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const timeEl = document.querySelector('.timer-circle span');
    if (timeEl) {
      timeEl.textContent = timeStr;
    }

    const progress = 1 - (this.seconds / this.totalSeconds);
    const circumference = 2 * Math.PI * 120;
    const offset = circumference * (1 - progress);
    const progressCircle = document.querySelector('.timer-circle circle:nth-child(2)');
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = offset;
    }
  },
};
