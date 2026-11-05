# 单文件互动课堂

第一课的讲义、4 个本地实验、5 道随堂题、6 道公开自测和速记，统一在 [public/learn.html](../public/learn.html)。

## 打开

- 下载 learn.html 后，用现代浏览器直接打开；所有样式、脚本和教材均内嵌，无需安装或 API Key。
- 也可以运行 npm run dev，访问 http://127.0.0.1:5173/learn.html 。
- 部分浏览器可能限制 file:// 下的存储或 Worker。运行器会明确提示，改用本地服务即可。
- 当前只交付本地页面与仓库文件，没有创建在线托管。

## 使用

讲义 → 预测并运行实验 → 填写随堂题 → 提交公开自测 → 复习速记。所有内容可自由切换；适合已有前端基础的学习者按掌握情况推进。

开放题只显示“已填写 · 待评阅”，不会按关键词自动判为掌握。自测会评分并给解析，但不计入正式阶段考试。正式新题仍在作业 commit 提交后生成。网页不修改 learning/progress.json，也不发模型请求。

浏览器 localStorage 保存草稿、代码修改、实验预测/观察、笔记和最近自测。不同来源和浏览器不互通；清缓存或隐私模式可能丢失，请使用“备份 JSON”。导入先校验版本和字段，再确认覆盖。保存记录可以编辑，不是防作弊或教师验证证据。

“导出作答 Markdown”包含个人答案、实验记录与笔记。发到教学聊天后由老师评阅，不自动上传、提交或入库。打印仅包含课程速记。

## 维护与验证

~~~powershell
powershell -NoProfile -File scripts/run.ps1 classroom:build
powershell -NoProfile -File scripts/run.ps1 check
~~~

- 讲义与速记来自 course/stage-01/ 的 Markdown；不要手工修改生成后的 HTML。
- classroom/content.mjs：公开实验、随堂题与自测；新题或知识点同时更新对应 Markdown。
- classroom/core.mjs：进度格式、评分与导出。
- classroom/app.js、classroom.css、index.template.html：交互、样式与页面结构。
- scripts/build-classroom.mjs：生成全部内嵌的 public/learn.html；--check 检测教材与生成文件是否同步。
- tests/classroom.test.mjs：评分、导入边界、进度、导出、转义、产物同步与真实演示执行。浏览器另验运行、超时、错误、保存/恢复、导出/导入、键盘与窄屏。
- Vite 构建把 public/learn.html 原样复制到 dist/learn.html。

代码实验在独立 Worker 中执行，限制三秒，日志数量与长度有上限；通过 CSP 禁用网络连接，不读取页面答案或本地存储。它是本机课堂运行器，不是面向恶意代码的安全服务。TypeScript 题只供阅读，运行实验明确使用等价 JavaScript。

交互参考 [learn-py.org](https://learn-py.org/) 的课程导航与读、练、测流程；教材、示例与视觉设计由本项目编写，没有复用第三方课程正文、图片或源码。后续课还未编写，不将课程目录标为已完成。仓库保持既有可见性，未新增发行许可证。
