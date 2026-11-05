export const tabs = ["lecture", "lab", "practice", "quiz", "notes", "roadmap"];
export function emptyState(course = "S1-L01") {
  return { schemaVersion: 1, course, tab: "lecture", read: false,
    drafts: {}, codes: {}, predictions: {}, observations: {}, ran: [],
    answers: {}, submitted: false, personalNotes: "" };
}
export function normalizeState(value, experiments, checkpoints, quiz, course = "S1-L01") {
  if (!value || value.schemaVersion !== 1 || value.course !== course)
    throw new Error("进度文件与课程编号或版本不匹配。");
  const state = emptyState(course);
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
  const lines = ["# " + state.course + " 课堂作答", "", "这些内容为个人课堂练习，待老师评阅；不是正式阶段考试。", "",
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

export function emptyBook(catalog) {
  return { schemaVersion: 2, course: "agent-engineering-lab",
    currentLesson: catalog[0].id, lessons: {} };
}
export function normalizeBook(value, catalog) {
  const book = emptyBook(catalog);
  // Import/migrate an original single-lesson backup without losing its answers.
  if (value?.schemaVersion === 1) {
    const item = catalog.find(item => item.id === value.course);
    if (!item) throw new Error("找不到备份中的课程。");
    book.currentLesson = item.id;
    book.lessons[item.id] = normalizeState(value, item.experiments, item.checkpoints, item.quiz, item.id);
    return book;
  }
  if (!value || value.schemaVersion !== 2 || value.course !== book.course || !value.lessons || typeof value.lessons !== "object")
    throw new Error("不是有效的课程备份。");
  if (catalog.some(item => item.id === value.currentLesson)) book.currentLesson = value.currentLesson;
  for (const item of catalog) {
    if (!Object.hasOwn(value.lessons, item.id)) continue;
    book.lessons[item.id] = normalizeState(value.lessons[item.id], item.experiments, item.checkpoints, item.quiz, item.id);
  }
  return book;
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
    let checks = 0;
    const output = (...values) => {
      if (lines++ < 80) send({ type: "log", text: values.map(format).join(" ") });
    };
    self.console = { log: output, info: output, warn: output, error: output, debug: output, table: output };
    const sameValue = (left, right) => {
      if (Object.is(left, right)) return true;
      if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
      if (Array.isArray(left) !== Array.isArray(right)) return false;
      const keys = Object.keys(left);
      return keys.length === Object.keys(right).length &&
        keys.every(key => Object.hasOwn(right, key) && sameValue(left[key], right[key]));
    };
    const verify = (condition, message) => {
      if (!condition) throw new Error("检查失败：" + message);
      checks++;
    };
    const matchesError = (error, expected) => {
      if (!expected) return true;
      if (expected instanceof RegExp) return expected.test(error.message);
      if (typeof expected === "function") return expected(error) === true;
      return Object.entries(expected).every(([key,value]) => error[key] === value);
    };
    // 网页只提供本课程用到的断言子集，不把它冒充完整 node:assert。
    const assert = {
      equal: (actual, expected, message) => verify(Object.is(actual, expected), message || format(actual) + " 应等于 " + format(expected)),
      deepEqual: (actual, expected, message) => verify(sameValue(actual, expected), message || "结构或字段不一致"),
      ok: (value, message) => verify(Boolean(value), message || "预期条件成立"),
      throws: (operation, expected) => {
        let caught;
        try { operation(); } catch (error) { caught = error; }
        verify(!!caught && matchesError(caught, expected), "预期抛出匹配的异常");
      },
      rejects: async (operation, expected) => {
        let caught;
        try { await (typeof operation === "function" ? operation() : operation); }
        catch (error) { caught = error; }
        verify(!!caught && matchesError(caught, expected), "预期异步操作被拒绝");
      },
    };
    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      await new AsyncFunction("assert", event.data)(assert);
      send({ type: "done", checks });
    } catch (error) {
      send({ type: "error", text: error.name + ": " + error.message });
    }
  };
}
