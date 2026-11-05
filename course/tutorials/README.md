# 详细教程与本地实操

本版保留 S1-L01 原讲义，补写其余30课。catalog.mjs 注册教材状态；每课包含场景、机制、步骤、可运行代码、预期输出、故障练习、项目迁移和速记。阅读与公开例题不代替个人项目和考试。

Node.js 24：先 npm ci，再 npm run tutorial -- S3-L01（替换为目标课号）。Windows 可使用 powershell -NoProfile -File scripts/run.ps1 tutorial S3-L01。

Python 课先创建 .venv，使用该解释器 pip install -r examples/tutorial-requirements.txt。CI 使用 Python 3.12；可通过 COURSE_PYTHON 指定解释器。

Markdown 是源，npm run classroom:build 提取 examples/tutorials/ 文件并同步课程讲义、速记与 public/learn.html。课堂支持逐课下载本地文件；浏览器 Worker 只执行原有 JavaScript 机制实验，不安装 MCP 或 Python 依赖。

验证：2026-11-05，npm run check 本地通过50项检查（含全部30份新增实操、提取一致性与原有课堂/骨架检查）、TypeScript 和 Vite 构建。真实 MCP 子进程、SQLite、FastAPI ASGI、回环 HTTP 均按对应课程运行。

边界：embedding/reranker/模型裁判使用合成夹具；未调用付费模型，未做云部署或生产压测。浏览器外观与交互回归尚待本版复核。脚本通过不证明个人已掌握或实际系统生产可用。
