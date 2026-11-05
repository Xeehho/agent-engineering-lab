export const developer = {
  name: 'Xeehho',
  github: 'https://github.com/Xeehho',
  repository: 'https://github.com/Xeehho/agent-engineering-lab',
  avatar: '/images/xeehho-avatar.jpg',
  role: '前端开发者 · AI 应用工程探索者',
  bio: [
    '有 4 年前端开发经验，也在持续用 AI Coding 参与日常开发。我希望在交付功能之外，把模型、工具、数据、状态与验证真正串起来。',
    '因此发起了 Agent Engineering Lab，把这条学习路径整理成有讲义、有实验、有项目验收的课程。希望和同样在探索的开发者一起，做出能解释、能验证、能持续改进的 AI 应用。',
  ],
} as const;

export const foundations = [
  { id: 'javascript', title: 'JavaScript 基础', detail: '能读懂函数、对象、数组、模块，以及 Promise / async / await。', review: '先补函数、对象与异步，再尝试第一课的运行示例。' },
  { id: 'react', title: 'React 与 TypeScript 阅读能力', detail: '了解组件、状态、事件与基本类型，能顺着代码追踪一次页面请求。', review: '先熟悉组件、状态和基础类型；不要求已经精通框架。' },
  { id: 'web', title: '基本的 Web 请求知识', detail: '知道浏览器与服务端如何通过 HTTP / JSON 交换数据，会看状态码。', review: '先弄清请求、响应、状态码和 JSON 的关系。' },
  { id: 'tools', title: 'Git、终端与本地项目', detail: '能克隆仓库、安装依赖、运行命令，并提交一次代码修改。', review: '先练习克隆、启动和提交一个小项目。' },
  { id: 'verification', title: '愿意亲自阅读与验证', detail: '可以继续用 AI 写代码，但愿意说明预期、运行结果和失败原因。', review: '从一个小实验开始：先预测，再运行，最后解释差异。' },
] as const;

export const outcomes = [
  { title: '做出完整的 AI 应用', detail: '从模型响应到工具、检索、任务状态和 React 界面，完成一条可运行的用户路径。', evidence: '一套能复现的项目代码' },
  { title: '解释清楚工程取舍', detail: '知道何时需要 RAG、MCP 或多 Agent，也能解释简单方案为什么足够。', evidence: '架构图与技术决策记录' },
  { title: '定位失败并验证修复', detail: '能沿着日志、Trace、数据和状态找问题，处理超时、越权、重复执行与恢复。', evidence: '故障复盘与回归结果' },
  { title: '带着证据展示能力', detail: '用评测、演示和本人讲解说明项目；准备简历项目段、系统设计与面试追问。', evidence: '作品集与项目答辩' },
] as const;

export const faqs = [
  { question: '零基础可以直接学吗？', answer: '这套课程面向有编程基础的开发者，尤其适合有前端经验、希望进入 AI 应用开发的人。如果还不能读懂基本 JavaScript 和一次 HTTP 请求，建议先补这些基础，再进入项目练习。' },
  { question: '可以继续使用 AI Coding 吗？', answer: '可以。课程不按手写代码行数评分，而是检查你能否定义正确结果、阅读关键实现、亲自验证并解释失败。项目允许 AI 协作；概念答辩要求本人作答。' },
  { question: '开始前必须会 Python、机器学习或高等数学吗？', answer: '不需要先精通这些内容。主线采用 React / TypeScript，课程内补充模型机制、Python 后端桥接与数据工程。模型训练、CUDA 和深入算法研究属于后续深化方向。' },
  { question: '需要准备付费模型 API 吗？', answer: '阅读、作答和 {experiments} 个浏览器机制实验不需要 API Key。后续真实接入与效果验证需要你选择并授权可用服务；没有条件时可先完成离线部分，真实验证单独记录待补。' },
  { question: '学完就能达到什么水平？', answer: '完成项目、实测与阶段考核后，目标是能独立构建并解释一套 AI 应用，能排错、评测和交付，并形成可审阅的求职作品。课程提供能力训练，实际岗位匹配仍需要本人表现与招聘过程检验。' },
  { question: '必须按固定天数完成吗？', answer: '不需要。教材全部开放，可以按基础与时间安排学习。建议为阅读和项目预留约 90–150 小时；这是投入参考。已掌握的内容可以直接提交证据，正式阶段题在交卷后另行生成。' },
] as const;
