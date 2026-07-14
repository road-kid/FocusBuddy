const Chat = {
  messages: [],
  isGenerating: false,
  currentPlan: null,

  init() {
    this.messages = [];
    this.currentPlan = null;
    this.isGenerating = false;
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="page-container" style="display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh;">
        <div style="height: var(--status-bar-height);"></div>

        <header class="flex items-center justify-between" style="padding: var(--space-md) var(--space-lg); height: var(--nav-height);">
          <button class="icon-btn" id="btn-chat-back" aria-label="返回">
            <i data-lucide="chevron-left" style="width: 24px; height: 24px;"></i>
          </button>
          <h1 style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0;">创建新目标</h1>
          <div style="width: 40px; height: 40px;"></div>
        </header>

        <div class="chat-area no-scrollbar" id="chat-messages" aria-label="AI 对话区域">
          ${this.renderMessages()}
        </div>

        <div class="bottom-actions">
          <input type="text" class="input-field" id="chat-input" placeholder="描述你的目标..." style="flex: 2;" />
          <button class="btn-primary" id="btn-chat-send" style="flex: 1; height: var(--input-height);">
            发送
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-chat-back').addEventListener('click', () => App.navigate('goals'));
    document.getElementById('btn-chat-send').addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    if (this.messages.length === 0) {
      this.addAIMessage('你好！告诉我你想要达成什么目标，我来帮你制定可执行的计划。');
    }

    this.scrollToBottom();
    lucide.createIcons();
  },

  renderMessages() {
    return this.messages.map(msg => this.renderMessage(msg)).join('');
  },

  renderMessage(msg) {
    if (msg.role === 'user') {
      return `
        <div class="chat-row chat-row--user">
          <div class="chat-bubble chat-bubble--user">${Utils.escapeHtml(msg.content)}</div>
        </div>
      `;
    } else {
      let planHtml = '';
      if (msg.plan) {
        planHtml = this.renderPlanCard(msg.plan);
      }
      return `
        <div class="chat-row">
          <div class="chat-avatar" style="background: var(--color-primary-gradient);">
            <i data-lucide="sparkles" style="width: 14px; height: 14px; color: #FFFFFF;"></i>
          </div>
          <div class="chat-bubble chat-bubble--ai">
            ${Utils.escapeHtml(msg.content)}
            ${planHtml}
          </div>
        </div>
      `;
    }
  },

  renderPlanCard(plan) {
    return `
      <div class="plan-card">
        <div class="plan-card-title">${Utils.escapeHtml(plan.goal.title)}</div>
        <div class="plan-card-divider"></div>
        <div class="plan-item">
          <span class="plan-item-icon">
            <i data-lucide="calendar" style="width: 16px; height: 16px; color: var(--color-text-secondary);"></i>
          </span>
          <span>时间：${Utils.formatDate(plan.goal.startDate)} — ${Utils.formatDate(plan.goal.endDate)}（${plan.summary.duration}天）</span>
        </div>
        <div class="plan-item">
          <span class="plan-item-icon">
            <i data-lucide="bar-chart-3" style="width: 16px; height: 16px; color: var(--color-text-secondary);"></i>
          </span>
          <span>每日任务量：约 ${plan.summary.dailyTasks} 个核心任务</span>
        </div>
        <div class="plan-item">
          <span class="plan-item-icon">
            <i data-lucide="refresh-cw" style="width: 16px; height: 16px; color: var(--color-text-secondary);"></i>
          </span>
          <span>共 ${plan.summary.totalTasks} 个可执行任务节点</span>
        </div>
        <div class="plan-card-divider"></div>
        <div class="plan-card-footer">自动进度同步 · 艾宾浩斯记忆法</div>
      </div>
    `;
  },

  addUserMessage(content) {
    this.messages.push({ role: 'user', content });
  },

  addAIMessage(content, plan = null) {
    this.messages.push({ role: 'ai', content, plan });
  },

  addTypingIndicator() {
    const chatArea = document.getElementById('chat-messages');
    if (!chatArea) return;

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-row';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = `
      <div class="chat-avatar" style="background: var(--color-primary-gradient);">
        <i data-lucide="sparkles" style="width: 14px; height: 14px; color: #FFFFFF;"></i>
      </div>
      <div class="chat-bubble chat-bubble--ai">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatArea.appendChild(typingEl);
    lucide.createIcons();
    this.scrollToBottom();
  },

  removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  },

  async sendMessage() {
    if (this.isGenerating) return;

    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    this.addUserMessage(text);
    input.value = '';
    this.updateMessagesView();
    this.addTypingIndicator();
    this.isGenerating = true;

    try {
      const plan = await AI.generateGoalPlan(text, '', 90, (progress) => {
        const typingEl = document.getElementById('typing-indicator');
        if (typingEl) {
          typingEl.querySelector('.chat-bubble').innerHTML = `<span style="font-size: var(--text-sm); color: var(--color-text-secondary);">${progress}</span>`;
        }
      });

      this.currentPlan = plan;
      this.removeTypingIndicator();

      const response = `明白了！基于你的目标，我为你制定了以下计划：`;
      this.addAIMessage(response, plan);
      this.updateMessagesView();

      this.showConfirmButtons();
    } catch (error) {
      this.removeTypingIndicator();
      this.addAIMessage('抱歉，生成计划时出错了，请重试。');
      this.updateMessagesView();
    } finally {
      this.isGenerating = false;
    }
  },

  updateMessagesView() {
    const chatArea = document.getElementById('chat-messages');
    if (chatArea) {
      chatArea.innerHTML = this.renderMessages();
      lucide.createIcons();
      this.scrollToBottom();
    }
  },

  showConfirmButtons() {
    const bottomActions = document.querySelector('.bottom-actions');
    if (!bottomActions) return;

    bottomActions.innerHTML = `
      <button class="btn-adjust" id="btn-adjust-plan">调整计划</button>
      <button class="btn-execute" id="btn-confirm-plan">
        开始执行！
        <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
      </button>
    `;

    document.getElementById('btn-adjust-plan').addEventListener('click', () => {
      this.resetBottomInput();
      this.addAIMessage('好的，请告诉我你想怎么调整？比如：时间更短一点、任务更少一些等。');
      this.updateMessagesView();
    });

    document.getElementById('btn-confirm-plan').addEventListener('click', () => this.confirmPlan());
    lucide.createIcons();
  },

  resetBottomInput() {
    const bottomActions = document.querySelector('.bottom-actions');
    if (!bottomActions) return;

    bottomActions.innerHTML = `
      <input type="text" class="input-field" id="chat-input" placeholder="描述你的目标..." style="flex: 2;" />
      <button class="btn-primary" id="btn-chat-send" style="flex: 1; height: var(--input-height);">
        发送
      </button>
    `;

    document.getElementById('btn-chat-send').addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  },

  confirmPlan() {
    if (!this.currentPlan) return;

    Storage.addGoal(this.currentPlan.goal);
    this.currentPlan.nodes.forEach(node => Storage.addNode(node));

    App.navigate('goals');
  },

  scrollToBottom() {
    const chatArea = document.getElementById('chat-messages');
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  },
};
