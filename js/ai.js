const AI = {
  async generateGoalPlan(userGoal, userLevel, duration, onProgress) {
    const config = Storage.getConfig();
    if (!config.apiUrl || !config.apiKey || !config.model) {
      throw new Error('AI_NOT_CONFIGURED');
    }
    return this.apiGenerate(userGoal, userLevel, duration, onProgress, config);
  },

  async apiGenerate(userGoal, userLevel, duration, onProgress, config) {
    const userRole = this._getUserRoleLabel(config.userRole);
    const systemPrompt = Prompts.generateGoalSystemPrompt(userRole);
    const userPrompt = Prompts.generateGoalUserPrompt(userGoal, userLevel, duration);

    if (onProgress) onProgress('正在连接 AI...');

    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    };

    const data = await this._callChatAPI(config, body);

    if (onProgress) onProgress('正在解析计划...');

    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 返回的内容无法解析，请重试或调整目标描述');
    }

    const planData = JSON.parse(jsonMatch[0]);
    return this.convertToPlan(planData);
  },

  async chat(userGoal, currentPlan, userMessage, conversationHistory, onProgress) {
    const config = Storage.getConfig();
    if (!config.apiUrl || !config.apiKey || !config.model) {
      return { type: 'text', content: '请先在设置中配置 AI 服务。' };
    }

    const userRole = this._getUserRoleLabel(config.userRole);
    const systemPrompt = Prompts.followUpSystemPrompt(userRole);
    const planSummary = currentPlan ? this._summarizePlan(currentPlan) : '无当前计划';
    const userPromptContent = Prompts.followUpUserPrompt(userGoal, planSummary, userMessage);

    const messages = [{ role: 'system', content: systemPrompt }];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      });
    }
    messages.push({ role: 'user', content: userPromptContent });

    if (onProgress) onProgress('正在连接 AI...');

    const body = { model: config.model, messages, temperature: 0.7 };
    const data = await this._callChatAPI(config, body);

    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const planData = JSON.parse(jsonMatch[0]);
        const plan = this.convertToPlan(planData);
        return { type: 'plan', content: '好的，我已经根据你的反馈调整了计划：', plan };
      } catch (e) { /* fall through */ }
    }

    return { type: 'text', content: content.trim() };
  },

  async _callChatAPI(config, body) {
    let apiUrl = config.apiUrl.replace(/\/+$/, '');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMsg = `API 请求失败 (${response.status})`;
      try {
        const errData = await response.json();
        if (errData.error) {
          errorMsg = errData.error.message || JSON.stringify(errData.error);
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return response.json();
  },

  convertToPlan(planData) {
    const goalId = Utils.generateId();
    const durationDays = planData.durationDays || 90;
    const endDate = Utils.addDays(new Date(), durationDays);

    const goal = {
      id: goalId,
      title: planData.title,
      description: planData.description || '',
      color: planData.color || 'indigo',
      category: planData.category || '学习',
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      createdAt: new Date().toISOString(),
      archived: false,
    };

    const nodes = [];
    const convertNodes = (items, parentId, depth) => {
      if (!items || !Array.isArray(items)) return;
      items.forEach(item => {
        const nodeId = Utils.generateId();
        nodes.push({
          id: nodeId,
          goalId,
          parentId: parentId || null,
          title: item.title,
          description: item.description || '',
          depth: depth,
          progressType: item.progressType || 'completion',
          quantifyMode: item.quantifyMode || 'accumulate',
          targetValue: item.targetValue || 1,
          targetUnit: item.targetUnit || '',
          resetCycle: item.resetCycle || 'none',
          spacedRepetition: item.spacedRepetition || false,
          repetitionIntervals: item.repetitionIntervals || [1, 2, 4, 7, 15, 30],
          createdAt: new Date().toISOString(),
        });
        if (item.children && item.children.length > 0) {
          convertNodes(item.children, nodeId, depth + 1);
        }
      });
    };
    convertNodes(planData.nodes || [], null, 1);

    const leafNodes = nodes.filter(n => !nodes.some(n2 => n2.parentId === n.id));

    return {
      goal,
      nodes,
      summary: {
        totalTasks: leafNodes.length,
        duration: durationDays,
        dailyTasks: Math.ceil(leafNodes.filter(n => n.resetCycle === 'daily').length),
      },
    };
  },

  _getUserRoleLabel(roleId) {
    const role = Utils.userRoles.find(r => r.id === roleId);
    return role ? role.name : '';
  },

  _summarizePlan(currentPlan) {
    if (!currentPlan) return '无当前计划';
    const parts = [];
    parts.push(`目标：${currentPlan.goal.title}`);
    parts.push(`总任务数：${currentPlan.summary.totalTasks} 个叶子节点`);
    parts.push(`周期：${currentPlan.summary.duration} 天`);
    const topNodes = currentPlan.nodes.filter(n => !n.parentId);
    if (topNodes.length > 0) {
      parts.push(`一级任务：${topNodes.map(n => n.title).join('、')}`);
    }
    return parts.join('；');
  },

  async testConnection(config) {
    const apiUrl = (config.apiUrl || '').replace(/\/+$/, '');
    const apiKey = config.apiKey || '';
    const model = config.model || '';

    if (!apiUrl) {
      return { success: false, error: 'API 地址不能为空' };
    }
    if (!apiKey) {
      return { success: false, error: 'API Key 不能为空' };
    }
    if (!model) {
      return { success: false, error: '模型名称不能为空' };
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    try {
      let response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: '连接成功！模型可用', model: data.model || model };
      }

      const errorText = await response.text();
      return { success: false, error: `请求失败 (${response.status}): ${errorText.slice(0, 200)}` };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: '无法连接到服务器，请检查 API 地址是否正确' };
      }
      return { success: false, error: error.message || '未知错误' };
    }
  },
};