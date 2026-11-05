# 单文件互动课堂

八阶段31课讲义、65个可编辑网页实验、188道开放题、158道公开自测、31份脑图与3个工程架构视角、速记与笔记，统一在 [public/learn.html](../public/learn.html)。默认在网站内完成学习，不要求启动项目。[知识体系](../course/knowledge-map.md) · [全部课程](../course/README.md)。

## 打开

- 下载 learn.html 后，用现代浏览器直接打开；所有样式、脚本和教材均内嵌，无需安装或 API Key。
- 开发和选做进阶时才需要本地项目；普通学习者直接使用网站或单文件。
- 部分浏览器可能限制 file:// 下的存储或 Worker。运行器会明确提示，改用本地服务即可。
- 仓库保留既有托管适配；是否在线更新以部署状态为准，课堂学习不依赖后端。

## 使用

讲义 → 预测并运行实验 → 填写随堂题 → 提交公开自测 → 复习速记。所有内容可自由切换；适合已有前端基础的学习者按掌握情况推进。

开放题只显示“已填写 · 待评阅”，不会按关键词自动判为掌握。自测会评分并给解析，但不计入正式阶段考试。正式新题仍在作业 commit 提交后生成。网页不修改老师保存的私有进度，也不发模型请求。

浏览器 localStorage 按课隔离草稿、代码修改、实验预测/观察、笔记和最近自测；相同的 C1/Q1 不会跨课混用。课程搜索、深链接和上一/下一课均可自由使用，不需要先答题解锁。知识地图将能力映射到项目证据。

不同来源和浏览器不互通；清缓存或隐私模式可能丢失，请使用“备份全部课程 JSON”。兼容旧版第一课存储和 JSON 备份；旧记录保持原键，首次载入迁移，不删除。导入先校验版本和字段，再确认替换全课程记录；可选择文件或粘贴 JSON。重置只清当前课。记录可编辑，不是防作弊或教师验证证据。

“导出作答 Markdown”包含个人答案、实验记录与笔记。发到教学聊天后由老师评阅，不自动上传、提交或入库。打印仅包含课程速记。

## 维护与验证

~~~powershell
powershell -NoProfile -File scripts/run.ps1 classroom:build
powershell -NoProfile -File scripts/run.ps1 check
~~~

- 第一课讲义与速记来自原 Markdown，互动题来自 classroom/content.mjs。
- 后续讲义在course/tutorials/，可读代码在code/，执行拆解在walkthrough/；网页实验在course/browser-demos/。元数据在course/content/与curriculum.mjs，构建统一同步配套文件。
- classroom/core.mjs：进度格式、评分与导出。
- classroom/app.js、classroom.css、index.template.html：交互、样式与页面结构。
- scripts/build-classroom.mjs、scripts/course-materials.mjs：生成全部内嵌的 public/learn.html 和配套资料；--check 检测所有生成文件是否同步。
- tests/classroom.test.mjs：评分、导入边界、进度、导出、转义、产物同步与真实演示执行。浏览器另验运行、超时、错误、保存/恢复、导出/导入、键盘与窄屏。
- Vite 构建把 public/learn.html 原样复制到 dist/learn.html。

代码实验在独立 Worker 中执行，限制三秒，日志数量与长度有上限；通过 CSP 禁用网络连接，不读取页面答案或本地存储。它是本机课堂运行器，不是面向恶意代码的安全服务。TypeScript 题只供阅读，运行实验明确使用等价 JavaScript。

运行器提供assert.equal/deepEqual/ok/throws/rejects教学子集，失败会立即提示，完成时显示实际检查数。它不是完整Node assert。完整本地实操代码默认折叠，带行号和复制按钮，下载入口是选做。数据库、MCP、Python的网页部分逐课注明推演与真实执行的范围。

交互参考 [learn-py.org](https://learn-py.org/) 的课程导航与读、练、测流程；教材、示例与视觉设计由本项目编写，没有复用第三方课程正文、图片或源码。教材已准备不等于学习者已经掌握。代码MIT，原创课程与脑图CC BY 4.0；混合产物范围见[LICENSING.md](../LICENSING.md)。
