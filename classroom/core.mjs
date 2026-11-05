export const tabs = ["lecture", "lab", "practice", "quiz", "notes"];
export function emptyState() {
  return { schemaVersion: 1, course: "S1-L01", tab: "lecture", read: false,
    drafts: {}, codes: {}, predictions: {}, observations: {}, ran: [],
    answers: {}, submitted: false, personalNotes: "" };
}
export function normalizeState(value, experiments, checkpoints, quiz) {
  if (!value || value.schemaVersion !== 1 || value.course !== "S1-L01")
    throw new Error("这不是 S1-L01 的有效进度文件。");
  const state = emptyState();
  state.tab = tabs.includes(value.tab) ? value.tab : "lecture";
  state.read = value.read === true;
  state.submitted = value.submitted === true;
  const copyText = (from, to, ids, max) => {
    for (const id of ids) {
      const text = from && Object.hasOwn(from, id) ? from[id] : undefined;
      if (typeof text === "string") to[id] = text.slice(0, max);
    }
  };
  const experimentIds = experiments.map(item => item.id);
  copyText(value.drafts, state.drafts, checkpoints.map(item => item.id), 12000);
  copyText(value.codes, state.codes, experimentIds, 20000);
  copyText(value.predictions, state.predictions, experimentIds, 6000);
  copyText(value.observations, state.observations, experimentIds, 6000);
  state.ran = Array.isArray(value.ran) ? experimentIds.filter(id => value.ran.includes(id)) : [];
  for (const item of quiz) {
    const answer = value.answers && Object.hasOwn(value.answers, item.id) ? value.answers[item.id] : undefined;
    if (Number.isInteger(answer) && answer >= 0 && answer < item.options.length)
      state.answers[item.id] = answer;
  }
  state.submitted = state.submitted && quiz.every(item => Object.hasOwn(state.answers, item.id));
  if (typeof value.personalNotes === "string") state.personalNotes = value.personalNotes.slice(0, 20000);
  return state;
}
export function gradeQuiz(answers, quiz) {
  const items = quiz.map(item => ({ id: item.id, answered: Number.isInteger(answers[item.id]),
    correct: answers[item.id] === item.answer }));
  return { correct: items.filter(item => item.correct).length,
    answered: items.filter(item => item.answered).length, total: quiz.length, items };
}
export function summarizeProgress(state, experiments, checkpoints, quiz) {
  const drafted = checkpoints.filter(item => state.drafts[item.id]?.trim()).length;
  const grade = gradeQuiz(state.answers, quiz);
  const reviewed = state.submitted && grade.answered === quiz.length;
  const parts = [state.read, state.ran.length === experiments.length,
    drafted === checkpoints.length, reviewed];
  return { drafted, grade, parts, completed: parts.filter(Boolean).length };
}
export function exportAnswers(state, experiments, checkpoints, quiz) {
  const lines = ["# S1-L01 课堂作答", "", "这些内容为个人课堂练习，待老师评阅；不是正式阶段考试。", "",
    "AI 协助范围（请补充）：", "", "## 随堂题"];
  for (const item of checkpoints)
    lines.push("", "### " + item.id + " " + item.title, "", state.drafts[item.id] || "（未作答）");
  lines.push("", "## 实验记录", "", "全部为浏览器本地 JavaScript 演示，无真实模型调用。");
  for (const item of experiments) {
    lines.push("", "### " + item.title, "",
      "运行记录（本机可编辑的自报进度）：" + (state.ran.includes(item.id) ? "已运行" : "未运行"),
      "", "运行前预测：", state.predictions[item.id] || "（未填写）",
      "", "观察与证据边界：", state.observations[item.id] || "（未填写）");
  }
  lines.push("", "## 公开自测");
  if (state.submitted) {
    const grade = gradeQuiz(state.answers, quiz);
    lines.push("", "最近一次自测：" + grade.correct + "/" + grade.total + "，不计入正式成绩。");
  } else lines.push("", "尚未提交自测。");
  lines.push("", "## 我的笔记", "", state.personalNotes || "（未填写）", "");
  return lines.join("\n");
}

// Executed only in a dedicated Worker. No DOM or persistent storage is exposed.
// CSP blocks network access; this is a local learning runner, not a hostile-code security boundary.
export function classroomWorker() {
  const send = self.postMessage.bind(self);
  const format = value => {
    if (typeof value === "string") return value.slice(0, 4000);
    if (value === undefined) return "undefined";
    try { return JSON.stringify(value).slice(0, 4000); } catch { return String(value).slice(0, 4000); }
  };
  self.onmessage = async event => {
    let lines = 0;
    const output = (...values) => {
      if (lines++ < 80) send({ type: "log", text: values.map(format).join(" ") });
    };
    self.console = { log: output, info: output, warn: output, error: output, debug: output };
    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      await new AsyncFunction(event.data)();
      send({ type: "done" });
    } catch (error) {
      send({ type: "error", text: error.name + ": " + error.message });
    }
  };
}
