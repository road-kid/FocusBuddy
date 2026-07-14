const Progress = {
  calculateNodeProgress(nodeId) {
    const node = Storage.getNodes().find(n => n.id === nodeId);
    if (!node) return 0;

    const children = Storage.getChildNodes(nodeId);

    if (children.length === 0) {
      return this.calculateLeafProgress(node);
    }

    const childProgresses = children.map(child => this.calculateNodeProgress(child.id));
    if (childProgresses.length === 0) return 0;
    return childProgresses.reduce((a, b) => a + b, 0) / childProgresses.length;
  },

  calculateLeafProgress(node) {
    const today = Utils.getTodayStr();
    const records = Storage.getNodeRecordsByDate(node.id, today);

    if (node.progressType === 'completion') {
      return records.length > 0 && records.some(r => r.completed) ? 1 : 0;
    }

    if (node.progressType === 'quantify') {
      const target = node.targetValue || 1;
      const current = records.reduce((sum, r) => sum + (r.value || 0), 0);
      return Math.min(1, current / target);
    }

    return records.length > 0 && records.some(r => r.completed) ? 1 : 0;
  },

  calculateGoalProgress(goalId) {
    const topLevelNodes = Storage.getNodes().filter(
      n => n.goalId === goalId && !n.parentId
    );

    if (topLevelNodes.length === 0) return 0;

    const progresses = topLevelNodes.map(node => this.calculateNodeProgress(node.id));
    return progresses.reduce((a, b) => a + b, 0) / progresses.length;
  },

  getTodayTasks() {
    const today = new Date();
    const todayStr = Utils.getTodayStr();
    const tasks = [];

    const goals = Storage.getGoals().filter(g => !g.archived);

    goals.forEach(goal => {
      const nodes = Storage.getGoalNodes(goal.id);

      nodes.forEach(node => {
        const isLeaf = Storage.getChildNodes(node.id).length === 0;
        if (!isLeaf) return;

        const shouldShow = this.isTaskDueToday(node, today);
        if (shouldShow) {
          const progress = this.calculateLeafProgress(node);
          const todayRecords = Storage.getNodeRecordsByDate(node.id, todayStr);

          tasks.push({
            ...node,
            goal,
            progress,
            todayRecords,
            completed: progress >= 1,
          });
        }
      });
    });

    return tasks;
  },

  isTaskDueToday(node, today) {
    if (!node.resetCycle || node.resetCycle === 'none') {
      const records = Storage.getNodeRecords(node.id);
      if (node.progressType === 'completion') {
        return !records.some(r => r.completed);
      }
      return true;
    }

    if (node.resetCycle === 'daily') {
      return true;
    }

    if (node.resetCycle === 'weekly') {
      const dayOfWeek = today.getDay();
      const config = Storage.getConfig();
      const weekStartsOn = config.weekStartsOn || 1;
      return true;
    }

    if (node.resetCycle === 'monthly') {
      return true;
    }

    if (node.spacedRepetition) {
      return this.isSpacedRepetitionDue(node, today);
    }

    return true;
  },

  isSpacedRepetitionDue(node, today) {
    const records = Storage.getNodeRecords(node.id)
      .filter(r => r.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (records.length === 0) return true;

    const intervals = node.repetitionIntervals || [1, 2, 4, 7, 15, 30];
    const completedCount = records.length;
    const interval = intervals[Math.min(completedCount, intervals.length - 1)];
    const lastCompleted = new Date(records[0].date);
    const dueDate = Utils.addDays(lastCompleted, interval);

    return today >= dueDate;
  },

  toggleTaskCompletion(nodeId) {
    const todayStr = Utils.getTodayStr();
    const node = Storage.getNodes().find(n => n.id === nodeId);
    if (!node) return;

    const records = Storage.getNodeRecordsByDate(nodeId, todayStr);

    if (node.progressType === 'completion') {
      const completedRecord = records.find(r => r.completed);
      if (completedRecord) {
        const allRecords = Storage.getRecords();
        const filtered = allRecords.filter(r => r.id !== completedRecord.id);
        Storage.saveRecords(filtered);
      } else {
        Storage.addRecord({
          id: Utils.generateId(),
          nodeId,
          goalId: node.goalId,
          date: todayStr,
          completed: true,
          value: 1,
          createdAt: new Date().toISOString(),
        });
      }
    }
  },

  updateQuantifyProgress(nodeId, value) {
    const todayStr = Utils.getTodayStr();
    const node = Storage.getNodes().find(n => n.id === nodeId);
    if (!node) return;

    const existingRecords = Storage.getNodeRecordsByDate(nodeId, todayStr);
    const allRecords = Storage.getRecords();

    if (node.quantifyMode === 'accumulate') {
      Storage.addRecord({
        id: Utils.generateId(),
        nodeId,
        goalId: node.goalId,
        date: todayStr,
        completed: false,
        value: value,
        createdAt: new Date().toISOString(),
      });
    } else {
      const filtered = allRecords.filter(r => {
        return !(r.nodeId === nodeId && r.date === todayStr);
      });

      filtered.push({
        id: Utils.generateId(),
        nodeId,
        goalId: node.goalId,
        date: todayStr,
        completed: value >= (node.targetValue || 1),
        value: value,
        createdAt: new Date().toISOString(),
      });

      Storage.saveRecords(filtered);
    }
  },

  getTodayQuantifyValue(nodeId) {
    const todayStr = Utils.getTodayStr();
    const records = Storage.getNodeRecordsByDate(nodeId, todayStr);
    return records.reduce((sum, r) => sum + (r.value || 0), 0);
  },

  getCompletedCount(goalId) {
    const goalNodes = Storage.getGoalNodes(goalId);
    let count = 0;
    goalNodes.forEach(node => {
      const isLeaf = Storage.getChildNodes(node.id).length === 0;
      if (isLeaf) {
        const records = Storage.getNodeRecords(node.id);
        count += records.filter(r => r.completed).length;
      }
    });
    return count;
  },

  getTodayStats() {
    const todayTasks = this.getTodayTasks();
    const completed = todayTasks.filter(t => t.completed).length;
    const total = todayTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const todayRecords = Storage.getTodayRecords();
    const totalTime = todayRecords.reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      completed,
      total,
      rate,
      totalTime,
      skipped: 0,
      pending: total - completed,
    };
  },
};
