const AI = {
  async generateGoalPlan(userGoal, userLevel, duration, onProgress) {
    const config = Storage.getConfig();

    if (config.backendType === 'demo') {
      return this.demoGenerate(userGoal, userLevel, duration, onProgress);
    }

    return this.apiGenerate(userGoal, userLevel, duration, onProgress, config);
  },

  async demoGenerate(userGoal, userLevel, duration, onProgress) {
    await this.delay(500);

    if (onProgress) {
      onProgress('正在分析你的目标...');
    }
    await this.delay(800);

    if (onProgress) {
      onProgress('正在制定学习计划...');
    }
    await this.delay(800);

    if (onProgress) {
      onProgress('正在优化任务结构...');
    }
    await this.delay(600);

    const plan = DemoData.getDemoPlanResponse({
      title: userGoal,
      description: userGoal,
      deadlineDays: duration,
    });

    if (onProgress) {
      onProgress('方案已生成！');
    }

    return plan;
  },

  async apiGenerate(userGoal, userLevel, duration, onProgress, config) {
    try {
      const systemPrompt = Prompts.generateGoalSystemPrompt;
      const userPrompt = Prompts.generateGoalUserPrompt(userGoal, userLevel, duration);

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

  convertToPlan(planData) {
    const goalId = Utils.generateId();
    const endDate = Utils.addDays(new Date(), planData.durationDays || 90);

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
        duration: planData.durationDays || 90,
        dailyTasks: Math.ceil(leafNodes.filter(n => n.resetCycle === 'daily').length),
      },
    };
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
