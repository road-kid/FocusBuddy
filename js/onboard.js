const Onboard = {
  step: 1,
  config: null,
  generatedPlan: null,

  init() {
    this.step = 1;
    this.config = Storage.getConfig();
    this.generatedPlan = null;
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="page-container" style="display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh;">
        <div style="height: var(--status-bar-height);"></div>

        <header style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-md) var(--space-lg); height: var(--nav-height);">
          ${this.step > 1 ? `
            <button class="icon-btn" id="btn-onboard-back" aria-label="上一步">
              <i data-lucide="chevron-left" style="width: 24px; height: 24px;"></i>
            </button>
          ` : `<div style="width: 40px; height: 40px;"></div>`}
          <span style="font-size: var(--text-sm); color: var(--color-text-tertiary);">${this.step}/4</span>
          <div style="width: 40px; height: 40px;"></div>
        </header>

        <div style="display: flex; gap: 6px; padding: 0 var(--space-lg); margin-bottom: var(--space-lg);">
          ${[1, 2, 3, 4].map(i => `
            <div style="flex: 1; height: 3px; border-radius: 2px; background: ${i <= this.step ? 'var(--color-primary)' : 'var(--color-border)'}; transition: background 0.3s;"></div>
          `).join('')}
        </div>

        <div class="page-content" style="flex: 1; padding: 0 var(--space-lg);">
          ${this.step === 1 ? this.renderStep1() : ''}
          ${this.step === 2 ? this.renderStep2() : ''}
          ${this.step === 3 ? this.renderStep3() : ''}
          ${this.step === 4 ? this.renderStep4() : ''}
        </div>
      </div>
    `;

    this.bindEvents();
    lucide.createIcons();
  },

  /* ========== Step 1: Welcome ========== */

  renderStep1() {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; gap: var(--space-xl);">
        <div style="width: 80px; height: 80px; border-radius: 24px; background: var(--color-primary-gradient); display: flex; align-items: center; justify-content: center; font-size: 40px;">🧠</div>
        <div>
          <h1 style="font-size: var(--text-3xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-sm);">FocusBuddy</h1>
          <p style="font-size: var(--text-base); color: var(--color-text-secondary); margin: 0; line-height: var(--line-height-relaxed);">AI 替你做规划，你只管去执行</p>
        </div>
        <p style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin: 0;">智能目标拆解 · 番茄专注计时 · 数据驱动成长</p>
        <button class="btn-primary" id="btn-step1-next" style="width: 100%; max-width: 280px; margin-top: var(--space-xl);">开始使用</button>
      </div>
    `;
  },

  /* ========== Step 2: Role ========== */

  renderStep2() {
    const selectedRole = this.config.userRole || '';
    return `
      <div style="display: flex; flex-direction: column; flex: 1; gap: var(--space-xl);">
        <div>
          <h2 style="font-size: var(--text-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-sm);">选择你的身份</h2>
          <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">这有助于 AI 为你定制更精准的计划</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
          ${Utils.userRoles.map(role => `
            <div class="role-card ${selectedRole === role.id ? 'selected' : ''}" data-role="${role.id}">
              <div class="role-card-icon">${role.icon}</div>
              <div class="role-card-name">${role.name}</div>
              <div class="role-card-desc">${role.desc}</div>
            </div>
          `).join('')}
        </div>
        <button class="btn-primary" id="btn-step2-next" ${selectedRole ? '' : 'disabled'} style="width: 100%; margin-top: auto;">继续</button>
      </div>
    `;
  },

  /* ========== Step 3: AI Config ========== */

  renderStep3() {
    const cfg = this.config;
    return `
      <div style="display: flex; flex-direction: column; flex: 1; gap: var(--space-lg);">
        <div>
          <h2 style="font-size: var(--text-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-sm);">配置 AI 服务</h2>
          <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">支持 OpenAI、OpenRouter、Ollama 等兼容 API</p>
        </div>

        <div style="background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-md); font-size: var(--text-xs); color: var(--color-text-tertiary); line-height: var(--line-height-relaxed); margin-bottom: 0;">
          <strong style="color: var(--color-text-secondary);">常用地址：</strong><br>
          OpenAI: <code>https://api.openai.com/v1</code><br>
          OpenRouter: <code>https://openrouter.ai/api/v1</code><br>
          Ollama: <code>http://localhost:11434/v1</code>
        </div>

        <div>
          <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">API 地址</label>
          <input type="text" class="input-field" id="onboard-api-url" value="${Utils.escapeHtml(cfg.apiUrl || '')}" placeholder="https://api.openai.com/v1" style="width: 100%; box-sizing: border-box;">
        </div>

        <div>
          <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">API Key</label>
          <input type="password" class="input-field" id="onboard-api-key" value="${Utils.escapeHtml(cfg.apiKey || '')}" placeholder="sk-..." style="width: 100%; box-sizing: border-box;">
        </div>

        <div>
          <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">模型名称</label>
          <input type="text" class="input-field" id="onboard-model" value="${Utils.escapeHtml(cfg.model || '')}" placeholder="gpt-4o / openai/gpt-4o / llama3" style="width: 100%; box-sizing: border-box;">
        </div>

        <button class="btn-secondary" id="btn-onboard-test" style="width: 100%;">测试连接</button>
        <div id="onboard-test-result" style="font-size: var(--text-sm); text-align: center; display: none;"></div>

        <div style="display: flex; gap: var(--space-md); margin-top: auto;">
          <button class="btn-secondary" id="btn-onboard-skip" style="flex: 1;">跳过，手动创建</button>
          <button class="btn-primary" id="btn-step3-next" style="flex: 1;">保存并继续</button>
        </div>
      </div>
    `;
  },

  /* ========== Step 4: Goal Input ========== */

  renderStep4() {
    const hasAI = !!(this.config.apiUrl && this.config.apiKey && this.config.model);
    return `
      <div style="display: flex; flex-direction: column; flex: 1; gap: var(--space-lg);">
        <div>
          <h2 style="font-size: var(--text-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-sm);">设定你的第一个目标</h2>
          <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">
            ${hasAI ? 'AI 将为你生成详细的分层任务计划' : '你可以手动创建目标，之后在详情页添加子任务'}
          </p>
        </div>

        ${hasAI ? `
          <div>
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">描述你的目标</label>
            <textarea class="input-field" id="onboard-goal" placeholder="描述你的目标，越详细越好。如：3个月学会日语N2，每天能投入1小时..." style="width: 100%; min-height: 100px; resize: vertical; box-sizing: border-box; font-family: inherit;"></textarea>
          </div>
          <button class="btn-primary" id="btn-onboard-generate" style="width: 100%;">生成 AI 计划</button>
          <div id="onboard-generate-progress" style="font-size: var(--text-sm); color: var(--color-text-secondary); text-align: center; display: none;"></div>
          <div id="onboard-plan-preview" style="display: none;"></div>
        ` : `
          <div>
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">目标名称</label>
            <input type="text" class="input-field" id="onboard-manual-title" placeholder="例如：每天健身30分钟" style="width: 100%; box-sizing: border-box;">
          </div>
          <div>
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">描述（可选）</label>
            <textarea class="input-field" id="onboard-manual-desc" placeholder="简要描述..." style="width: 100%; min-height: 60px; resize: vertical; box-sizing: border-box; font-family: inherit;"></textarea>
          </div>
          <div>
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">分类</label>
            <div class="segment-control" id="onboard-category">
              ${['学习', '健康', '工作', '生活', '其他'].map(c => `
                <div class="segment-control-item ${c === '学习' ? 'active' : ''}" data-cat="${c}">${c}</div>
              `).join('')}
            </div>
          </div>
          <div>
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">颜色</label>
            <div class="color-picker" id="onboard-color">
              ${Utils.goalColors.map((c, i) => `
                <div class="color-picker-item ${i === 7 ? 'selected' : ''}" data-color="${c.name}" style="background: ${c.value};"></div>
              `).join('')}
            </div>
          </div>
          <button class="btn-primary" id="btn-onboard-manual-create" style="width: 100%;">创建目标</button>
        `}
      </div>
    `;
  },

  /* ========== Events ========== */

  bindEvents() {
    // Step 1
    const btn1 = document.getElementById('btn-step1-next');
    if (btn1) btn1.addEventListener('click', () => { this.step = 2; this.render(); });

    // Back button
    const btnBack = document.getElementById('btn-onboard-back');
    if (btnBack) btnBack.addEventListener('click', () => { this.step--; this.render(); });

    // Step 2: Role
    document.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.config.userRole = card.dataset.role;
        const btnNext = document.getElementById('btn-step2-next');
        if (btnNext) btnNext.disabled = false;
      });
    });
    const btn2 = document.getElementById('btn-step2-next');
    if (btn2) btn2.addEventListener('click', () => { this.step = 3; this.render(); });

    // Step 3: AI Config
    const btnSkip = document.getElementById('btn-onboard-skip');
    if (btnSkip) btnSkip.addEventListener('click', () => {
      this.config.apiUrl = '';
      this.config.apiKey = '';
      this.config.model = '';
      this.step = 4;
      this.render();
    });

    const btnTest = document.getElementById('btn-onboard-test');
    if (btnTest) btnTest.addEventListener('click', async () => {
      this._saveConfigFromInputs();
      const resultEl = document.getElementById('onboard-test-result');
      btnTest.disabled = true;
      btnTest.textContent = '正在测试...';
      resultEl.style.display = 'block';
      resultEl.style.color = 'var(--color-text-secondary)';
      resultEl.textContent = '正在连接...';

      const result = await AI.testConnection(this.config);
      if (result.success) {
        resultEl.style.color = 'var(--state-success)';
        resultEl.textContent = '连接成功！模型可用';
      } else {
        resultEl.style.color = 'var(--state-error)';
        resultEl.textContent = result.error;
      }
      btnTest.disabled = false;
      btnTest.textContent = '测试连接';
    });

    const btn3 = document.getElementById('btn-step3-next');
    if (btn3) btn3.addEventListener('click', () => {
      this._saveConfigFromInputs();
      this.step = 4;
      this.render();
    });

    // Step 4
    const btnGenerate = document.getElementById('btn-onboard-generate');
    if (btnGenerate) btnGenerate.addEventListener('click', () => this.generatePlan());

    const btnManualCreate = document.getElementById('btn-onboard-manual-create');
    if (btnManualCreate) btnManualCreate.addEventListener('click', () => this.createManualGoal());

    // Manual category
    document.querySelectorAll('#onboard-category .segment-control-item').forEach(seg => {
      seg.addEventListener('click', () => {
        document.querySelectorAll('#onboard-category .segment-control-item').forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
      });
    });

    // Manual color
    document.querySelectorAll('#onboard-color .color-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('#onboard-color .color-picker-item').forEach(c => c.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
  },

  _saveConfigFromInputs() {
    const url = document.getElementById('onboard-api-url')?.value.trim() || '';
    const key = document.getElementById('onboard-api-key')?.value.trim() || '';
    const model = document.getElementById('onboard-model')?.value.trim() || '';
    this.config.apiUrl = url;
    this.config.apiKey = key;
    this.config.model = model;
  },

  /* ========== AI Generation ========== */

  async generatePlan() {
    const goalText = document.getElementById('onboard-goal')?.value.trim();
    if (!goalText) { alert('请输入目标描述'); return; }

    this._saveConfigFromInputs();

    const btn = document.getElementById('btn-onboard-generate');
    const progress = document.getElementById('onboard-generate-progress');
    btn.disabled = true;
    btn.textContent = '生成中...';
    progress.style.display = 'block';

    try {
      this.generatedPlan = await AI.generateGoalPlan(goalText, null, null, (msg) => {
        progress.textContent = msg;
      });

      progress.style.display = 'none';
      this._showPlanPreview();
    } catch (error) {
      progress.style.color = 'var(--state-error)';
      progress.textContent = '生成失败: ' + (error.message || '未知错误');
      btn.disabled = false;
      btn.textContent = '重试生成';
    }
  },

  _showPlanPreview() {
    const plan = this.generatedPlan;
    const preview = document.getElementById('onboard-plan-preview');
    preview.style.display = 'block';
    preview.innerHTML = `
      <div style="background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-lg); margin-top: var(--space-md);">
        <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${Utils.getGoalColor(plan.goal.color)};"></div>
          <strong style="color: var(--color-text-primary);">${Utils.escapeHtml(plan.goal.title)}</strong>
        </div>
        <div style="display: flex; gap: var(--space-lg); margin-bottom: var(--space-md); font-size: var(--text-sm);">
          <div style="color: var(--color-text-secondary);">
            <span style="color: var(--color-text-primary); font-weight: var(--font-weight-semibold);">${plan.summary.totalTasks}</span> 个任务
          </div>
          <div style="color: var(--color-text-secondary);">
            <span style="color: var(--color-text-primary); font-weight: var(--font-weight-semibold);">${plan.summary.duration}</span> 天
          </div>
          <div style="color: var(--color-text-secondary);">
            每日 <span style="color: var(--color-text-primary); font-weight: var(--font-weight-semibold);">${plan.summary.dailyTasks}</span> 个核心任务
          </div>
        </div>
        <div style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-bottom: var(--space-md);">
          任务结构: ${plan.nodes.filter(n => !n.parentId).map(n => Utils.escapeHtml(n.title)).join(' → ')}
        </div>
        <button class="btn-primary" id="btn-onboard-confirm" style="width: 100%;">确认并开始</button>
      </div>
    `;

    document.getElementById('btn-onboard-confirm').addEventListener('click', () => this.completeOnboarding());
  },

  createManualGoal() {
    const title = document.getElementById('onboard-manual-title')?.value.trim();
    if (!title) { alert('请输入目标名称'); return; }

    const desc = document.getElementById('onboard-manual-desc')?.value.trim() || '';
    const category = document.querySelector('#onboard-category .segment-control-item.active')?.dataset?.cat || '学习';
    const color = document.querySelector('#onboard-color .color-picker-item.selected')?.dataset?.color || 'indigo';
    const endDate = Utils.addDays(new Date(), 90);

    const goal = {
      id: Utils.generateId(),
      title,
      description: desc,
      color,
      category,
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      createdAt: new Date().toISOString(),
      archived: false,
    };

    Storage.addGoal(goal);

    const nodeId = Utils.generateId();
    Storage.addNode({
      id: nodeId,
      goalId: goal.id,
      parentId: null,
      title: '每日任务',
      description: '完成每日目标',
      depth: 1,
      progressType: 'completion',
      resetCycle: 'daily',
      createdAt: new Date().toISOString(),
    });

    this.completeOnboarding();
  },

  completeOnboarding() {
    this.config.onboarded = true;
    Storage.saveConfig(this.config);

    if (this.generatedPlan) {
      Storage.addGoal(this.generatedPlan.goal);
      this.generatedPlan.nodes.forEach(node => Storage.addNode(node));
    }

    App.navigate('goals');
  },
};