const Storage = {
  KEYS: {
    CONFIG: 'focusbuddy_config',
    GOALS: 'focusbuddy_goals',
    NODES: 'focusbuddy_nodes',
    RECORDS: 'focusbuddy_records',
    MESSAGES: 'focusbuddy_messages',
  },

  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  },

  init() {
    const config = this.getConfig();
    config.inited = true;
    this.saveConfig(config);
    return true;
  },

  getConfig() {
    return this.get(this.KEYS.CONFIG, {
      onboarded: false,
      userRole: '',
      backendType: 'demo',
      apiUrl: '',
      apiKey: '',
      model: '',
      focusDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      weekStartsOn: 1,
      theme: 'system',
      notifications: true,
      soundEnabled: true,
      autoStartBreak: false,
      autoStartFocus: false,
    });
  },

  saveConfig(config) {
    return this.set(this.KEYS.CONFIG, config);
  },

  getGoals() {
    return this.get(this.KEYS.GOALS, []);
  },

  saveGoals(goals) {
    return this.set(this.KEYS.GOALS, goals);
  },

  addGoal(goal) {
    const goals = this.getGoals();
    goals.push(goal);
    this.saveGoals(goals);
    return goal;
  },

  updateGoal(goalId, updates) {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates };
      this.saveGoals(goals);
      return goals[index];
    }
    return null;
  },

  deleteGoal(goalId) {
    const goals = this.getGoals().filter(g => g.id !== goalId);
    this.saveGoals(goals);
    const nodes = this.getNodes().filter(n => n.goalId !== goalId);
    this.saveNodes(nodes);
    const records = this.getRecords().filter(r => r.goalId !== goalId);
    this.saveRecords(records);
  },

  archiveGoal(goalId) {
    return this.updateGoal(goalId, { archived: true, archivedAt: new Date().toISOString() });
  },

  unarchiveGoal(goalId) {
    return this.updateGoal(goalId, { archived: false, archivedAt: null });
  },

  getNodes() {
    return this.get(this.KEYS.NODES, []);
  },

  saveNodes(nodes) {
    return this.set(this.KEYS.NODES, nodes);
  },

  addNode(node) {
    const nodes = this.getNodes();
    nodes.push(node);
    this.saveNodes(nodes);
    return node;
  },

  updateNode(nodeId, updates) {
    const nodes = this.getNodes();
    const index = nodes.findIndex(n => n.id === nodeId);
    if (index !== -1) {
      nodes[index] = { ...nodes[index], ...updates };
      this.saveNodes(nodes);
      return nodes[index];
    }
    return null;
  },

  deleteNode(nodeId) {
    const nodes = this.getNodes();
    const toDelete = [nodeId];
    const findChildren = (parentId) => {
      nodes.filter(n => n.parentId === parentId).forEach(child => {
        toDelete.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(nodeId);
    const remaining = nodes.filter(n => !toDelete.includes(n.id));
    this.saveNodes(remaining);
    const records = this.getRecords().filter(r => !toDelete.includes(r.nodeId));
    this.saveRecords(records);
  },

  getGoalNodes(goalId) {
    return this.getNodes().filter(n => n.goalId === goalId);
  },

  getChildNodes(parentId) {
    return this.getNodes().filter(n => n.parentId === parentId);
  },

  getRecords() {
    return this.get(this.KEYS.RECORDS, []);
  },

  saveRecords(records) {
    return this.set(this.KEYS.RECORDS, records);
  },

  addRecord(record) {
    const records = this.getRecords();
    records.push(record);
    this.saveRecords(records);
    return record;
  },

  getRecordsByDateRange(startDate, endDate) {
    return this.getRecords().filter(r => r.date >= startDate && r.date <= endDate);
  },

  getTodayRecords() {
    const today = Utils.getTodayStr();
    return this.getRecords().filter(r => r.date === today);
  },

  getNodeRecords(nodeId) {
    return this.getRecords().filter(r => r.nodeId === nodeId);
  },

  getNodeRecordsByDate(nodeId, date) {
    return this.getRecords().filter(r => r.nodeId === nodeId && r.date === date);
  },

  getMessages() {
    return this.get(this.KEYS.MESSAGES, []);
  },

  saveMessages(messages) {
    return this.set(this.KEYS.MESSAGES, messages);
  },

  addMessage(message) {
    const messages = this.getMessages();
    messages.push(message);
    this.saveMessages(messages);
    return message;
  },

  clearMessages() {
    this.saveMessages([]);
  },

  exportData() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config: this.getConfig(),
      goals: this.getGoals(),
      nodes: this.getNodes(),
      records: this.getRecords(),
      messages: this.getMessages(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusbuddy-backup-${Utils.getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (data.config) this.saveConfig(data.config);
      if (data.goals) this.saveGoals(data.goals);
      if (data.nodes) this.saveNodes(data.nodes);
      if (data.records) this.saveRecords(data.records);
      if (data.messages) this.saveMessages(data.messages);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },
};