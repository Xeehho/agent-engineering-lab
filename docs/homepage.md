# 课程首页

入口为 /，互动课堂为 /learn.html，原工单实验台为 /lab.html。三者可以互相跳转；Vite 同时构建首页与实验台 HTML，课堂保持单文件产物。

## 页面内容

- 课程目标与适合人群：从 AI Coding 到能设计、解释、验证和改进 AI 应用。
- 四类预期成果：可复现项目、架构/取舍、故障复盘、作品集与答辩；以实际项目和考核为条件。
- 八阶段目录：可展开查看全部课程，逐课跳转。
- 前置基础：JavaScript、React/TS 阅读、HTTP/JSON、Git/终端、亲自验证的习惯。
- 可在课内学习的内容、环境准备、学习方式与 FAQ。
- 开发者介绍、GitHub 个人主页与项目 Star 链接。

## 内容来源与维护

- src/LandingPage.tsx 与 src/home.css：首页结构和样式。
- src/site-content.ts：作者简介、准备条件、成果与 FAQ。
- src/generated/course-overview.ts：由 classroom:build 从真实课程目录生成，数量和阶段不另维护一套。
- src/Workbench.tsx / src/workbench.css：保留原实验台行为，样式限定在实验台。
- 作者以 Xeehho 为展示名，简介中的四年前端经验与 AI Coding 实践来自项目所有者提供的信息。未添加未经提供的雇主、头衔、成绩或学员评价。
- 2026-11-05 通过 GitHub 官方 API 核对公开账号、主页和头像；头像保存为本地 JPEG，页面不依赖实时请求 GitHub 数据。
- Star 按钮链接 https://github.com/Xeehho/agent-engineering-lab ，不会自动替访客点 Star，也未展示模拟的 Star 数。

正式在线体验入口为https://www.xeehho-ai.com，由项目所有者配置域名部署。项目所有者授权公开仓库，代码MIT、课程CC BY 4.0。仓库实际可见性以GitHub当前状态为准。

项目初衷是维护者自己的系统学习：以BOSS直聘上20个北京30K+公开岗位样本为参照，整理React前端转AI应用工程需要补齐的知识，再开源学习资料。样本按岗位计数，来源与核验范围保留在docs/career/中。

## 验证

沿用 npm run check，并在浏览器检查课程展开/深链接、准备自查、FAQ、作者头像、首页↔课堂↔实验台、手机菜单和水平溢出。具体记录见 classroom/VERIFICATION.md。
