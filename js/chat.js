const Chat = {
  messages: [],
  isGenerating: false,
  currentPlan: null,
  chatState: 'initial',

  init() {
    this.messages = [];
    this.currentPlan = null;
    this.isGenerating = false;
    this.chatState = 'initial';
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    const config = Storage.getConfig();
    const roleLabel = this._getRoleLabel(config.userRole);

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

        <div class="bottom-actions" id="bottom-actions">
          ${this.renderBottomActions()}
        </div>
      </div>
    `;

    this._bindEvents();

    if (this.messages.length === 0) {
      const greeting = roleLabel
        ? `你好，${roleLabel}！告诉我你想要达成什么目标，我来帮你制定详细的分层计划。`
        : '你好！告诉我你想要达成什么目标，我来帮你制定详细的分层计划。';
      this.addAIMessage(greeting);
      this.updateMessagesView();
    }

    this.scrollToBottom();
    lucide.createIcons();
  },

  _getRoleLabel(roleId) {
    const role = Utils.userRoles.find(r => r.id === roleId);
    return role ? role.name : '';
  },

  renderBottomActions() {
    if (this.chatState === 'plan_shown') {
      return `
        <button class="btn-adjust" id="btn-adjust-plan">调整计划</button>
        <button class="btn-execute" id="btn-confirm-plan">
          确认并开始执行
          <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
        </button>
      `;
    }

    return `
      <input type="text" class="input-field" id="chat-input" placeholder="描述你的目标，如：3个月学会日语N2..." style="flex: 2;" />
      <button class="btn-primary" id="btn-chat-send" style="flex: 1; height: var(--input-height);">
        发送
      </button>
    `;
  },

  _bindEvents() {
    const btnBack = document.getElementById('btn-chat-back');
    if (btnBack) btnBack.addEventListener('click', () => App.navigate('goals'));

    const btnSend = document.getElementById('btn-chat-send');
    if (btnSend) btnSend.addEventListener('click', () => this.sendMessage());

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    const btnConfirm = document.getElementById('btn-confirm-plan');
    if (btnConfirm) btnConfirm.addEventListener('click', () => this.confirmPlan());

    const btnAdjust = document.getElementById('btn-adjust-plan');
    if (btnAdjust) btnAdjust.addEventListener('click', () => this.enterAdjustMode());
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
            <div class="chat-bubble-text">${Utils.escapeHtml(msg.content)}</div>
            ${planHtml}
          </div>
        </div>
      `;
    }
  },

  renderPlanCard(plan) {
    const treeHtml = this._buildTaskTree(plan.nodes);
    const days = plan.summary.duration || 90;

    return `
      <div class="plan-card" id="plan-card">
        <div class="plan-card-header">
          <div class="plan-card-goal-icon" style="background: ${Utils.getGoalColor(plan.goal.color)};">
            <i data-lucide="target" style="width: 16px; height: 16px; color: #FFF;"></i>
          </div>
          <div>
            <div class="plan-card-title">${Utils.escapeHtml(plan.goal.title)}</div>
            <div class="plan-card-category">${Utils.escapeHtml(plan.goal.category)}</div>
          </div>
        </div>

        <div class="plan-card-meta">
          <div class="plan-meta-item">
            <i data-lucide="calendar" style="width: 14px; height: 14px; color: var(--color-text-tertiary);"></i>
            <span>${Utils.formatDate(plan.goal.startDate)} — ${Utils.formatDate(plan.goal.endDate)}</span>
          </div>
          <div class="plan-meta-item">
            <i data-lucide="layers" style="width: 14px; height: 14px; color: var(--color-text-tertiary);"></i>
            <span>${plan.summary.totalTasks} 个可执行任务 · ${days} 天</span>
          </div>
          <div class="plan-meta-item">
            <i data-lucide="list-checks" style="width: 14px; height: 14px; color: var(--color-text-tertiary);"></i>
            <span>每日约 ${plan.summary.dailyTasks} 个核心任务</span>
          </div>
        </div>

        <div class="plan-card-divider"></div>

        <div class="plan-tree-label">任务结构</div>
        <div class="plan-tree" id="plan-tree">
          ${treeHtml}
        </div>

        <div class="plan-card-divider"></div>
        <div class="plan-card-footer">
          <span>自动进度同步 · 多层任务管理</span>
        </div>
      </div>
    `;
  },

  _buildTaskTree(nodes) {
    if (!nodes || nodes.length === 0) return '';

    const topNodes = nodes.filter(n => !n.parentId);

    const childMap = {};
    nodes.forEach(n => {
      const pid = n.parentId || '__root__';
      if (!childMap[pid]) childMap[pid] = [];
      childMap[pid].push(n);
    });

    const renderNode = (node, depth) => {
      const children = childMap[node.id] || [];
      const hasChildren = children.length > 0;
      const depthClass = `tree-depth-${Math.min(depth, 3)}`;
      const isLeaf = !hasChildren;

      const typeBadge = this._renderNodeTypeBadge(node);

      let html = '';
      html += `<div class="tree-node ${depthClass}" data-node-id="${node.id}">`;

      if (hasChildren) {
        html += `<button class="tree-toggle" data-toggle="${node.id}" aria-label="展开/折叠">
          <i data-lucide="chevron-down" class="tree-chevron" style="width: 14px; height: 14px;"></i>
        </button>`;
      } else {
        html += `<span class="tree-leaf-dot"></span>`;
      }

      html += `<span class="tree-node-title">${Utils.escapeHtml(node.title)}</span>`;
      html += typeBadge;
      html += `</div>`;

      if (hasChildren) {
        html += `<div class="tree-children" data-parent="${node.id}">`;
        children.forEach(child => {
          html += renderNode(child, depth + 1);
        });
        html += `</div>`;
      }

      return html;
    };

    return topNodes.map(n => renderNode(n, 1)).join('');
  },

  _renderNodeTypeBadge(node) {
    if (node.progressType === 'quantify') {
      const unit = node.targetUnit ? ` ${node.targetValue}${node.targetUnit}` : '';
      return `<span class="tree-badge tree-badge-quantify">${node.resetCycle === 'daily' ? '每日' : '累计'}${unit}</span>`;
    }
    if (node.spacedRepetition) {
      return '<span class="tree-badge tree-badge-memory">记忆</span>';
    }
    const cycleLabel = node.resetCycle === 'weekly' ? '每周' : node.resetCycle === 'monthly' ? '每月' : '';
    if (cycleLabel) {
      return `<span class="tree-badge tree-badge-cycle">${cycleLabel}</span>`;
    }
    return '';
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
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    this.addUserMessage(text);
    input.value = '';
    this.updateMessagesView();
    this.addTypingIndicator();
    this.isGenerating = true;

    try {
      if (this.chatState === 'initial') {
        await this._handleGoalGeneration(text);
      } else if (this.chatState === 'adjusting') {
        await this._handleAdjustment(text);
      }
    } catch (error) {
      this.removeTypingIndicator();
      this.addAIMessage('抱歉，处理请求时出错了，请重试。');
      this.updateMessagesView();
    } finally {
      this.isGenerating = false;
    }
  },

  async _handleGoalGeneration(text) {
    const config = Storage.getConfig();
    const userLevel = this._getRoleLabel(config.userRole);
    const duration = this._parseDuration(text);

    const plan = await AI.generateGoalPlan(text, userLevel, duration, (progress) => {
      const typingEl = document.getElementById('typing-indicator');
      if (typingEl) {
        const bubble = typingEl.querySelector('.chat-bubble');
        if (bubble) {
          bubble.innerHTML = `<span style="font-size: var(--text-sm); color: var(--color-text-secondary);">${progress}</span>`;
        }
      }
    });

    this.currentPlan = plan;
    this.chatState = 'plan_shown';
    this.removeTypingIndicator();

    const response = `好的！我已经为你制定了详细的分层计划，下面是任务结构：`;
    this.addAIMessage(response, plan);
    this.updateMessagesView();
    this._updateBottomActions();
    this._bindTreeEvents();
    lucide.createIcons();
  },

  async _handleAdjustment(text) {
    const config = Storage.getConfig();
    const userLevel = this._getRoleLabel(config.userRole);
    const conversationHistory = this.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const result = await AI.chat(
      this.currentPlan.goal.title,
      this.currentPlan,
      text,
      conversationHistory,
      (progress) => {
        const typingEl = document.getElementById('typing-indicator');
        if (typingEl) {
          const bubble = typingEl.querySelector('.chat-bubble');
          if (bubble) {
            bubble.innerHTML = `<span style="font-size: var(--text-sm); color: var(--color-text-secondary);">${progress}</span>`;
          }
        }
      }
    );

    this.removeTypingIndicator();

    if (result.type === 'plan' && result.plan) {
      this.currentPlan = result.plan;
      this.chatState = 'plan_shown';
      this.addAIMessage(result.content, result.plan);
    } else {
      this.addAIMessage(result.content);
    }

    this.updateMessagesView();
    this._updateBottomActions();
    this._bindTreeEvents();
    lucide.createIcons();
  },

  _parseDuration(text) {
    const patterns = [
      { regex: /(\d+)\s*天/, multiplier: 1 },
      { regex: /(\d+)\s*个?月/, multiplier: 30 },
      { regex: /(\d+)\s*周/, multiplier: 7 },
      { regex: /半年/, value: 180 },
      { regex: /一年/, value: 365 },
      { regex: /(\d+)\s*年/, multiplier: 365 },
    ];

    for (const p of patterns) {
      if (p.value) {
        if (text.match(p.regex)) return p.value;
      } else {
        const match = text.match(p.regex);
        if (match) {
          return parseInt(match[1]) * p.multiplier;
        }
      }
    }

    return 90;
  },

  _updateBottomActions() {
    const bottomActions = document.getElementById('bottom-actions');
    if (!bottomActions) return;

    if (this.chatState === 'plan_shown') {
      bottomActions.innerHTML = `
        <button class="btn-adjust" id="btn-adjust-plan">调整计划</button>
        <button class="btn-execute" id="btn-confirm-plan">
          确认并开始执行
          <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
        </button>
      `;
    } else {
      bottomActions.innerHTML = `
        <input type="text" class="input-field" id="chat-input" placeholder="描述你的目标，如：3个月学会日语N2..." style="flex: 2;" />
        <button class="btn-primary" id="btn-chat-send" style="flex: 1; height: var(--input-height);">
          发送
        </button>
      `;
    }

    this._bindEvents();
    lucide.createIcons();
  },

  _bindTreeEvents() {
    const tree = document.getElementById('plan-tree');
    if (!tree) return;

    const toggles = tree.querySelectorAll('.tree-toggle');
    toggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = btn.dataset.toggle;
        const childrenContainer = tree.querySelector(`.tree-children[data-parent="${nodeId}"]`);
        const chevron = btn.querySelector('.tree-chevron');

        if (childrenContainer) {
          const isHidden = childrenContainer.style.display === 'none';
          childrenContainer.style.display = isHidden ? '' : 'none';
          if (chevron) {
            chevron.style.transform = isHidden ? '' : 'rotate(-90deg)';
          }
        }
      });
    });
  },

  updateMessagesView() {
    const chatArea = document.getElementById('chat-messages');
    if (chatArea) {
      chatArea.innerHTML = this.renderMessages();
      this._bindTreeEvents();
      lucide.createIcons();
      this.scrollToBottom();
    }
  },

  enterAdjustMode() {
    this.chatState = 'adjusting';
    this._updateBottomActions();
    this.addAIMessage('好的，请告诉我你想怎么调整？比如：增加某个任务、减少任务量、调整时间周期等。');
    this.updateMessagesView();
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