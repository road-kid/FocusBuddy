const DemoData = {
  initDemoData() {
    const goals = Storage.getGoals();
    if (goals.length > 0) return;

    const goal1Id = Utils.generateId();
    const goal2Id = Utils.generateId();

    const goalsData = [
      {
        id: goal1Id,
        title: '日语 N2 考试突破',
        description: '3个月内通过日语N2考试',
        color: 'pink',
        category: '学习',
        startDate: new Date().toISOString(),
        endDate: Utils.addDays(new Date(), 90).toISOString(),
        createdAt: new Date().toISOString(),
        archived: false,
      },
      {
        id: goal2Id,
        title: '每天健身30分钟',
        description: '保持健康，增强体质',
        color: 'green',
        category: '健康',
        startDate: new Date().toISOString(),
        endDate: Utils.addDays(new Date(), 180).toISOString(),
        createdAt: new Date().toISOString(),
        archived: false,
      },
    ];

    Storage.saveGoals(goalsData);

    const nodes = [];

    const mathId = Utils.generateId();
    nodes.push({
      id: mathId,
      goalId: goal1Id,
      parentId: null,
      title: '词汇学习',
      description: '每天背诵核心词汇',
      depth: 1,
      progressType: 'quantify',
      quantifyMode: 'accumulate',
      targetValue: 80,
      targetUnit: '个',
      resetCycle: 'daily',
      spacedRepetition: false,
      createdAt: new Date().toISOString(),
    });

    const mathChild1 = Utils.generateId();
    nodes.push({
      id: mathChild1,
      goalId: goal1Id,
      parentId: mathId,
      title: '背诵新词汇',
      description: '学习新的N2词汇',
      depth: 2,
      progressType: 'quantify',
      quantifyMode: 'accumulate',
      targetValue: 50,
      targetUnit: '个',
      resetCycle: 'daily',
      spacedRepetition: false,
      createdAt: new Date().toISOString(),
    });

    const mathChild2 = Utils.generateId();
    nodes.push({
      id: mathChild2,
      goalId: goal1Id,
      parentId: mathId,
      title: '复习旧词汇',
      description: '用艾宾浩斯记忆法复习',
      depth: 2,
      progressType: 'quantify',
      quantifyMode: 'accumulate',
      targetValue: 30,
      targetUnit: '个',
      resetCycle: 'daily',
      spacedRepetition: true,
      repetitionIntervals: [1, 2, 4, 7, 15, 30],
      createdAt: new Date().toISOString(),
    });

    const engId = Utils.generateId();
    nodes.push({
      id: engId,
      goalId: goal1Id,
      parentId: null,
      title: '语法学习',
      description: '掌握N2语法点',
      depth: 1,
      progressType: 'completion',
      resetCycle: 'daily',
      spacedRepetition: false,
      createdAt: new Date().toISOString(),
    });

    const engChild1 = Utils.generateId();
    nodes.push({
      id: engChild1,
      goalId: goal1Id,
      parentId: engId,
      title: '学习2个语法点',
      description: '理解并掌握新语法',
      depth: 2,
      progressType: 'completion',
      resetCycle: 'daily',
      spacedRepetition: false,
      createdAt: new Date().toISOString(),
    });

    const engChild2 = Utils.generateId();
    nodes.push({
      id: engChild2,
      goalId: goal1Id,
      parentId: engId,
      title: '做语法练习题',
      description: '巩固所学语法',
      depth: 2,
      progressType: 'quantify',
      quantifyMode: 'accumulate',
      targetValue: 20,
      targetUnit: '题',
      resetCycle: 'daily',
      spacedRepetition: false,
      createdAt: new Date().toISOString(),
    });

    const poliId = Utils.generateId();
    nodes.push({
      id: poliId,
      goalId: goal1Id,
      parentId: null,
      title: '听力训练',
      description: '提升听力水平',
      depth: 1,
      progressType: 'quantify',
      quantifyMode: 'accumulate',
      targetValue: 30,
      targetUnit: '分钟',
      resetCycle: 'daily',
      spacedRepetition: false,
      createdAt: new Date().toISOString(),
    });

    const fit1 = Utils.generateId();
    nodes.push({
      id: fit1,
      goalId: goal2Id,
      parentId: null,
      title: '有氧训练',
      description: '跑步或跳绳',
      depth: 1,
      progressType: 'quantify',
      quantifyMode: 'accumulate',
      targetValue: 20,
      targetUnit: '分钟',
      resetCycle: 'daily',
      spacedRepetition: false,
      createdAt: new Date().toISOString(),
    });

    const fit2 = Utils.generateId();
    nodes.push({
      id: fit2,
      goalId: goal2Id,
      parentId: null,
      title: '力量训练',
      description: '俯卧撑、仰卧起坐',
      depth: 1,
      progressType: 'completion',
      resetCycle: 'daily',
      spacedRepetition: false,
      createdAt: new Date().toISOString(),
    });

    Storage.saveNodes(nodes);
  },

  getDemoPlanResponse(userGoal) {
    const goalId = Utils.generateId();
    const colors = ['pink', 'blue', 'green', 'purple', 'orange', 'teal'];
    const color = Utils.randomChoice(colors);

    const goal = {
      id: goalId,
      title: userGoal.title || userGoal.description || '新目标',
      description: userGoal.description || '',
      color,
      category: '学习',
      startDate: new Date().toISOString(),
      endDate: userGoal.deadlineDays ? Utils.addDays(new Date(), userGoal.deadlineDays).toISOString() : Utils.addDays(new Date(), 90).toISOString(),
      createdAt: new Date().toISOString(),
      archived: false,
    };

    const topNodes = [
      {
        title: '每日学习',
        description: '每天的基础学习任务',
        depth: 1,
        progressType: 'completion',
        resetCycle: 'daily',
        children: [
          {
            title: '核心内容学习',
            description: '学习新知识',
            depth: 2,
            progressType: 'quantify',
            quantifyMode: 'accumulate',
            targetValue: 60,
            targetUnit: '分钟',
            resetCycle: 'daily',
          },
          {
            title: '复习巩固',
            description: '复习学过的内容',
            depth: 2,
            progressType: 'completion',
            resetCycle: 'daily',
            spacedRepetition: true,
            repetitionIntervals: [1, 2, 4, 7, 15, 30],
          },
        ],
      },
      {
        title: '每周测试',
        description: '检验学习成果',
        depth: 1,
        progressType: 'completion',
        resetCycle: 'weekly',
        children: [
          {
            title: '模拟测试',
            description: '完成一套模拟题',
            depth: 2,
            progressType: 'completion',
            resetCycle: 'weekly',
          },
          {
            title: '错题整理',
            description: '整理本周错题',
            depth: 2,
            progressType: 'completion',
            resetCycle: 'weekly',
          },
        ],
      },
    ];

    const nodes = [];
    const createNodes = (items, parentId) => {
      items.forEach(item => {
        const nodeId = Utils.generateId();
        nodes.push({
          id: nodeId,
          goalId,
          parentId,
          title: item.title,
          description: item.description || '',
          depth: item.depth,
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
          createNodes(item.children, nodeId);
        }
      });
    };
    createNodes(topNodes, null);

    const days = Utils.daysBetween(new Date(), goal.endDate);

    return {
      goal,
      nodes,
      summary: {
        totalTasks: nodes.filter(n => {
          const hasChildren = nodes.some(n2 => n2.parentId === n.id);
          return !hasChildren;
        }).length,
        duration: days,
        dailyTasks: Math.ceil(nodes.filter(n => {
          const hasChildren = nodes.some(n2 => n2.parentId === n.id);
          return !hasChildren && n.resetCycle === 'daily';
        }).length),
      },
    };
  },
};
