# FocusBuddy AI 任务拆分 Prompt 方案

## System Prompt

```
你是目标规划专家。将用户目标拆解为3-6层嵌套任务体系。

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
- 所有叶子节点必须是 completion + daily
```

## User Prompt

```
目标：{userGoal}
用户水平：{userLevel || '未指定'}
预计周期：{duration || 90}天

请生成完整的JSON计划。
```

## 示例输出（供验证参考）

```json
{
  "title": "3个月日语N2",
  "description": "从零基础到通过JLPT N2考试",
  "color": "indigo",
  "category": "学习",
  "durationDays": 90,
  "nodes": [
    {
      "title": "第一阶段：基础构建",
      "description": "掌握基础语法和核心词汇",
      "progressType": "completion",
      "resetCycle": "none",
      "children": [
        {
          "title": "每日单词记忆",
          "description": "使用艾宾浩斯记忆法",
          "progressType": "quantify",
          "quantifyMode": "accumulate",
          "targetValue": 50,
          "targetUnit": "个",
          "resetCycle": "daily",
          "spacedRepetition": true,
          "repetitionIntervals": [1,2,4,7,15,30],
          "children": [
            {"title":"早晨复习","progressType":"completion","resetCycle":"daily"},
            {"title":"学习新词","progressType":"completion","resetCycle":"daily"},
            {"title":"晚上巩固","progressType":"completion","resetCycle":"daily"}
          ]
        },
        {
          "title": "语法学习",
          "progressType": "quantify",
          "quantifyMode": "accumulate",
          "targetValue": 5,
          "targetUnit": "条",
          "resetCycle": "daily",
          "children": [
            {"title":"学习新语法","progressType":"completion","resetCycle":"daily"},
            {"title":"做练习题","progressType":"completion","resetCycle":"daily"}
          ]
        }
      ]
    },
    {
      "title": "第二阶段：强化训练",
      "description": "通过真题训练提升应试能力",
      "progressType": "completion",
      "resetCycle": "none",
      "children": [
        {
          "title": "阅读理解训练",
          "progressType": "quantify",
          "quantifyMode": "accumulate",
          "targetValue": 2,
          "targetUnit": "篇",
          "resetCycle": "daily",
          "children": [
            {"title":"限时阅读","progressType":"completion","resetCycle":"daily"},
            {"title":"错题分析","progressType":"completion","resetCycle":"daily"}
          ]
        }
      ]
    }
  ]
}
```

## 验证要点

1. 在 API Playground（如 OpenRouter Playground）中测试
2. 检查输出是否为纯 JSON（无 markdown 代码块标记）
3. 检查 JSON 是否完整闭合（最后一个 `}` 存在）
4. 检查是否至少有 3 层嵌套
5. 检查量化任务是否包含 quantifyMode/targetValue/targetUnit
6. 检查记忆任务是否包含 spacedRepetition/repetitionIntervals
7. 建议设置 max_tokens: 4000 以上确保不被截断
