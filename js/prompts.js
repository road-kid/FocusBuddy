const Prompts = {
  generateGoalSystemPrompt(userRole) {
    const roleContext = userRole ? `用户身份：${userRole}。请针对该身份提供专业建议。` : '';
    return `你是目标规划专家。将用户目标拆解为3-6层嵌套任务体系。${roleContext}

输出规则（严格遵守）：
1. 只输出纯JSON，不要markdown代码块、不要任何解释文字
2. JSON必须完整闭合，确保最后一个大括号匹配
3. 使用children嵌套表示层级关系
4. 至少3层深度，最多6层

字段规范：
- title: 标题（10字以内）
- description: 描述（可选）
- color: pink/blue/green/purple/orange/teal/red/indigo
- category: 学习/健康/工作/生活/其他
- durationDays: 数字
- nodes: 根任务数组

节点字段：
- title, description
- progressType: completion(完成制) / quantify(量化)
- quantifyMode: accumulate(加总) / update(更新) — quantify任务必填
- targetValue: 数字, targetUnit: 单位 — quantify任务必填
- resetCycle: none/daily/weekly/monthly
- spacedRepetition: true/false — 记忆类任务必填
- repetitionIntervals: [1,2,4,7,15,30] — spacedRepetition为true时必填
- children: 子任务数组

约束：
- 第一层3-5个阶段/模块
- 第二层2-4个任务/阶段
- 第三层及以上为可执行动作
- 所有叶子节点必须是 completion + daily`;
  },

  generateGoalUserPrompt(userGoal, userLevel, duration) {
    return `目标：${userGoal}
用户水平：${userLevel || '未指定'}
预计周期：${duration || 90}天

请生成完整的JSON计划。`;
  },

  followUpSystemPrompt(userRole) {
    const roleContext = userRole ? `用户身份：${userRole}。` : '';
    return `你是目标规划助手。${roleContext}

用户正在调整已有的目标计划。你可以：
1. 回答用户的问题，给出建议（纯文本回复）
2. 如果用户要求修改计划，生成新的完整JSON计划
3. 保持3层以上的嵌套结构

修改计划时，输出格式与初始计划相同，必须是严格的JSON对象，只输出纯JSON。`;
  },

  followUpUserPrompt(userGoal, planSummary, userMessage) {
    return `当前目标：${userGoal}

当前计划概要：
${planSummary}

用户消息：${userMessage}

请根据用户的消息回复。如果用户要求修改计划，请生成新的完整 JSON 计划（保持3层以上嵌套）。如果只是咨询，请用纯文本回复。`;
  },
};