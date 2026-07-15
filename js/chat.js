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

  _hasAI() {
    const config = Storage.getConfig();
    return !!(config.apiUrl && config.apiKey && config.model);
  },

  render() {
    const app = document.getElementById('app');
    const hasAI = this._hasAI();

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

        ${hasAI ? this.renderChatMode() : this.renderManualMode()}
      </div>
    `;

    if (hasAI) {
      this._bindChatEvents();
      if (this.messages.length === 0) {
        const config = Storage.getConfig();
        const role = Utils.userRoles.find(r => r.id === config.userRole);
        const greeting = role
          ? `你好，${role.name}！告诉我你想要达成什么目标，我来帮你制定详细的分层计划。`
          : '你好！告诉我你想要达成什么目标，我来帮你制定详细的分层计划。';
        this.addAIMessage(greeting);
        this.updateMessagesView();
      }
      this.scrollToBottom();
    } else {
      this._bindManualEvents();
    }

    lucide.createIcons();
  },

  /* ========== AI Chat Mode ========== */

  renderChatMode() {
    return `
      <div class="chat-area no-scrollbar" id="chat-messages" aria-label="AI 对话区域">
        ${this.renderMessages()}
      </div>
      <div class="bottom-actions" id="bottom-actions">
        ${this._chatState() === 'plan_shown' ? `
          <button class="btn-adjust" id="btn-adjust-plan">调整计划</button>
          <button class="btn-execute" id="btn-confirm-plan">
            确认并开始执行
            <i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i>
          </button>
        ` : `
          <input type="text" class="input-field" id="chat-input" placeholder="描述你的目标，如：3个月学会日语N2..." style="flex: 2;" />
          <button class="btn-primary" id="btn-chat-send" style="flex: 1; height: var(--input-height);">发送</button>
        `}
      </div>
    `;
  },

  _chatState() {
    return this.chatState;
  },

  _bindChatEvents() {
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

  /* ========== Manual Mode (no AI) ========== */

  renderManualMode() {
    return `
      <div class="page-content" style="flex:1; display:flex; flex-direction:column; gap:var(--space-lg); padding: var(--space-lg);">
        <div style="background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-lg);">
          <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-lg); line-height: var(--line-height-relaxed);">
            未配置 AI 服务。你可以手动创建目标，之后在目标详情页添加子任务。配置 AI 后可使用智能规划功能。
          </p>
          <button class="btn-secondary" id="btn-go-settings" style="width: 100%; margin-bottom: var(--space-md);">
            去设置 AI 服务
          </button>
        </div>

        <div class="card" style="padding: var(--space-lg);">
          <h3 style="font-size: var(--text-md); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-lg);">手动创建目标</h3>

          <div style="margin-bottom: var(--space-md);">
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">目标名称</label>
            <input type="text" class="input-field" id="manual-title" placeholder="例如：每天健身30分钟" style="width: 100%; box-sizing: border-box;">
          </div>

          <div style="margin-bottom: var(--space-md);">
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">描述（可选）</label>
            <textarea class="input-field" id="manual-desc" placeholder="简要描述你的目标..." style="width: 100%; min-height: 60px; resize: vertical; box-sizing: border-box; font-family: inherit;"></textarea>
          </div>

          <div style="margin-bottom: var(--space-md);">
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">分类</label>
            <div class="segment-control" id="manual-category">
              ${['学习', '健康', '工作', '生活', '其他'].map(c => `
                <div class="segment-control-item ${c === '学习' ? 'active' : ''}" data-cat="${c}">${c}</div>
              `).join('')}
            </div>
          </div>

          <div style="margin-bottom: var(--space-md);">
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">颜色</label>
            <div class="color-picker" id="manual-color">
              ${Utils.goalColors.map((c, i) => `
                <div class="color-picker-item ${i === 7 ? 'selected' : ''}" data-color="${c.name}" style="background: ${c.value};"></div>
              `).join('')}
            </div>
          </div>

          <div style="margin-bottom: var(--space-lg);">
            <label style="display: block; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-xs);">截止日期</label>
            <input type="date" class="input-field" id="manual-enddate" style="width: 100%; box-sizing: border-box; color-scheme: dark;">
          </div>

          <button class="btn-primary" id="btn-manual-create" style="width: 100%;">创建目标</button>
        </div>
      </div>
    `;
  },

  _bindManualEvents() {
    document.getElementById('btn-chat-back').addEventListener('click', () => App.navigate('goals'));

    const btnSettings = document.getElementById('btn-go-settings');
    if (btnSettings) btnSettings.addEventListener('click', () => App.navigate('settings'));

    const catSegments = document.querySelectorAll('#manual-category .segment-control-item');
    catSegments.forEach(seg => {
      seg.addEventListener('click', () => {
        catSegments.forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
      });
    });

    const colorItems = document.querySelectorAll('#manual-color .color-picker-item');
    colorItems.forEach(item => {
      item.addEventListener('click', () => {
        colorItems.forEach(c => c.classList.remove('selected'));
        item.classList.add('selected');
      });
    });

    const endDateInput = document.getElementById('manual-enddate');
    if (endDateInput) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 90);
      endDateInput.value = Utils.formatDateISO(defaultDate);
    }

    document.getElementById('btn-manual-create').addEventListener('click', () => this.createManualGoal());
  },

  createManualGoal() {
    const title = document.getElementById('manual-title').value.trim();
    if (!title) { alert('请输入目标名称'); return; }

    const desc = document.getElementById('manual-desc').value.trim();
    const category = document.querySelector('#manual-category .segment-control-item.active')?.dataset.cat || '学习';
    const color = document.querySelector('#manual-color .color-picker-item.selected')?.dataset.color || 'indigo';
    const endDate = document.getElementById('manual-enddate').value || Utils.formatDateISO(Utils.addDays(new Date(), 90));

    const goal = {
      id: Utils.generateId(),
      title,
      description: desc,
      color,
      category,
      startDate: new Date().toISOString(),
      endDate: new Date(endDate).toISOString(),
      createdAt: new Date().toISOString(),
      archived: false,
    };

    Storage.addGoal(goal);

    // Add a default top-level task
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

    App.navigate(`goal/${goal.id}`);
  },

  /* ========== Shared: Messages ========== */

  renderMessages() {
    return this.messages.map(msg => this.renderMessage(msg)).join('');
  },

  renderMessage(msg) {
    if (msg.role === 'user') {
      return `<div class="chat-row chat-row--user"><div class="chat-bubble chat-bubble--user">${Utils.escapeHtml(msg.content)}</div></div>`;
    }
    let planHtml = '';
    if (msg.plan) planHtml = this.renderPlanCard(msg.plan);
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
  },

  renderPlanCard(plan) {
    const treeHtml = this._buildTaskTree(plan.nodes);
    return `
      <div class="plan-card">
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
          <div class="plan-meta-item"><i data-lucide="calendar" style="width: 14px; height: 14px; color: var(--color-text-tertiary);"></i><span>${Utils.formatDate(plan.goal.startDate)} — ${Utils.formatDate(plan.goal.endDate)}</span></div>
          <div class="plan-meta-item"><i data-lucide="layers" style="width: 14px; height: 14px; color: var(--color-text-tertiary);"></i><span>${plan.summary.totalTasks} 个可执行任务 · ${plan.summary.duration} 天</span></div>
          <div class="plan-meta-item"><i data-lucide="list-checks" style="width: 14px; height: 14px; color: var(--color-text-tertiary);"></i><span>每日约 ${plan.summary.dailyTasks} 个核心任务</span></div>
        </div>
        <div class="plan-card-divider"></div>
        <div class="plan-tree-label">任务结构</div>
        <div class="plan-tree" id="plan-tree">${treeHtml}</div>
        <div class="plan-card-divider"></div>
        <div class="plan-card-footer">自动进度同步 · 多层任务管理</div>
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
      let html = `<div class="tree-node ${depthClass}">`;
      if (hasChildren) {
        html += `<button class="tree-toggle" data-toggle="${node.id}" aria-label="展开/折叠"><i data-lucide="chevron-down" class="tree-chevron" style="width: 14px; height: 14px;"></i></button>`;
      } else {
        html += `<span class="tree-leaf-dot"></span>`;
      }
      html += `<span class="tree-node-title">${Utils.escapeHtml(node.title)}</span>`;
      if (node.progressType === 'quantify') {
        const unit = node.targetUnit ? ` ${node.targetValue}${node.targetUnit}` : '';
        html += `<span class="tree-badge tree-badge-quantify">${node.resetCycle === 'daily' ? '每日' : '累计'}${unit}</span>`;
      } else if (node.spacedRepetition) {
        html += '<span class="tree-badge tree-badge-memory">记忆</span>';
      } else if (node.resetCycle === 'weekly' || node.resetCycle === 'monthly') {
        html += `<span class="tree-badge tree-badge-cycle">${node.resetCycle === 'weekly' ? '每周' : '每月'}</span>`;
      }
      html += `</div>`;
      if (hasChildren) {
        html += `<div class="tree-children" data-parent="${node.id}">`;
        children.forEach(child => { html += renderNode(child, depth + 1); });
        html += `</div>`;
      }
      return html;
    };

    return topNodes.map(n => renderNode(n, 1)).join('');
  },

  addUserMessage(content) { this.messages.push({ role: 'user', content }); },
  addAIMessage(content, plan = null) { this.messages.push({ role: 'ai', content, plan }); },

  addTypingIndicator() {
    const chatArea = document.getElementById('chat-messages');
    if (!chatArea) return;
    const el = document.createElement('div');
    el.className = 'chat-row';
    el.id = 'typing-indicator';
    el.innerHTML = `<div class="chat-avatar" style="background: var(--color-primary-gradient);"><i data-lucide="sparkles" style="width: 14px; height: 14px; color: #FFFFFF;"></i></div><div class="chat-bubble chat-bubble--ai"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    chatArea.appendChild(el);
    lucide.createIcons();
    this.scrollToBottom();
  },

  removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  },

  /* ========== AI Chat Flow ========== */

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
      this.addAIMessage('抱歉，处理请求时出错：' + (error.message || '未知错误'));
      this.updateMessagesView();
    } finally {
      this.isGenerating = false;
    }
  },

  async _handleGoalGeneration(text) {
    const config = Storage.getConfig();
    const userLevel = Utils.userRoles.find(r => r.id === config.userRole)?.name || '';
    const duration = this._parseDuration(text);

    const plan = await AI.generateGoalPlan(text, userLevel, duration, (progress) => {
      const typingEl = document.getElementById('typing-indicator');
      if (typingEl) {
        const bubble = typingEl.querySelector('.chat-bubble');
        if (bubble) bubble.innerHTML = `<span style="font-size: var(--text-sm); color: var(--color-text-secondary);">${progress}</span>`;
      }
    });

    this.currentPlan = plan;
    this.chatState = 'plan_shown';
    this.removeTypingIndicator();
    this.addAIMessage('好的！我已经为你制定了详细的分层计划，下面是任务结构：', plan);
    this.updateMessagesView();
    this._updateBottomActions();
    this._bindTreeEvents();
    lucide.createIcons();
  },

  async _handleAdjustment(text) {
    const conversationHistory = this.messages.map(m => ({ role: m.role, content: m.content }));
    const result = await AI.chat(this.currentPlan.goal.title, this.currentPlan, text, conversationHistory, (progress) => {
      const typingEl = document.getElementById('typing-indicator');
      if (typingEl) {
        const bubble = typingEl.querySelector('.chat-bubble');
        if (bubble) bubble.innerHTML = `<span style="font-size: var(--text-sm); color: var(--color-text-secondary);">${progress}</span>`;
      }
    });

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
      if (p.value && text.match(p.regex)) return p.value;
      if (!p.value) {
        const match = text.match(p.regex);
        if (match) return parseInt(match[1]) * p.multiplier;
      }
    }
    return 90;
  },

  _updateBottomActions() {
    const bottom = document.getElementById('bottom-actions');
    if (!bottom) return;
    if (this.chatState === 'plan_shown') {
      bottom.innerHTML = `
        <button class="btn-adjust" id="btn-adjust-plan">调整计划</button>
        <button class="btn-execute" id="btn-confirm-plan">确认并开始执行<i data-lucide="arrow-right" style="width: 18px; height: 18px;"></i></button>
      `;
    } else {
      bottom.innerHTML = `
        <input type="text" class="input-field" id="chat-input" placeholder="描述你的目标..." style="flex: 2;" />
        <button class="btn-primary" id="btn-chat-send" style="flex: 1; height: var(--input-height);">发送</button>
      `;
    }
    this._bindChatEvents();
    lucide.createIcons();
  },

  _bindTreeEvents() {
    const tree = document.getElementById('plan-tree');
    if (!tree) return;
    tree.querySelectorAll('.tree-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = btn.dataset.toggle;
        const children = tree.querySelector(`.tree-children[data-parent="${nodeId}"]`);
        const chevron = btn.querySelector('.tree-chevron');
        if (children) {
          const isHidden = children.style.display === 'none';
          children.style.display = isHidden ? '' : 'none';
          if (chevron) chevron.style.transform = isHidden ? '' : 'rotate(-90deg)';
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
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
  },
};