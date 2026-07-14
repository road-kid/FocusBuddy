const Onboard = {
  currentStep: 0,
  totalSteps: 3,

  init() {
    this.currentStep = 0;
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    const steps = [
      {
        title: '👋 欢迎来到 FocusBuddy',
        subtitle: 'AI 替你做规划，你只管去执行',
        illustration: this.getWelcomeIllustration(),
        buttonText: '继续',
      },
      {
        title: '🎯 设定你的目标',
        subtitle: '告诉 AI 你想要达成什么，它会帮你拆解为可执行的任务',
        illustration: this.getGoalIllustration(),
        buttonText: '继续',
      },
      {
        title: '✅ 每天打卡执行',
        subtitle: '完成每日任务，进度自下而上自动汇总',
        illustration: this.getCheckIllustration(),
        buttonText: '开始使用',
      },
    ];

    const step = steps[this.currentStep];

    app.innerHTML = `
      <div class="page-container flex flex-col" style="min-height: 100vh; min-height: 100dvh;">
        <div style="height: var(--status-bar-height);"></div>

        <div class="onboarding-step-bar">
          ${steps.map((_, i) => `
            <div class="onboarding-step-dot ${i <= this.currentStep ? 'active' : ''}"></div>
          `).join('')}
        </div>

        <div class="flex-1 flex flex-col items-center justify-center" style="padding: 0 var(--space-lg);">
          <h1 class="text-center" style="font-size: var(--text-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); line-height: 1.3; margin: 0 0 var(--space-sm);">
            ${step.title}
          </h1>
          <p class="text-center" style="font-size: var(--text-base); font-weight: var(--font-weight-regular); color: var(--color-text-secondary); margin: 0 0 var(--space-3xl); line-height: var(--line-height-relaxed);">
            ${step.subtitle}
          </p>
          <div style="width: 100%; max-width: 300px; display: flex; align-items: center; justify-content: center;">
            ${step.illustration}
          </div>
        </div>

        <div style="padding: 0 var(--space-lg) var(--space-3xl);">
          <button class="btn-primary" id="btn-onboard-next" aria-label="${step.buttonText}">
            ${step.buttonText}
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-onboard-next').addEventListener('click', () => this.nextStep());
  },

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.render();
    } else {
      this.completeOnboarding();
    }
  },

  completeOnboarding() {
    const config = Storage.getConfig();
    config.onboarded = true;
    Storage.saveConfig(config);
    DemoData.initDemoData();
    App.navigate('goals');
  },

  getWelcomeIllustration() {
    return `
      <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;" aria-hidden="true">
        <path d="M20 200 Q80 100 160 140 Q240 80 300 120 L300 240 L20 240 Z" fill="#2C2C2E" opacity="0.9"/>
        <path d="M60 200 Q130 120 200 150 Q260 110 300 130 L300 240 L60 240 Z" fill="#38383A" opacity="0.85"/>
        <path d="M100 200 Q160 140 220 160 Q270 130 300 145 L300 240 L100 240 Z" fill="#48484A" opacity="0.8"/>
        <path d="M40 195 Q70 170 110 175 Q150 155 190 165 Q230 150 280 160" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="6 4" fill="none" stroke-linecap="round"/>
        <circle cx="40" cy="200" r="16" fill="#6366F1"/>
        <path d="M280 160 L300 140 L295 170 Z" fill="#8B5CF6"/>
        <path d="M150 188 L153 191 L159 184" stroke="#34C759" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M170 183 L173 186 L179 179" stroke="#34C759" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  getGoalIllustration() {
    return `
      <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;" aria-hidden="true">
        <circle cx="160" cy="120" r="80" stroke="#6366F1" stroke-width="3" fill="none" opacity="0.3"/>
        <circle cx="160" cy="120" r="55" stroke="#8B5CF6" stroke-width="3" fill="none" opacity="0.5"/>
        <circle cx="160" cy="120" r="30" stroke="#A855F7" stroke-width="3" fill="none"/>
        <circle cx="160" cy="120" r="8" fill="#6366F1"/>
        <path d="M160 40 L160 25 L155 28 M160 40 L160 25 L165 28" stroke="#34C759" stroke-width="2" stroke-linecap="round"/>
        <circle cx="80" cy="80" r="6" fill="#EC4899"/>
        <circle cx="240" cy="90" r="6" fill="#3B82F6"/>
        <circle cx="90" cy="180" r="6" fill="#22C55E"/>
        <circle cx="230" cy="170" r="6" fill="#F97316"/>
      </svg>
    `;
  },

  getCheckIllustration() {
    return `
      <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;" aria-hidden="true">
        <rect x="60" y="40" width="200" height="160" rx="16" fill="#1C1C1E" stroke="#38383A" stroke-width="2"/>
        <g transform="translate(85, 70)">
          <circle cx="14" cy="14" r="14" fill="#34C759" opacity="0.2"/>
          <path d="M7 14 L12 19 L21 9" stroke="#34C759" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="36" y="19" fill="#FFFFFF" font-size="14" font-family="system-ui">完成每日学习</text>
        </g>
        <g transform="translate(85, 110)">
          <circle cx="14" cy="14" r="14" fill="#34C759" opacity="0.2"/>
          <path d="M7 14 L12 19 L21 9" stroke="#34C759" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="36" y="19" fill="#FFFFFF" font-size="14" font-family="system-ui">健身30分钟</text>
        </g>
        <g transform="translate(85, 150)">
          <circle cx="14" cy="14" r="14" stroke="#48484A" stroke-width="2" fill="none"/>
          <text x="36" y="19" fill="#8E8E93" font-size="14" font-family="system-ui">阅读20页书</text>
        </g>
        <circle cx="240" cy="60" r="24" fill="none" stroke="#6366F1" stroke-width="3" stroke-dasharray="100" stroke-dashoffset="30" transform="rotate(-90 240 60)"/>
        <text x="240" y="65" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="600" font-family="system-ui">67%</text>
      </svg>
    `;
  },
};
