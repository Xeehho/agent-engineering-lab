# Agent Engineering Lab

从AI Coding交付，进阶到能设计、验证、排错的AI应用工程。课程针对有前端经验、长期使用AI写代码的学习者，按能力验收推进。

**当前版本：原第一课保留，后续30课已补写分步教程、可运行实操、预期输出、故障练习与速记。个人作业与考试仍待真实提交。**

本地实操：Node.js 24 下执行 npm ci，再运行 npm run tutorial -- S3-L01 等课号。Python 课先创建 .venv 并安装 examples/tutorial-requirements.txt。教程源在 course/tutorials/，构建自动提取脚本到 examples/tutorials/；网页提供逐课下载。真实组件、合成夹具与未做的模型/生产验证均在各课标明。
本仓库的Mock不会理解工单内容。绿色CI只证明骨架正常，不能证明模型效果、作业完成或考试通过。

## 从这里开始

**[课程首页](http://127.0.0.1:5173/)**：启动项目后先看课程体系、学习成果、前置条件与准备自查；有开发者 Xeehho 的介绍及 GitHub Star 入口。[项目实验台](http://127.0.0.1:5173/lab.html)与课堂各有独立入口。

**[打开单文件互动课堂](public/learn.html)**：下载 HTML 后直接用浏览器打开，或启动项目访问 http://127.0.0.1:5173/learn.html 。八阶段 31 课、34 个机制实验、95 道开放题、96 道公开自测与笔记集中在一页；支持搜索、逐课记录、旧版迁移和全课程备份。[使用与维护说明](classroom/README.md)。

[知识体系与学习投入](course/knowledge-map.md) · [全部课程](course/README.md) · [求职作品与面试训练](docs/career/job-readiness.md)。React/TypeScript 为主线，补 Python、模型机制、工具、MCP、SQL/状态、RAG、多角色、评测、观测与部署。

聊天中继续由老师讲解、追问和评阅，配套资料保存在[课堂目录](course/README.md)。当前课：[完整讲义](course/stage-01/lessons/01-success-contracts.md) · [速记](course/stage-01/notes/01-quick-reference.md) · [随堂题](course/stage-01/exercises/01-checkpoint.md) · [离线实验](examples/lesson-01/README.md)。

1. [起点诊断：先凭自己的理解回答](course/diagnostic.md)
2. [第一阶段计划](course/stage-01/plan.md)
3. [第一课：理解一次模型调用](course/stage-01/lesson.md)
4. [第一阶段任务与接口契约](course/stage-01/assignment.md)
5. [练习题与排错题](course/stage-01/questions.md)
6. [考试与评分规则](assessments/stage-01/exam-blueprint.md)
7. [提交模板](submissions/stage-01/README.md)

## 项目

最终做成一个“研发知识与工单Agent工作台”：

~~~text
React工作台 → 应用服务 → Agent/Workflow → 模型
                          ↓
                       MCP工具 → 文档/工单
                          ↓
                   状态、评测与执行记录
~~~

第一阶段只完成工单分诊：输入校验、模型调用、结构化输出、异常、超时、流式响应与取消。核心代码在server/learning/中留作作业。前端骨架、HTTP入口、Mock和故障情境已提供。

## 启动

使用Node.js 24 LTS；Windows默认Node若较旧，可使用仓库脚本。脚本只为当前进程选择已有Node 24，不更改系统配置。

~~~powershell
git clone git@github.com:Xeehho/agent-engineering-lab.git
cd agent-engineering-lab
powershell -NoProfile -File scripts/run.ps1 install
powershell -NoProfile -File scripts/run.ps1 dev
~~~

浏览器打开 http://127.0.0.1:5173 查看首页；课堂在 /learn.html，原工单实验台在 /lab.html，API在127.0.0.1:8787。若已使用Node 24，直接npm install、npm run dev即可。

~~~powershell
powershell -NoProfile -File scripts/run.ps1 doctor
powershell -NoProfile -File scripts/run.ps1 check
powershell -NoProfile -File scripts/run.ps1 practice:stage1
~~~

- check：TypeScript、骨架测试、前端构建，初始应通过。
- practice:stage1：11条公开的作业验收，初始应失败；流式和真实模型另行检查。
- doctor：环境与验证范围，不给学习者打分。
- .env.example：真实接入练习预留字段；骨架不读取这些字段，也不发模型API请求。

## 课程与老师

[阶段路线](course/roadmap.md) · [AI协作与考试制度](course/learning-contract.md) · [当前进度](learning/progress.json) · [回到新聊天继续学习](course/continue-with-teacher.md)

你的老师会根据诊断、当前提交和实际表现调整速度。你可以跳过已经用证据证明掌握的内容；每阶段仍需要作业评阅和变式考试。AI使用范围会与个人掌握程度分别记录。

## 岗位依据

[岗位能力与学习路线](docs/career/ai-agent-skills.md) · [20个岗位初筛来源](docs/career/beijing-jobs.md)

这些是公开信息初筛，部分来自索引或转载，并非20份完整JD。来源材料中的建议不能当作招聘方硬要求。具体能力抽取与证据限制保留在文档内。

## 工程范围

默认离线Mock；没有真实模型验证、后端生产运行、部署或岗位录用结论。仓库不含作业答案和提前固定的正式考卷。所有任务均使用样例数据。
