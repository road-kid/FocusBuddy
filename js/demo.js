const DemoData = {
  initDemoData() {
    const config = Storage.getConfig();
    if (config.demoInitialized) return;

    // Create demo goal: "30天掌握Python"
    const demoGoal = {
      id: Utils.generateId(),
      name: '30天掌握Python',
      color: 'purple',
      createdAt: new Date().toISOString(),
      deadline: Utils.addDays(new Date(), 30).toISOString(),
      archived: false,
    };
    Storage.addGoal(demoGoal);

    // Create hierarchical task structure
    const tasks = [
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: null,
        name: 'Python基础语法',
        progressType: 'completion',
        resetCycle: 'none',
        order: 1,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: null,
        name: '数据结构与算法',
        progressType: 'completion',
        resetCycle: 'none',
        order: 2,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: null,
        name: '面向对象编程',
        progressType: 'completion',
        resetCycle: 'none',
        order: 3,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: null,
        name: '实战项目',
        progressType: 'completion',
        resetCycle: 'none',
        order: 4,
      },
    ];

    tasks.forEach(task => Storage.addNode(task));

    // Add subtasks for "Python基础语法"
    const basicSyntaxId = tasks[0].id;
    const subtasks1 = [
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: basicSyntaxId,
        name: '变量与数据类型',
        progressType: 'completion',
        resetCycle: 'none',
        order: 1,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: basicSyntaxId,
        name: '控制流（if/for/while）',
        progressType: 'completion',
        resetCycle: 'none',
        order: 2,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: basicSyntaxId,
        name: '函数定义与调用',
        progressType: 'completion',
        resetCycle: 'none',
        order: 3,
      },
    ];
    subtasks1.forEach(task => Storage.addNode(task));

    // Add subtasks for "数据结构与算法"
    const dataStructId = tasks[1].id;
    const subtasks2 = [
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: dataStructId,
        name: '列表与元组',
        progressType: 'completion',
        resetCycle: 'none',
        order: 1,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: dataStructId,
        name: '字典与集合',
        progressType: 'completion',
        resetCycle: 'none',
        order: 2,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: dataStructId,
        name: '排序算法',
        progressType: 'completion',
        resetCycle: 'none',
        order: 3,
      },
    ];
    subtasks2.forEach(task => Storage.addNode(task));

    // Add subtasks for "面向对象编程"
    const oopId = tasks[2].id;
    const subtasks3 = [
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: oopId,
        name: '类与对象',
        progressType: 'completion',
        resetCycle: 'none',
        order: 1,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: oopId,
        name: '继承与多态',
        progressType: 'completion',
        resetCycle: 'none',
        order: 2,
      },
    ];
    subtasks3.forEach(task => Storage.addNode(task));

    // Add subtasks for "实战项目"
    const projectId = tasks[3].id;
    const subtasks4 = [
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: projectId,
        name: '待办事项应用',
        progressType: 'completion',
        resetCycle: 'none',
        order: 1,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: projectId,
        name: '数据分析脚本',
        progressType: 'completion',
        resetCycle: 'none',
        order: 2,
      },
    ];
    subtasks4.forEach(task => Storage.addNode(task));

    // Add deeper level subtasks (3rd level)
    const listTupleId = subtasks2[0].id;
    const deepSubtasks = [
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: listTupleId,
        name: '列表推导式',
        progressType: 'completion',
        resetCycle: 'none',
        order: 1,
      },
      {
        id: Utils.generateId(),
        goalId: demoGoal.id,
        parentId: listTupleId,
        name: '切片操作',
        progressType: 'completion',
        resetCycle: 'none',
        order: 2,
      },
    ];
    deepSubtasks.forEach(task => Storage.addNode(task));

    // Mark config as demo initialized
    config.demoInitialized = true;
    config.onboarded = true;
    Storage.saveConfig(config);
  },
};