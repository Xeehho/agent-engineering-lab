# 详细教程与本地实操

本轮复核31课。默认直接在网站内阅读、运行实验、作答、自测和记笔记，不需要clone、安装依赖、启动项目或提供Key。真实组件与完整作品保留为进阶路径。

讲义写问题与机制；walkthrough/写术语、输入输出、函数拆解、执行追踪和有提示的练习；code/存放可读的进阶源码。网页源码在../browser-demos/，任务与范围在../browser-guidance.mjs。catalog.mjs注册材料，不证明个人掌握。

选做本地实操：Node24下先npm ci，再npm run tutorial -- S3-L01。Windows可使用scripts/run.ps1 tutorial S3-L01。Python课另建.venv并安装examples/tutorial-requirements.txt，CI固定Python3.12。

维护时先npm run teaching:format，再classroom:build。构建展开include代码引用与walkthrough，生成完整Markdown讲义、速记、examples/tutorials/和单文件课堂；不要编辑生成副本。网页本地代码默认折叠，带行号、复制与选做下载。

验证记录见[课堂验证](../../classroom/VERIFICATION.md)与[本轮修订](../REVISION-2026-11-05.md)。自动检查执行全部网页代码与30份进阶实操，并核对生成同步、目录锚点、错误反馈和进度隔离。实际浏览器另验网页实验与阅读流程，代码通过不替代教学审阅。

边界：网页的Python、SQL与MCP部分标明推演范围，真实组件在进阶实操验证。embedding/reranker/模型裁判仍使用合成夹具；没有付费模型调用、云部署或生产压测结论。个人作业和正式考试须真实提交。
