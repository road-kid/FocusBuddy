const AI = {
  STAGES: [
    { id: 1, label: '解析目标特征', desc: '分析目标类型、周期与难度' },
    { id: 2, label: '规划任务结构', desc: '构建阶段性任务框架' },
    { id: 3, label: '拆解子任务', desc: '细化可执行的每日动作' },
    { id: 4, label: '完善任务细则', desc: '配置量化模式、周期与间隔重复' },
  ],

  async generateGoalPlan(userGoal, userLevel, duration, onProgress) {
    const config = Storage.getConfig();
    console.log('[AI] generateGoalPlan called');
    console.log('[AI] config:', JSON.stringify({ apiUrl: config.apiUrl, model: config.model, hasKey: !!config.apiKey }));
    if (!config.apiUrl || !config.apiKey || !config.model) {
      throw new Error('AI_NOT_CONFIGURED');
    }
    return this.apiGenerate(userGoal, userLevel, duration, onProgress, config);
  },

  async apiGenerate(userGoal, userLevel, duration, onProgress, config) {
    const userRole = this._getUserRoleLabel(config.userRole);
    const systemPrompt = Prompts.generateGoalSystemPrompt(userRole);
    const userPrompt = Prompts.generateGoalUserPrompt(userGoal, userLevel, duration);

    console.log('[AI] apiGenerate start');
    console.log('[AI] systemPrompt length:', systemPrompt.length);
    console.log('[AI] userPrompt:', userPrompt);

    this._reportStage(onProgress, 1);
    await this._delay(400);

    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    };
    console.log('[AI] request body:', JSON.stringify(body, null, 2));

    this._reportStage(onProgress, 2);

    let data;
    try {
      data = await this._callChatAPI(config, body);
    } catch (err) {
      console.error('[AI] _callChatAPI threw:', err.message);
      throw err;
    }
    console.log('[AI] response data keys:', Object.keys(data));

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('[AI] no choices in response. data:', JSON.stringify(data));
      throw new Error('AI 返回数据格式异常（无 choices）');
    }
    if (!data.choices[0].message) {
      console.error('[AI] no message in choice[0]. choice:', JSON.stringify(data.choices[0]));
      throw new Error('AI 返回数据格式异常（无 message）');
    }

    const content = data.choices[0].message.content;
    console.log('[AI] raw content length:', content ? content.length : 0);
    console.log('[AI] raw content preview:', content ? content.slice(0, 500) : '(empty)');

    if (!content || content.trim().length === 0) {
      console.error('[AI] content is empty. finish_reason:', data.choices[0].finish_reason);
      throw new Error('AI 返回了空内容');
    }

    if (data.choices[0].finish_reason === 'length') {
      console.error('[AI] finish_reason=length');
      throw new Error('AI 输出被截断，请尝试简化目标描述或更换支持更长输出的模型');
    }

    this._reportStage(onProgress, 3, content);
    await this._delay(300);

    const planData = this._extractJSON(content);
    if (!planData) {
      console.error('[AI] _extractJSON failed');
      throw new Error('AI 返回的内容无法解析为 JSON，请重试');
    }
    console.log('[AI] _extractJSON success. planData keys:', Object.keys(planData));

    this._reportStage(onProgress, 4, content);
    await this._delay(300);

    return this.convertToPlan(planData);
  },

  _extractJSON(content) {
    console.log('[AI] _extractJSON called, content length:', content ? content.length : 0);
    if (!content) return null;

    let text = content.trim();

    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\s*```\s*$/i, '').trim();
    console.log('[AI] after removing markdown, length:', text.length);

    try {
      const parsed = JSON.parse(text);
      console.log('[AI] direct parse success');
      return parsed;
    } catch (e) {
      console.log('[AI] direct parse failed:', e.message);
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    console.log('[AI] firstBrace:', firstBrace, 'lastBrace:', lastBrace);

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('[AI] substring parse success');
        return parsed;
      } catch (e) {
        console.log('[AI] substring parse failed:', e.message);
      }

      const cleaned = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
      try {
        const parsed = JSON.parse(cleaned);
        console.log('[AI] cleaned parse success');
        return parsed;
      } catch (e2) {
        console.log('[AI] cleaned parse failed:', e2.message);
      }
    }

    console.error('[AI] all parse attempts failed');
    return null;
  },

  _reportStage(onProgress, stageId, rawContent = '') {
    if (onProgress) {
      const stage = this.STAGES.find(s => s.id === stageId);
      onProgress({ stage: stageId, total: this.STAGES.length, label: stage?.label || '', desc: stage?.desc || '', rawContent });
    }
  },

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

    this._reportStage(onProgress, 1);
    await this._delay(200);
    this._reportStage(onProgress, 2);

    const body = { model: config.model, messages, temperature: 0.7, max_tokens: 4096 };
    const data = await this._callChatAPI(config, body);

    this._reportStage(onProgress, 3);
    await this._delay(200);
    this._reportStage(onProgress, 4);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return { type: 'text', content: 'AI 返回数据格式异常' };
    }

    const content = data.choices[0].message.content;
    const planData = this._extractJSON(content);

    if (planData) {
      const plan = this.convertToPlan(planData);
      return { type: 'plan', content: '好的，我已经根据你的反馈调整了计划：', plan };
    }

    return { type: 'text', content: content.trim() };
  },

  async _callChatAPI(config, body) {
    const apiUrl = config.apiUrl.replace(/\/+$/, '');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    console.log('[AI] POST', apiUrl + '/chat/completions');

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
        stages: nodes.filter(n => !n.parentId).length,
        maxDepth: nodes.length > 0 ? Math.max(...nodes.map(n => n.depth || 1)) : 1,
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

    if (!apiUrl) return { success: false, error: 'API 地址不能为空' };
    if (!apiKey) return { success: false, error: 'API Key 不能为空' };
    if (!model) return { success: false, error: '模型名称不能为空' };

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