export function courseMaterials(lessons, stages) {
  const files = new Map();
  files.set("course/README.md", [
    "# 课堂资料目录", "",
    lessons.length + " 课、" + stages.length + " 阶段。详细教程 " + lessons.filter(item=>item.contentLevel==="detailed").length + " 课，简版 " + lessons.filter(item=>item.contentLevel==="brief").length + " 课。网站内直接阅读、实验、作答和自测，无需启动项目；材料状态与学习者掌握/考试分开。", "",
    "[互动课堂](../public/learn.html) · [知识地图](knowledge-map.md) · [阶段路线](roadmap.md) · [求职证据](../docs/career/job-readiness.md)", "",
    "## 课程目录", "", "|课号|主题|材料状态|讲义|速记|随堂题|公开自测|", "|---|---|---|---|---|---|---|",
    ...lessons.map(item => "|" + item.id + "|" + item.title + "|" + (item.contentLevel==="detailed"?"详细教程":"简版待扩写") + "|[阅读](" + item.lecturePath.replace(/^course\//,"") +
      ")|[速记](" + item.notesPath.replace(/^course\//,"") + ")|[作答](" + item.checkpointPath.replace(/^course\//,"") +
      ")|[自测](stage-" + item.stage + "/exercises/" + item.id + "-self-check.md)|"),
    "", "## 项目与考核", "",
    ...stages.map(stage => "- [" + stage.id + " " + stage.title + "](stage-" + stage.id + "/plan.md)： " + stage.deliverable),
    "", "网页实验源码在 course/browser-demos/，任务和边界在 browser-guidance.mjs；生成副本见 examples/course/。网站内即可完成核心学习。真实 Python、SQLite、MCP 等选做实操在 examples/tutorials/；完整作品与真实系统考核另交证据。", "",
    "阶段公开考试蓝图均已准备；正式概念与故障变式在交卷后生成，个人评阅和成绩不预先填写。", "",
    "## 维护", "", "course/content/ 与 course/curriculum.mjs 提供元数据，tutorials/ 提供讲义，tutorials/code/ 提供实操，tutorials/walkthrough/ 提供函数拆解，browser-demos/ 提供网页实验。先 npm run teaching:format，再 npm run classroom:build 生成配套文件。第一课讲义和速记仍是源文件。", "",
    "[资料沉淀约定](TEACHING.md) · [贡献约定](../CONTRIBUTING.md) · [继续找老师](continue-with-teacher.md)", "",
  ].join("\n"));
  const stageById = new Map(stages.map(stage => [stage.id, stage]));
  for (const item of lessons) {
    const stage = stageById.get(item.stage);
    const sources = item.sources.map(source => "- [" + source[0] + "](" + source[1] + ")").join("\n");
    const experimentText = item.experiments.map(demo => [
      "## 实验：" + demo.title, "", demo.intro, "", "~~~js", demo.code, "~~~", "",
      "观察方向：" + demo.expected, "", "提示：" + demo.hint, "",
    ].join("\n")).join("\n");
    const checkpoints = item.checkpoints.map(check => [
      "## " + check.id + " " + check.title, "", check.text, "",
      ...(check.code ? ["~~~text", check.code, "~~~", ""] : []),
      "提示：" + check.hint, "",
    ].join("\n")).join("\n");
    const quiz = item.quiz.map(check => [
      "## " + check.id + " " + check.question, "",
      ...check.options.map((option, index) => "- " + String.fromCharCode(65 + index) + ". " + option), "",
      "公开解析：" + String.fromCharCode(65 + check.answer) + "。" + check.explanation, "",
    ].join("\n")).join("\n");
    if (item.id !== "S1-L01") {
      files.set(item.lecturePath, [
        "# " + item.id + "｜" + item.title, "",
        "教材状态：已编写，可提前学习；不代表学习者已作答或通过考试。",
        "阶段：" + stage.id + " " + stage.title + "。先修：" + stage.prerequisites + "。",
        "建议投入：" + item.duration + "。允许 AI 协作，要求本人解释与验证。", "",
        "## 本课目标", "", ...item.goals.map(goal => "- " + goal), "",
        ...item.sections.flatMap((section, index) => ["## " + (index + 1) + ". " + section[0], "", section[1], ""]),
        "## 动手验证", "", "先写预测，再运行，最后修改一个条件观察反例。不要把网页机制演示当成真实基础设施验证。", "",
        experimentText,
        "## 本课项目任务", "", item.project, "",
        "先写你预期的行为，再让 AI 协作实现。提交具体 commit、输入、预期、实际、命令、失败复盘与未验证项；本教材不代做学习者项目。", "",
        "## 本阶段验收边界", "", ...stage.acceptance.map(text => "- " + text), "",
        "## 练习与考核", "", "随堂开放题需本人解释，自测为公开练习，不计正式成绩。正式考试在阶段交卷后生成新的概念与故障变式。", "",
        "## 资料来源与版本", "", "下列官方资料于 2026-11-05 核对；课程场景、实验与任务为本项目设计。实际接入应再次核对所用服务、协议与 SDK 版本。", "",
        sources, "",
      ].join("\n"));
      files.set(item.notesPath, ["# " + item.id + " 速记", "",
        "## 三个关键判断", "", ...item.sections.map(section => "- " + section[0] + "：" + section[1].split("。")[0] + "。"), "",
        "## 代码阅读检查", "", "- 数据与身份来自哪里？",
        "- 哪一步真正验证或执行了约束？", "- 哪类失败会被拒绝，何时停止或恢复？",
        "- 证据来自机制演示、Mock、真实服务还是生产？结论有多大范围？", "",
        "## 本课行动", "", item.project, "", "## 参考资料", "", sources, ""].join("\n"));
      files.set(item.checkpointPath, ["# " + item.id + " 随堂练习", "",
        "每题写结论、依据与补查证据。个人答案不自动进入通用教材。", "", checkpoints, ""].join("\n"));
    }
    files.set("course/stage-" + item.stage + "/exercises/" + item.id + "-self-check.md",
      ["# " + item.id + " 公开自测与解析", "", "这是公开练习，不是正式考试。HTML 默认在提交后显示解析；此文件公开保留课程内容。", "", quiz, ""].join("\n"));
    files.set("examples/course/" + item.id + ".mjs",
      "// " + item.id + " local teaching demo. No model API calls; not a complete homework solution.\n" +
      "import assert from \"node:assert/strict\";\n" +
      item.experiments.map((demo, index) => "{\nconsole.log(" + JSON.stringify("实验 " + (index + 1) + "：" + demo.title) + ");\n" + demo.code + "\n}\n").join("\n"));
    files.set("examples/course/" + item.id + ".md", ["# " + item.id + " 实验记录指导", "",
      "默认在互动课堂运行，assert由网页提供。也可在Node24下运行同名.mjs，文件已导入Node断言。真实Python、数据库、MCP和部署另做进阶，推演不替代实际系统。", "", experimentText, ""].join("\n"));
  }
  for (const stage of stages) {
    if (stage.id === "01") continue; // Existing first-stage assignment and public tests remain authoritative.
    const stageLessons = lessons.filter(item => item.stage === stage.id);
    files.set("course/stage-" + stage.id + "/plan.md", [
      "# 阶段 " + stage.id + "｜" + stage.title, "", "教材已编写，可提前阅读；阶段通过仍需本人交卷、答辩和新变式排错。", "",
      "## 先修与产物", "", "先修：" + stage.prerequisites, "", "产物：" + stage.deliverable, "",
      "## 学习与项目增量", "",
      ...stageLessons.flatMap(item => ["### " + item.id + " " + item.title, "", item.summary, "", item.project, "",
        "[讲义](lessons/" + item.id + ".md) · [速记](notes/" + item.id + ".md) · [随堂题](exercises/" + item.id + ".md) · [公开自测](exercises/" + item.id + "-self-check.md)", ""]),
      "## 过关证据", "", ...stage.acceptance.map(text => "- " + text), "",
      "## 交卷", "", "按 submissions/stage-" + stage.id + "/README.md 提交具体 commit。老师 review 后出新的概念与故障题，标准为总分 80/100，且答辩至少 20/30、项目至少 35/50、排错至少 12/20，无关键正确性缺陷。", "",
      "可以使用 AI 协作项目，但须说明个人判断、AI 范围和亲自验证内容；概念答辩要求本人作答。未做真实服务/模型验证时明确标记待验证，不以浏览器机制模拟替代。", "",
    ].join("\n"));
    files.set("assessments/stage-" + stage.id + "/exam-blueprint.md", [
      "# 阶段 " + stage.id + " 考试蓝图", "", "公开范围与评分规则；本文件没有提前固定的正式考题或答案。", "",
      "## 考查范围", "", ...stage.acceptance.map(text => "- " + text), "",
      "## 出题与评分", "", "交卷后基于具体 commit 生成新的概念、代码追问与故障变式。", "",
      "|部分|满分|最低分|依据|", "|---|---|---|---|",
      "|本人答辩|30|20|独立解释机制、边界与取舍|",
      "|项目与证据|50|35|按阶段契约评阅实现和可复现实测|",
      "|新变式排错|20|12|复现、定位、最小修复和回归|", "",
      "总分至少 80，且无关键正确性缺陷。公开自测、教材生成、CI 通过都不自动计入成绩。", "",
      "考试的理论回答要求本人完成；文字交流无法技术监考，记录为学习者独立完成声明。现场实现允许 AI，但必须解释。未通过时针对薄弱点补学，之后生成新的同等难度变式。", "",
      "## 状态", "", "尚未生成正式考卷、尚未阅卷、没有个人成绩。", "",
    ].join("\n"));
    files.set("submissions/stage-" + stage.id + "/README.md", [
      "# 阶段 " + stage.id + " 提交模板", "",
      "个人原始作答请放 submissions/private/ 或另行提供，不默认加入未来公开教材。", "",
      "## 提交身份", "", "- 分支 / commit：", "- 环境 / 运行命令：", "- 服务、数据库、模型和版本：", "",
      "## 验收证据", "", ...stage.acceptance.map(text => "- " + text + "：待提交证据"), "",
      "## 失败复盘", "", "复现 → 假设 → 观测 → 定位 → 最小修复 → 回归 → 未验证项。", "",
      "## 协作与边界", "", "- 本人的判断与亲自完成的验证：", "- AI 协助范围：",
      "- Mock / 真实模型 / 真实服务 / 生产验证分别说明：", "- 请求老师出题：", "",
    ].join("\n"));
  }
  return new Map([...files].map(([path, content]) => [path, content.trimEnd() + "\n"]));
}
