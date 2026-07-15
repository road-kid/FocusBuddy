const DemoData = {
  initDemoData() {
    // 不再自动初始化演示数据，用户通过聊天创建目标
  },

  getDemoPlanResponse(userGoal) {
    const goalId = Utils.generateId();
    const colors = ['pink', 'blue', 'green', 'purple', 'orange', 'teal'];
    const color = Utils.randomChoice(colors);

    const title = userGoal.title || userGoal.description || '新目标';
    const durationDays = userGoal.deadlineDays || 90;

    const goal = {
      id: goalId,
      title,
      description: userGoal.description || '',
      color,
      category: '学习',
      startDate: new Date().toISOString(),
      endDate: Utils.addDays(new Date(), durationDays).toISOString(),
      createdAt: new Date().toISOString(),
      archived: false,
    };

    const topNodes = this._buildDemoNodes(title);

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

  _buildDemoNodes(title) {
    const isLanguageGoal = title.includes('语') || title.includes('英语') || title.includes('日语') || title.includes('N2') || title.includes('N1');
    const isFitnessGoal = title.includes('健身') || title.includes('运动') || title.includes('减肥') || title.includes('锻炼');
    const isCodeGoal = title.includes('编程') || title.includes('代码') || title.includes('开发') || title.includes('Python') || title.includes('Java') || title.includes('前端');

    if (isFitnessGoal) {
      return [
        {
          title: '有氧训练',
          description: '提升心肺功能',
          depth: 1,
          progressType: 'completion',
          resetCycle: 'daily',
          children: [
            {
              title: '晨间慢跑',
              description: '每天清晨慢跑',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 30,
              targetUnit: '分钟',
              resetCycle: 'daily',
              children: [
                {
                  title: '热身拉伸',
                  description: '跑前热身5分钟',
                  depth: 3,
                  progressType: 'completion',
                  resetCycle: 'daily',
                },
                {
                  title: '跑步训练',
                  description: '慢跑或快走',
                  depth: 3,
                  progressType: 'quantify',
                  quantifyMode: 'accumulate',
                  targetValue: 20,
                  targetUnit: '分钟',
                  resetCycle: 'daily',
                },
                {
                  title: '跑后拉伸',
                  description: '跑后拉伸放松',
                  depth: 3,
                  progressType: 'completion',
                  resetCycle: 'daily',
                },
              ],
            },
            {
              title: '跳绳训练',
              description: '高强度间歇训练',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 500,
              targetUnit: '个',
              resetCycle: 'daily',
            },
          ],
        },
        {
          title: '力量训练',
          description: '增强肌肉力量',
          depth: 1,
          progressType: 'completion',
          resetCycle: 'daily',
          children: [
            {
              title: '俯卧撑',
              description: '锻炼胸肌和手臂',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 30,
              targetUnit: '个',
              resetCycle: 'daily',
            },
            {
              title: '仰卧起坐',
              description: '锻炼腹部核心',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 50,
              targetUnit: '个',
              resetCycle: 'daily',
            },
            {
              title: '深蹲',
              description: '锻炼下肢力量',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 40,
              targetUnit: '个',
              resetCycle: 'daily',
            },
          ],
        },
        {
          title: '饮食管理',
          description: '控制饮食摄入',
          depth: 1,
          progressType: 'completion',
          resetCycle: 'daily',
          children: [
            {
              title: '记录饮食',
              description: '记录每日饮食',
              depth: 2,
              progressType: 'completion',
              resetCycle: 'daily',
            },
            {
              title: '饮水目标',
              description: '每天喝足水',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 2000,
              targetUnit: '毫升',
              resetCycle: 'daily',
            },
          ],
        },
      ];
    }

    if (isCodeGoal) {
      return [
        {
          title: '基础知识学习',
          description: '系统学习核心概念',
          depth: 1,
          progressType: 'completion',
          resetCycle: 'daily',
          children: [
            {
              title: '理论学习',
              description: '学习教材或视频课程',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 45,
              targetUnit: '分钟',
              resetCycle: 'daily',
              children: [
                {
                  title: '看视频教程',
                  description: '观看教学视频',
                  depth: 3,
                  progressType: 'quantify',
                  quantifyMode: 'accumulate',
                  targetValue: 30,
                  targetUnit: '分钟',
                  resetCycle: 'daily',
                },
                {
                  title: '整理笔记',
                  description: '记录关键知识点',
                  depth: 3,
                  progressType: 'completion',
                  resetCycle: 'daily',
                  spacedRepetition: true,
                  repetitionIntervals: [1, 2, 4, 7, 15, 30],
                },
              ],
            },
            {
              title: '阅读文档',
              description: '阅读官方文档',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 20,
              targetUnit: '分钟',
              resetCycle: 'daily',
            },
          ],
        },
        {
          title: '动手实践',
          description: '通过项目练习巩固',
          depth: 1,
          progressType: 'completion',
          resetCycle: 'daily',
          children: [
            {
              title: '每日编程练习',
              description: '练习算法或小项目',
              depth: 2,
              progressType: 'quantify',
              quantifyMode: 'accumulate',
              targetValue: 60,
              targetUnit: '分钟',
              resetCycle: 'daily',
              children: [
                {
                  title: '算法题练习',
                  description: '刷 LeetCode 等算法题',
                  depth: 3,
                  progressType: 'quantify',
                  quantifyMode: 'accumulate',
                  targetValue: 3,
                  targetUnit: '题',
                  resetCycle: 'daily',
                },
                {
                  title: '项目开发',
                  description: '构建小型项目',
                  depth: 3,
                  progressType: 'quantify',
                  quantifyMode: 'accumulate',
                  targetValue: 30,
                  targetUnit: '分钟',
                  resetCycle: 'daily',
                },
              ],
            },
            {
              title: '代码审查',
              description: '阅读和分析优秀代码',
              depth: 2,
              progressType: 'completion',
              resetCycle: 'daily',
            },
          ],
        },
        {
          title: '每周回顾',
          description: '总结本周学习成果',
          depth: 1,
          progressType: 'completion',
          resetCycle: 'weekly',
          children: [
            {
              title: '知识总结',
              description: '写周报总结',
              depth: 2,
              progressType: 'completion',
              resetCycle: 'weekly',
            },
            {
              title: '下周计划',
              description: '制定下周学习计划',
              depth: 2,
              progressType: 'completion',
              resetCycle: 'weekly',
            },
          ],
        },
      ];
    }

    // 默认：语言学习或通用目标
    return [
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
            children: [
              {
                title: '阅读教材',
                description: '精读核心教材',
                depth: 3,
                progressType: 'quantify',
                quantifyMode: 'accumulate',
                targetValue: 30,
                targetUnit: '分钟',
                resetCycle: 'daily',
              },
              {
                title: '做笔记',
                description: '整理知识要点',
                depth: 3,
                progressType: 'completion',
                resetCycle: 'daily',
                spacedRepetition: true,
                repetitionIntervals: [1, 2, 4, 7, 15, 30],
              },
            ],
          },
          {
            title: '复习巩固',
            description: '复习学过的内容',
            depth: 2,
            progressType: 'completion',
            resetCycle: 'daily',
            children: [
              {
                title: '闪卡复习',
                description: '用艾宾浩斯记忆法复习',
                depth: 3,
                progressType: 'quantify',
                quantifyMode: 'accumulate',
                targetValue: 30,
                targetUnit: '个',
                resetCycle: 'daily',
                spacedRepetition: true,
                repetitionIntervals: [1, 2, 4, 7, 15, 30],
              },
              {
                title: '错题回顾',
                description: '回顾之前的错题',
                depth: 3,
                progressType: 'completion',
                resetCycle: 'daily',
              },
            ],
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
            children: [
              {
                title: '限时答题',
                description: '在规定时间内完成',
                depth: 3,
                progressType: 'completion',
                resetCycle: 'weekly',
              },
              {
                title: '自我评分',
                description: '对答案并打分',
                depth: 3,
                progressType: 'completion',
                resetCycle: 'weekly',
              },
            ],
          },
          {
            title: '错题整理',
            description: '整理本周错题',
            depth: 2,
            progressType: 'completion',
            resetCycle: 'weekly',
            children: [
              {
                title: '错题分类',
                description: '按知识点分类错题',
                depth: 3,
                progressType: 'completion',
                resetCycle: 'weekly',
              },
              {
                title: '错题重做',
                description: '重新做一遍错题',
                depth: 3,
                progressType: 'completion',
                resetCycle: 'weekly',
              },
            ],
          },
        ],
      },
      {
        title: '月度总结',
        description: '回顾月度进展',
        depth: 1,
        progressType: 'completion',
        resetCycle: 'monthly',
        children: [
          {
            title: '进度评估',
            description: '评估本月学习进度',
            depth: 2,
            progressType: 'completion',
            resetCycle: 'monthly',
          },
          {
            title: '调整计划',
            description: '根据进度调整下月计划',
            depth: 2,
            progressType: 'completion',
            resetCycle: 'monthly',
          },
        ],
      },
    ];
  },

  getDemoChatResponse(_userGoal, _currentPlanSummary, _userMessage) {
    const responses = [
      '好的，我理解你的想法。让我帮你调整一下计划，这样会更合理一些。',
      '不错的建议！我来优化一下任务结构，让它更适合你。',
      '明白了，我会根据你的反馈重新调整任务的层级和分配。',
      '没问题，我来调整一下节奏，让每天的负担更合理。',
      '好的，我会把任务拆得更细一些，方便你每天执行。',
    ];
    return Utils.randomChoice(responses);
  },
};