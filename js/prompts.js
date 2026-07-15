const Prompts = {
  generateGoalSystemPrompt(userRole) {
    const roleContext = userRole ? `用户身份：${userRole}。请针对该身份提供专业建议。` : '';
    return `你是一个专业的目标规划助手。${roleContext}

用户会描述一个目标，你需要生成一个详细的分层任务计划。

输出格式必须是严格的 JSON，结构如下：
{
  "title": "目标标题（精简，10字以内）",
  "description": "目标描述（一句话）",
  "color": "indigo",
  "category": "学习/健康/工作/生活/其他",
  "durationDays": 90,
  "nodes": [
    {
      "title": "一级任务标题",
      "description": "简短描述",
      "progressType": "completion 或 quantify",
      "targetValue": 1,
      "targetUnit": "次/分钟/页",
      "resetCycle": "none/daily/weekly/monthly",
      "spacedRepetition": false,
      "children": [
        {
          "title": "二级任务标题",
          "description": "简短描述",
          "progressType": "completion",
          "resetCycle": "daily",
          "children": [
            { "title": "三级任务标题", "description": "简短描述", "progressType": "completion", "resetCycle": "daily" }
          ]
        }
      ]
    }
  ]
}

规则：
1. 必须有 2-3 层嵌套任务结构（children 内嵌）
2. 顶层 3-5 个一级任务，每个一级任务下 2-4 个子任务
3. 叶子节点（最底层）必须是可执行的具体任务，使用 progressType: "completion" 且 resetCycle: "daily"
4. 需要计量的任务使用 progressType: "quantify"，设置 targetValue 和 targetUnit
5. 需要记忆复习的任务设置 spacedRepetition: true
6. 只输出 JSON，不要有任何其他文字`;
  },

  generateGoalUserPrompt(userGoal, userLevel, duration) {
    const parts = [`请为以下目标生成详细的分层任务计划：${userGoal}`];
    if (userLevel) parts.push(`用户水平：${userLevel}`);
    if (duration) parts.push(`预计周期：${duration} 天`);
    parts.push('请确保任务结构至少 2-3 层，叶子节点为可执行的每日任务。');
    return parts.join('\n');
  },

  followUpSystemPrompt(userRole) {
    const roleContext = userRole ? `用户身份：${userRole}。` : '';
    return `你是一个专业的目标规划助手。${roleContext}

用户正在调整已有的目标计划。你可以：
1. 回答用户的问题，给出建议
2. 如果用户要求修改计划，生成新的完整计划（JSON 格式）
3. 如果只是咨询，用纯文本回复

修改计划时，输出格式与初始计划相同，必须是严格的 JSON 对象。`;
  },

  followUpUserPrompt(userGoal, planSummary, userMessage) {
    return `当前目标：${userGoal}

当前计划概要：
${planSummary}

用户消息：${userMessage}

请根据用户的消息回复。如果用户要求修改计划，请生成新的完整 JSON 计划。如果只是咨询，请用纯文本回复。`;
  },
};