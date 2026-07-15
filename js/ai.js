const AI = {
  async generateGoalPlan(userGoal, userLevel, duration, onProgress) {
    const config = Storage.getConfig();

    if (config.backendType === 'demo') {
      return this.demoGenerate(userGoal, userLevel, duration, onProgress);
    }

    return this.apiGenerate(userGoal, userLevel, duration, onProgress, config);
  },

  async demoGenerate(userGoal, _userLevel, duration, onProgress) {
    await this.delay(500);

    if (onProgress) {
      onProgress('正在分析你的目标...');
    }
    await this.delay(800);

    if (onProgress) {
      onProgress('正在制定多层任务计划...');
    }
    await this.delay(800);

    if (onProgress) {
      onProgress('正在优化任务层级结构...');
    }
    await this.delay(600);

    const plan = DemoData.getDemoPlanResponse({
      title: userGoal,
      description: userGoal,
      deadlineDays: duration || 90,
    });

    if (onProgress) {
      onProgress('方案已生成！');
    }

    return plan;
  },

  async apiGenerate(userGoal, userLevel, duration, onProgress, config) {
    try {
      const userRole = this._getUserRoleLabel(config.userRole);
      const systemPrompt = Prompts.generateGoalSystemPrompt(userRole);
      const userPrompt = Prompts.generateGoalUserPrompt(userGoal, userLevel, duration);

      if (onProgress) {
        onProgress('正在连接 AI...');
      }

      const response = await fetch(`${config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析 AI 返回的 JSON');
      }

      const planData = JSON.parse(jsonMatch[0]);
      return this.convertToPlan(planData);
    } catch (error) {
      console.error('AI API Error:', error);
      throw error;
    }
  },

  async chat(userGoal, currentPlan, userMessage, conversationHistory, onProgress) {
    const config = Storage.getConfig();

    if (config.backendType === 'demo') {
      return this.demoChat(userGoal, currentPlan, userMessage, onProgress);
    }

    return this.apiChat(userGoal, currentPlan, userMessage, conversationHistory, onProgress, config);
  },

  async demoChat(userGoal, currentPlan, userMessage, onProgress) {
    await this.delay(600);

    if (onProgress) {
      onProgress('正在分析你的反馈...');
    }
    await this.delay(800);

    const response = DemoData.getDemoChatResponse(userGoal, currentPlan, userMessage);

    if (onProgress) {
      onProgress('已生成回复');
    }

    return {
      type: 'text',
      content: response,
    };
  },

  async apiChat(userGoal, currentPlan, userMessage, conversationHistory, onProgress, config) {
    try {
      const userRole = this._getUserRoleLabel(config.userRole);
      const systemPrompt = Prompts.followUpSystemPrompt(userRole);

      const planSummary = this._summarizePlan(currentPlan);
      const userPrompt = Prompts.followUpUserPrompt(userGoal, planSummary, userMessage);

      const messages = [
        { role: 'system', content: systemPrompt },
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
          });
        });
      }

      messages.push({ role: 'user', content: userPrompt });

      if (onProgress) {
        onProgress('正在连接 AI...');
      }

      const response = await fetch(`${config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: false,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const planData = JSON.parse(jsonMatch[0]);
          const plan = this.convertToPlan(planData);
          return {
            type: 'plan',
            content: '好的，我已经根据你的反馈调整了计划：',
            plan,
          };
        } catch (e) {
          // JSON 解析失败，作为纯文本回复
        }
      }

      return {
        type: 'text',
        content: content.trim(),
      };
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
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
      items.forEach(item => {
        const nodeId = Utils.generateId();
        nodes.push({
          id: nodeId,
          goalId,
          parentId,
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

    const leafNodes = nodes.filter(n => {
      return !nodes.some(n2 => n2.parentId === n.id);
    });

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
    parts.push(`每日任务：约 ${currentPlan.summary.dailyTasks} 个`);

    const topNodes = currentPlan.nodes.filter(n => !n.parentId);
    if (topNodes.length > 0) {
      const names = topNodes.map(n => n.title).join('、');
      parts.push(`一级任务：${names}`);
    }

    return parts.join('；');
  },

  async testConnection(config) {
    try {
      const response = await fetch(`${config.apiUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`连接失败: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        models: data.data?.map(m => m.id) || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};