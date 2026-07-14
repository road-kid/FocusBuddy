# FocusBuddy

**AI 替你做规划，你只管去执行。**

FocusBuddy 是一款 AI 驱动的个人目标管理工具。你只需要描述自己想达成什么，AI 会自动帮你拆解为多层嵌套的可执行任务，并为记忆类任务安排科学的复习节奏。

## 核心理念

传统目标管理工具的六阶段闭环——目标制定、目标拆解、计划制定、执行、定期盘点、复盘——中，用户需要自行完成五项认知工作。FocusBuddy 用 AI 接管其中五项，用户只需做两件事：

- 描述自己想要什么
- 每天执行任务

## 功能特性

- **AI 对话式目标创建** — 告诉 AI 你的目标方向，自动生成 SMART 目标 + 多层任务拆解
- **六层嵌套任务结构** — 目标 → 任务 → 子任务，最多 6 层深度，既是信息组织也是心理层级映射
- **自下而上进度计算** — 叶子节点打卡 → 父节点自动汇总 → 目标总进度实时更新
- **两种进度模式** — 勾选完成（completion）和量化打卡（quantify），量化支持加总和更新两种子模式
- **重置周期** — 不重置 / 每日 / 每周 / 每月，适配不同任务节奏
- **艾宾浩斯记忆法** — 记忆类任务自动按 `[1, 2, 4, 7, 15, 30]` 天间隔排程复习，用户无需理解遗忘曲线
- **自定义复习频次** — 支持自定义间隔重复天数
- **三轨 AI 后端** — 演示模式 / 云端 API（DeepSeek 等）/ 本地 Ollama，零代码切换
- **纯前端，打开即用** — 无需注册、无需后端、无需安装

## 技术栈

| 层级 | 选型 |
|------|------|
| 前端 | 纯 HTML + CSS + JavaScript，无框架依赖 |
| 路由 | Hash Router SPA |
| 样式 | CSS 变量 + 移动端优先（375px 基准） |
| AI 接口 | OpenAI 兼容格式（`/v1/chat/completions`），SSE 流式输出 |
| 本地模型 | Ollama（OpenAI 兼容端点，`localhost:11434/v1`） |
| 数据存储 | 浏览器 LocalStorage |

## 快速开始

### 演示模式（无需任何配置）

1. 打开 `index.html`
2. 选择角色 → 描述目标 → AI 生成方案 → 确认
3. 在日程页打卡完成任务

### 连接云端 AI

1. 进入设置页
2. 后端类型选择「云 API」
3. 填入 API 地址、API Key、模型名称
4. 点击「测试连接」验证

### 连接本地 Ollama

1. 安装并启动 [Ollama](https://ollama.ai)
2. 拉取模型：`ollama pull qwen3:9b`
3. 进入设置页，后端类型选择「本地 Ollama」
4. 默认地址 `http://localhost:11434/v1`，选择模型，测试连接

支持的本地模型推荐：

| 模型 | 特点 |
|------|------|
| `qwen3:9b` | 中文能力强，推荐 |
| `gemma3:4b` | 轻量快速 |
| `llama3.1:8b` | 通用能力强 |

## 项目结构

```
focusbuddy/
├── index.html          # 入口页面
├── css/
│   └── style.css       # 全局样式（CSS 变量 + 组件 + 页面）
├── js/
│   ├── app.js          # 路由、初始化、Tab 切换、全局事件
│   ├── onboard.js      # 3 步引导流程
│   ├── chat.js         # AI 对话首页
│   ├── schedule.js     # 今日日程（打卡 + 量化输入）
│   ├── goals.js        # 我的目标（进度 + 节点树展开）
│   ├── settings.js     # 设置（三轨后端切换）
│   ├── ai.js           # SSE 流式调用 + JSON 解析
│   ├── storage.js      # LocalStorage CRUD
│   ├── demo.js         # 演示模式预设
│   ├── prompts.js      # AI Prompt 模板
│   ├── progress.js     # 进度计算引擎
│   └── utils.js        # 工具函数
└── assets/
```

## 数据模型

所有数据存储在浏览器 LocalStorage 中，6 个 Key：

| Key | 说明 |
|-----|------|
| `focusbuddy_config` | 用户配置（角色、后端类型等） |
| `focusbuddy_goals` | 目标列表 |
| `focusbuddy_krs` | 关键结果 |
| `focusbuddy_nodes` | 任务节点（扁平存储，parentId 构建树） |
| `focusbuddy_records` | 执行记录 |
| `focusbuddy_messages` | AI 对话历史 |

### 任务节点嵌套结构

```
目标：清华大学考研上岸
├── 数学复习（depth:1, daily）
│   ├── 高数第三章（depth:2, daily）
│   │   ├── 看教材 §3.1-§3.3（depth:3, once）
│   │   ├── 做课后习题 20 道（depth:3, quantify, accumulate）
│   │   └── 整理错题（depth:3, weekly）
│   └── 做 1 套数学真题（depth:2, weekly）
├── 英语复习（depth:1, daily）
│   ├── 背诵核心词汇 50 个（depth:2, quantify, spacedRepetition）
│   └── 做 2 篇阅读理解（depth:2, quantify）
└── 政治复习（depth:1, weekly）
    └── 看 1 节网课（depth:2, weekly）
```

进度自下而上计算：叶子节点打卡 → 父节点取子节点平均值 → 目标取顶层节点平均值。

## 部署

### Vercel（推荐）

```bash
git init && git add . && git commit -m "init"
# 推送到 GitHub，Vercel 导入自动部署
```

### 直接打开

双击 `index.html` 即可在浏览器中使用。

## License

MIT
