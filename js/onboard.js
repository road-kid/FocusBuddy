const Onboard = {
  currentStep: 0,
  totalSteps: 4,
  selectedRole: null,
  planState: 'input',
  generatedPlan: null,
  progressMessages: [],

  init() {
    this.currentStep = 0;
    this.selectedRole = null;
    this.planState = 'input';
    this.generatedPlan = null;
    this.progressMessages = [];
    this.render();
  },

  render() {
    const app = document.getElementById('app');

    let content = '';
    switch (this.currentStep) {
      case 0: content = this.renderWelcome(); break;
      case 1: content = this.renderRoleSelection(); break;
      case 2: content = this.renderAIConfig(); break;
      case 3: content = this.renderGoalInput(); break;
    }

    app.innerHTML = `
      <div class="page-container flex flex-col" style="min-height: 100vh; min-height: 100dvh;">
        <div style="height: var(--status-bar-height);"></div>
        ${this.currentStep > 0 ? this.renderBackButton() : ''}
        ${this.renderStepBar()}
        ${content}
      </div>
    `;

    this.bindEvents();
  },

  renderBackButton() {
    return `
      <div style="padding: 0 var(--space-lg); margin-bottom: -8px;">
        <button id="btn-onboard-back" class="btn-icon" aria-label="返回上一步" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--color-text-secondary); cursor: pointer; font-size: 20px;">
          ←
        </button>
      </div>
    `;
  },

  renderStepBar() {
    const steps = Array(this.totalSteps).fill(0);
    return `
      <div class="onboarding-step-bar">
        ${steps.map((_, i) => `
          <div class="onboarding-step-dot ${i <= this.currentStep ? 'active' : ''}"></div>
        `).join('')}
      </div>
    `;
  },

  renderWelcome() {
    return `
      <div class="flex-1 flex flex-col items-center justify-center" style="padding: 0 var(--space-lg);">
        <div style="width: 80px; height: 80px; border-radius: 20px; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-xl); box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);">
          <span style="font-size: 40px;">🎯</span>
        </div>
        <h1 class="text-center" style="font-size: 28px; font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-sm);">
          FocusBuddy
        </h1>
        <p class="text-center" style="font-size: var(--text-base); font-weight: var(--font-weight-regular); color: var(--color-text-secondary); margin: 0 0 var(--space-3xl); line-height: var(--line-height-relaxed);">
          AI 替你做规划，你只管去执行
        </p>
      </div>
      <div style="padding: 0 var(--space-lg) var(--space-3xl);">
        <button class="btn-primary" id="btn-onboard-next">
          开始使用
        </button>
      </div>
    `;
  },

  renderRoleSelection() {
    const roles = Utils.userRoles;
    return `
      <div class="flex-1 flex flex-col" style="padding: 0 var(--space-lg);">
        <div style="margin-bottom: var(--space-xl);">
          <h2 class="text-center" style="font-size: var(--text-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-xs);">
            选择你的身份
          </h2>
          <p class="text-center" style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">
            以便 AI 为你定制更合适的计划
          </p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
          ${roles.map(role => `
            <div class="onboard-role-card" data-role-id="${role.id}" style="
              background: #1C1C1E;
              border: 2px solid ${this.selectedRole === role.id ? 'var(--color-primary)' : '#2C2C2E'};
              border-radius: 16px;
              padding: var(--space-lg) var(--space-md);
              cursor: pointer;
              transition: border-color 0.2s;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              gap: var(--space-sm);
            ">
              <span style="font-size: 32px;">${role.icon}</span>
              <span style="font-size: var(--text-base); font-weight: var(--font-weight-semibold); color: var(--color-text-primary);">${role.name}</span>
              <span style="font-size: var(--text-xs); color: var(--color-text-tertiary); line-height: 1.3;">${role.desc}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="padding: var(--space-lg) var(--space-lg) var(--space-3xl);">
        <button class="btn-primary" id="btn-onboard-next" ${this.selectedRole ? '' : 'disabled style="opacity: 0.4; cursor: not-allowed;"'}>
          继续
        </button>
      </div>
    `;
  },

  renderAIConfig() {
    const config = Storage.getConfig();
    return `
      <div class="flex-1 flex flex-col" style="padding: 0 var(--space-lg); overflow-y: auto;">
        <div style="margin-bottom: var(--space-xl);">
          <h2 class="text-center" style="font-size: var(--text-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-xs);">
            配置 AI 服务
          </h2>
          <p class="text-center" style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">
            连接你的 AI 服务，或使用演示模式快速体验
          </p>
        </div>

        <div style="margin-bottom: var(--space-lg);">
          <label style="display: block; font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">API 地址</label>
          <input id="input-api-url" type="text" placeholder="https://api.openai.com/v1" value="${Utils.escapeHtml(config.apiUrl || '')}" style="
            width: 100%; padding: 12px var(--space-md); border-radius: 12px; border: 1px solid #2C2C2E; background: #1C1C1E; color: var(--color-text-primary); font-size: var(--text-base); outline: none; box-sizing: border-box;
          ">
        </div>

        <div style="margin-bottom: var(--space-lg);">
          <label style="display: block; font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">API Key</label>
          <input id="input-api-key" type="password" placeholder="sk-..." value="${Utils.escapeHtml(config.apiKey || '')}" style="
            width: 100%; padding: 12px var(--space-md); border-radius: 12px; border: 1px solid #2C2C2E; background: #1C1C1E; color: var(--color-text-primary); font-size: var(--text-base); outline: none; box-sizing: border-box;
          ">
        </div>

        <div style="margin-bottom: var(--space-lg);">
          <label style="display: block; font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">模型</label>
          <input id="input-model" type="text" placeholder="gpt-4o" value="${Utils.escapeHtml(config.model || '')}" style="
            width: 100%; padding: 12px var(--space-md); border-radius: 12px; border: 1px solid #2C2C2E; background: #1C1C1E; color: var(--color-text-primary); font-size: var(--text-base); outline: none; box-sizing: border-box;
          ">
        </div>
      </div>

      <div style="padding: var(--space-lg) var(--space-lg) var(--space-3xl); display: flex; flex-direction: column; gap: var(--space-md);">
        <button class="btn-primary" id="btn-onboard-save-config">
          保存并继续
        </button>
        <button id="btn-onboard-demo" style="
          width: 100%; padding: 14px var(--space-lg); border-radius: 14px; border: 1px solid #2C2C2E; background: transparent; color: var(--color-text-secondary); font-size: var(--text-base); font-weight: var(--font-weight-medium); cursor: pointer;
        ">
          使用演示模式
        </button>
      </div>
    `;
  },

  renderGoalInput() {
    const stateContent = this.renderGoalStateContent();

    return `
      <div class="flex-1 flex flex-col" style="padding: 0 var(--space-lg); overflow-y: auto;">
        <div style="margin-bottom: var(--space-xl);">
          <h2 class="text-center" style="font-size: var(--text-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-xs);">
            设定你的第一个目标
          </h2>
          <p class="text-center" style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">
            告诉 AI 你想要达成什么，它会帮你制定详细计划
          </p>
        </div>

        ${stateContent}
      </div>
    `;
  },

  renderGoalStateContent() {
    if (this.planState === 'input') {
      return this.renderGoalInputForm();
    }
    if (this.planState === 'generating') {
      return this.renderGoalGenerating();
    }
    if (this.planState === 'done') {
      return this.renderGoalPlanResult();
    }
    return '';
  },

  renderGoalInputForm() {
    return `
      <div>
        <textarea id="input-goal" placeholder="例如：30天内学会 Python 基础、每周健身3次、每天阅读30分钟……" style="
          width: 100%; min-height: 100px; padding: 12px var(--space-md); border-radius: 12px; border: 1px solid #2C2C2E; background: #1C1C1E; color: var(--color-text-primary); font-size: var(--text-base); outline: none; resize: vertical; box-sizing: border-box; line-height: var(--line-height-relaxed); font-family: inherit;
        ">${Utils.escapeHtml(this.goalInput || '')}</textarea>
      </div>
      <div style="padding: var(--space-lg) 0 var(--space-3xl);">
        <button class="btn-primary" id="btn-onboard-generate">
          生成 AI 计划
        </button>
      </div>
    `;
  },

  renderGoalGenerating() {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-2xl) 0;">
        <div class="onboard-spinner" style="
          width: 48px; height: 48px; border: 4px solid #2C2C2E; border-top-color: var(--color-primary); border-radius: 50%; animation: onboard-spin 0.8s linear infinite; margin-bottom: var(--space-xl);
        "></div>
        <p style="font-size: var(--text-base); color: var(--color-text-primary); margin: 0 0 var(--space-md); text-align: center;">
          AI 正在为你制定计划...
        </p>
        <div id="onboard-progress-messages" style="width: 100%;">
          ${this.progressMessages.map(msg => `
            <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-xs); text-align: center; animation: onboard-fadein 0.3s ease;">
              ${Utils.escapeHtml(msg)}
            </p>
          `).join('')}
        </div>
      </div>
      <style>
        @keyframes onboard-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes onboard-fadein {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;
  },

  renderGoalPlanResult() {
    const plan = this.generatedPlan;
    if (!plan) return '';

    return `
      <div style="flex: 1; display: flex; flex-direction: column;">
        <div style="background: #1C1C1E; border-radius: 16px; padding: var(--space-lg); margin-bottom: var(--space-lg);">
          <h3 style="font-size: var(--text-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-xs);">
            ${Utils.escapeHtml(plan.goal.title)}
          </h3>
          ${plan.goal.description ? `
            <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-md); line-height: var(--line-height-relaxed);">
              ${Utils.escapeHtml(plan.goal.description)}
            </p>
          ` : ''}
          <div style="display: flex; gap: var(--space-md); flex-wrap: wrap;">
            <div style="flex: 1; min-width: 80px; background: #2C2C2E; border-radius: 12px; padding: var(--space-md); text-align: center;">
              <div style="font-size: var(--text-xl); font-weight: var(--font-weight-bold); color: var(--color-primary);">${plan.summary.totalTasks}</div>
              <div style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 2px;">总任务数</div>
            </div>
            <div style="flex: 1; min-width: 80px; background: #2C2C2E; border-radius: 12px; padding: var(--space-md); text-align: center;">
              <div style="font-size: var(--text-xl); font-weight: var(--font-weight-bold); color: var(--color-primary);">${plan.summary.duration}</div>
              <div style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 2px;">计划天数</div>
            </div>
            <div style="flex: 1; min-width: 80px; background: #2C2C2E; border-radius: 12px; padding: var(--space-md); text-align: center;">
              <div style="font-size: var(--text-xl); font-weight: var(--font-weight-bold); color: var(--color-primary);">${plan.summary.dailyTasks}</div>
              <div style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 2px;">每日任务</div>
            </div>
          </div>
        </div>
        <div style="padding-bottom: var(--space-3xl);">
          <button class="btn-primary" id="btn-onboard-confirm">
            确认并开始
          </button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const btnNext = document.getElementById('btn-onboard-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.nextStep());
    }

    const btnBack = document.getElementById('btn-onboard-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => this.prevStep());
    }

    const roleCards = document.querySelectorAll('.onboard-role-card');
    if (roleCards.length > 0) {
      roleCards.forEach(card => {
        card.addEventListener('click', () => {
          const roleId = card.getAttribute('data-role-id');
          this.handleRoleSelect(roleId);
        });
      });
    }

    const btnSaveConfig = document.getElementById('btn-onboard-save-config');
    if (btnSaveConfig) {
      btnSaveConfig.addEventListener('click', () => this.handleSaveConfig());
    }

    const btnDemo = document.getElementById('btn-onboard-demo');
    if (btnDemo) {
      btnDemo.addEventListener('click', () => this.handleDemoMode());
    }

    const btnGenerate = document.getElementById('btn-onboard-generate');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', () => this.handleGeneratePlan());
    }

    const btnConfirm = document.getElementById('btn-onboard-confirm');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => this.handleConfirmPlan());
    }
  },

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.render();
    } else {
      this.completeOnboarding();
    }
  },

  prevStep() {
    if (this.currentStep > 0) {
      if (this.currentStep === 3) {
        this.planState = 'input';
        this.generatedPlan = null;
        this.progressMessages = [];
      }
      this.currentStep--;
      this.render();
    }
  },

  handleRoleSelect(roleId) {
    this.selectedRole = roleId;
    this.render();
  },

  handleSaveConfig() {
    const apiUrl = document.getElementById('input-api-url').value.trim();
    const apiKey = document.getElementById('input-api-key').value.trim();
    const model = document.getElementById('input-model').value.trim();

    const config = Storage.getConfig();
    config.backendType = 'api';
    config.apiUrl = apiUrl;
    config.apiKey = apiKey;
    config.model = model;
    Storage.saveConfig(config);

    this.nextStep();
  },

  handleDemoMode() {
    const config = Storage.getConfig();
    config.backendType = 'demo';
    config.apiUrl = '';
    config.apiKey = '';
    config.model = '';
    Storage.saveConfig(config);

    this.nextStep();
  },

  async handleGeneratePlan() {
    const goalInput = document.getElementById('input-goal');
    if (!goalInput || !goalInput.value.trim()) {
      goalInput && goalInput.focus();
      return;
    }

    this.goalInput = goalInput.value.trim();
    this.planState = 'generating';
    this.progressMessages = [];
    this.render();

    try {
      const role = Utils.userRoles.find(r => r.id === this.selectedRole);
      const userLevel = role ? role.name : '通用';

      const plan = await AI.generateGoalPlan(this.goalInput, userLevel, 90, (message) => {
        this.progressMessages.push(message);
        this.render();
      });

      this.generatedPlan = plan;
      this.planState = 'done';
      this.render();
    } catch (error) {
      this.planState = 'input';
      this.render();
      alert('AI 计划生成失败: ' + (error.message || '未知错误'));
    }
  },

  handleConfirmPlan() {
    if (!this.generatedPlan) return;

    const plan = this.generatedPlan;

    Storage.addGoal(plan.goal);
    plan.nodes.forEach(node => Storage.addNode(node));

    this.completeOnboarding();
  },

  completeOnboarding() {
    const config = Storage.getConfig();
    config.onboarded = true;
    if (this.selectedRole) {
      config.userRole = this.selectedRole;
    }
    Storage.saveConfig(config);
    App.navigate('goals');
  },
};