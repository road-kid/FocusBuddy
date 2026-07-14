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
      backendType: 'demo',
      apiUrl: '',
      apiKey: '',
      model: '',
      weekStartsOn: 1,
      theme: 'system',
      notifications: true,
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
};
