// MIT. 本机学习记录：不调用模型，不写教师成绩。
export const studyLimits = {
  notes: 150,
  mistakes: 200,
  body: 12000,
  context: 18000,
};
export const sourceLabels = {
  lesson: "课程笔记",
  lecture: "讲义知识点",
  experiment: "动手实验",
  checkpoint: "随堂练习",
  quiz: "公开自测",
  mindmap: "课程脑图",
  architecture: "工程架构",
};

export function emptyStudyState() {
  return {
    studyVersion: 1,
    notebook: [],
    mistakes: [],
    runs: {},
    lastQuizSubmission: null,
  };
}

function studyText(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}
function studyTime(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 && value <= 4102444800000
    ? value
    : fallback;
}
function studyCount(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? Math.min(value, 100000)
    : 0;
}
function studyChoice(value, options) {
  return Number.isInteger(value) && value >= 0 && value < options.length;
}

export function questionFingerprint(question) {
  // 只用于区分题面版本，不用作签名或防作弊证明。
  const source = JSON.stringify([
    question.question,
    question.options,
    question.answer,
  ]);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index++) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function normalizeStudySource(value, lesson) {
  if (!value || !Object.hasOwn(sourceLabels, value.type)) return null;
  const id = studyText(value.id, 80);
  const known =
    value.type === "experiment"
      ? lesson.experiments
      : value.type === "checkpoint"
        ? lesson.checkpoints
        : value.type === "quiz"
          ? lesson.quiz
          : null;
  if (known && !known.some((item) => item.id === id)) return null;
  if (value.type === "lecture" && !/^(?:advanced-)?section-\d{1,3}$/.test(id))
    return null;
  if (
    value.type === "architecture" &&
    id &&
    !/^(request|knowledge|quality):[a-z-]{1,40}$/.test(id)
  )
    return null;
  return {
    type: value.type,
    id: known || ["lecture", "architecture"].includes(value.type) ? id : "",
    label: studyText(value.label, 240) || sourceLabels[value.type],
  };
}

function normalizeStudyNote(value, lesson) {
  if (!value || !/^[\w-]{1,80}$/.test(value.id)) return null;
  const source = normalizeStudySource(value.source, lesson);
  if (!source) return null;
  return {
    id: value.id,
    source,
    title: studyText(value.title, 160),
    body: studyText(value.body, studyLimits.body),
    tags: Array.isArray(value.tags)
      ? [
          ...new Set(
            value.tags
              .filter((tag) => typeof tag === "string")
              .map((tag) => tag.trim().slice(0, 32))
              .filter(Boolean),
          ),
        ].slice(0, 6)
      : [],
    context: studyText(value.context, studyLimits.context),
    status: ["note", "weak", "reviewed"].includes(value.status)
      ? value.status
      : "note",
    createdAt: studyTime(value.createdAt),
    updatedAt: studyTime(value.updatedAt),
    dueAt: value.dueAt === null ? null : studyTime(value.dueAt, null),
    reviewCount: studyCount(value.reviewCount),
    reviewedAt: studyTime(value.reviewedAt),
  };
}

function normalizeMistake(value, quiz) {
  if (!value || !quiz.some((question) => question.id === value.questionId))
    return null;
  const raw = value.snapshot;
  if (
    !raw ||
    !Array.isArray(raw.options) ||
    raw.options.length !== 4 ||
    raw.options.some((option) => typeof option !== "string") ||
    !studyChoice(raw.answer, raw.options)
  )
    return null;
  const snapshot = {
    question: studyText(raw.question, 3000),
    options: raw.options.map((option) => option.slice(0, 3000)),
    answer: raw.answer,
    explanation: studyText(raw.explanation, 6000),
  };
  if (
    !snapshot.question ||
    !studyChoice(value.lastWrongAnswer, snapshot.options) ||
    value.lastWrongAnswer === snapshot.answer
  )
    return null;
  const fingerprint = questionFingerprint(snapshot);
  const correction = studyText(value.correction, 12000);
  const history = (Array.isArray(value.history) ? value.history : [])
    .filter((item) => item && studyChoice(item.answer, snapshot.options))
    .slice(-30)
    .map((item) => ({
      at: studyTime(item.at),
      answer: item.answer,
      correct: item.answer === snapshot.answer,
      via: item.via === "review" ? "review" : "quiz",
    }));
  return {
    id: value.questionId + "-" + fingerprint,
    questionId: value.questionId,
    fingerprint,
    snapshot,
    lastWrongAnswer: value.lastWrongAnswer,
    wrongCount: Math.max(
      1,
      studyCount(value.wrongCount),
      history.filter((item) => !item.correct).length,
    ),
    firstWrongAt: studyTime(value.firstWrongAt),
    lastWrongAt: studyTime(value.lastWrongAt),
    updatedAt: studyTime(value.updatedAt),
    correction,
    status:
      value.status === "corrected" &&
      correction.trim() &&
      history.at(-1)?.correct
        ? "corrected"
        : "open",
    dueAt: value.dueAt === null ? null : studyTime(value.dueAt, null),
    reviewCount: studyCount(value.reviewCount),
    reviewChoice: studyChoice(value.reviewChoice, snapshot.options)
      ? value.reviewChoice
      : null,
    history,
  };
}

export function normalizeStudyState(value, lesson, submitted) {
  if (value.studyVersion !== undefined && value.studyVersion !== 1)
    throw new Error("学习笔记版本不受支持，请保留原备份。");
  const result = emptyStudyState();
  for (const [key, limit] of [
    ["notebook", studyLimits.notes],
    ["mistakes", studyLimits.mistakes],
  ]) {
    if (
      value[key] !== undefined &&
      (!Array.isArray(value[key]) || value[key].length > limit)
    ) {
      throw new Error("笔记或错题条目格式不正确，原记录不会被自动覆盖。");
    }
  }
  const noteIds = new Set();
  for (const raw of value.notebook || []) {
    const note = normalizeStudyNote(raw, lesson);
    if (!note) throw new Error("存在无法识别的笔记或来源，请保留原备份。");
    if (noteIds.has(note.id)) throw new Error("备份包含重复笔记编号。");
    noteIds.add(note.id);
    result.notebook.push(note);
  }
  const mistakeIds = new Set();
  for (const raw of value.mistakes || []) {
    const mistake = normalizeMistake(raw, lesson.quiz);
    if (!mistake) throw new Error("错题题面或选项无效，请保留原备份。");
    if (mistakeIds.has(mistake.id)) throw new Error("备份包含重复错题编号。");
    mistakeIds.add(mistake.id);
    result.mistakes.push(mistake);
  }
  for (const item of lesson.experiments) {
    const run =
      value.runs && Object.hasOwn(value.runs, item.id)
        ? value.runs[item.id]
        : null;
    if (!run || !["passed", "error", "timeout", "stopped"].includes(run.status))
      continue;
    result.runs[item.id] = {
      code: studyText(run.code, 20000),
      output: studyText(run.output, 8000),
      status: run.status,
      at: studyTime(run.at),
    };
  }
  if (
    value.lastQuizSubmission &&
    typeof value.lastQuizSubmission === "object"
  ) {
    const answers = {};
    for (const question of lesson.quiz) {
      const choice = value.lastQuizSubmission.answers?.[question.id];
      if (studyChoice(choice, question.options)) answers[question.id] = choice;
    }
    const fingerprints = {};
    for (const id of Object.keys(answers)) {
      const fingerprint = value.lastQuizSubmission.fingerprints?.[id];
      if (
        typeof fingerprint === "string" &&
        /^[a-f0-9]{1,8}$/.test(fingerprint)
      )
        fingerprints[id] = fingerprint;
    }
    result.lastQuizSubmission = {
      answers,
      fingerprints,
      at: studyTime(value.lastQuizSubmission.at),
    };
  }
  // 旧版只有最近一次提交。仅据这一次有效提交恢复错题，时间保持“未记录”。
  if (value.studyVersion === undefined && submitted) {
    const migrated = { ...result, answers: value.answers, submitted: false };
    recordQuizSubmission(migrated, lesson.quiz, 0);
    result.mistakes = migrated.mistakes;
    result.lastQuizSubmission = migrated.lastQuizSubmission;
  }
  return result;
}

export function createNotebookNote(
  id,
  source,
  title,
  body = "",
  context = "",
  weak = false,
  now = Date.now(),
) {
  return {
    id,
    source,
    title: title.slice(0, 160),
    body: body.slice(0, studyLimits.body),
    context: context.slice(0, studyLimits.context),
    tags: [],
    status: weak ? "weak" : "note",
    createdAt: now,
    updatedAt: now,
    dueAt: weak ? now : null,
    reviewedAt: 0,
    reviewCount: 0,
  };
}

export function reviewNotebookNote(note, understood, now = Date.now()) {
  note.status = understood ? "reviewed" : "weak";
  note.reviewCount += 1;
  note.reviewedAt = now;
  note.updatedAt = now;
  note.dueAt = now + (understood ? 3 : 1) * 86400000;
}

function appendMistakeAttempt(mistake, answer, via, now) {
  const correct = answer === mistake.snapshot.answer;
  mistake.history.push({ at: now, answer, correct, via });
  mistake.history = mistake.history.slice(-30);
  if (!correct) {
    mistake.wrongCount += 1;
    mistake.lastWrongAt = now;
    mistake.lastWrongAnswer = answer;
  }
  mistake.status = correct && mistake.correction.trim() ? "corrected" : "open";
  mistake.updatedAt = now;
  mistake.dueAt = now
    ? now + (mistake.status === "corrected" ? 3 : 1) * 86400000
    : 0;
  return correct;
}

export function recordQuizSubmission(state, quiz, now = Date.now()) {
  const required = quiz.filter((question) => question.level !== "advanced");
  if (
    !required.every((question) =>
      studyChoice(state.answers?.[question.id], question.options),
    )
  ) {
    throw new Error("入门题尚未作答完整，不能记录一次自测。");
  }
  const answers = {},
    fingerprints = {};
  for (const question of quiz) {
    if (studyChoice(state.answers?.[question.id], question.options)) {
      answers[question.id] = state.answers[question.id];
      fingerprints[question.id] = questionFingerprint(question);
    }
  }
  const previous = state.lastQuizSubmission?.answers;
  const duplicate =
    previous &&
    Object.keys(previous).length === Object.keys(answers).length &&
    Object.entries(answers).every(
      ([id, choice]) =>
        previous[id] === choice &&
        state.lastQuizSubmission.fingerprints?.[id] === fingerprints[id],
    );
  if (duplicate) {
    state.submitted = true;
    return false;
  }
  const newMistakes = quiz.filter(
    (question) =>
      Object.hasOwn(answers, question.id) &&
      answers[question.id] !== question.answer &&
      !state.mistakes.some(
        (item) => item.id === question.id + "-" + questionFingerprint(question),
      ),
  );
  if (state.mistakes.length + newMistakes.length > studyLimits.mistakes)
    throw new Error("本课错题条目已满，请先导出备份。");
  state.submitted = true;
  for (const question of quiz) {
    if (!Object.hasOwn(answers, question.id)) continue;
    const id = question.id + "-" + questionFingerprint(question);
    let mistake = state.mistakes.find((item) => item.id === id);
    if (!mistake && answers[question.id] !== question.answer) {
      mistake = {
        id,
        questionId: question.id,
        fingerprint: questionFingerprint(question),
        snapshot: {
          question: question.question,
          options: [...question.options],
          answer: question.answer,
          explanation: question.explanation,
        },
        wrongCount: 0,
        firstWrongAt: now,
        lastWrongAt: now,
        lastWrongAnswer: answers[question.id],
        status: "open",
        correction: "",
        updatedAt: now,
        dueAt: now,
        reviewCount: 0,
        reviewChoice: null,
        history: [],
      };
      state.mistakes.push(mistake);
    }
    if (mistake)
      appendMistakeAttempt(mistake, answers[question.id], "quiz", now);
  }
  state.lastQuizSubmission = { answers, fingerprints, at: now };
  return true;
}

export function recordMistakeReview(mistake, answer, now = Date.now()) {
  if (!studyChoice(answer, mistake.snapshot.options))
    throw new Error("先选择复习答案。");
  const last = mistake.history.at(-1);
  const nextStatus =
    answer === mistake.snapshot.answer && mistake.correction.trim()
      ? "corrected"
      : "open";
  if (
    last?.via === "review" &&
    last.answer === answer &&
    now - last.at < 1000 &&
    mistake.status === nextStatus
  )
    return last.correct;
  mistake.reviewCount += 1;
  return appendMistakeAttempt(mistake, answer, "review", now);
}

export function experimentStudyContext(state, item) {
  const lines = [
    "实验：" + item.title,
    "运行前预测：",
    state.predictions[item.id] || "（未填写）",
    "",
    "观察与证据边界：",
    state.observations[item.id] || "（未填写）",
  ];
  const run = state.runs?.[item.id];
  if (run) {
    lines.push(
      "",
      "最近一次运行状态：" + run.status,
      "该次执行的代码：",
      run.code,
      "",
      "该次输出（最多保存8000字符）：",
      run.output,
    );
    if ((state.codes[item.id] ?? item.code) !== run.code)
      lines.push("", "之后又修改了代码；当前草稿尚不能由上述输出证明。");
  } else lines.push("", "旧版未保存运行输出；这里不补造输出或执行时间。");
  const context = lines.join("\n");
  if (context.length <= studyLimits.context) return context;
  return (
    context.slice(0, studyLimits.context - 32) +
    "\n（快照较长，后续内容已截断；完整代码请另存。）"
  );
}

export function collectStudyRecords(book, catalog) {
  const records = [];
  for (const lesson of catalog) {
    const state = book.lessons[lesson.id];
    if (!state) continue;
    const add = (record) =>
      records.push({
        ...record,
        lessonId: lesson.id,
        stage: lesson.stage,
        lessonTitle: lesson.title,
      });
    for (const note of state.notebook || [])
      add({
        kind: "notes",
        id: note.id,
        value: note,
        title: note.title || "未命名笔记",
        body: note.body,
        tags: note.tags,
        source: note.source,
        status: note.status,
        dueAt: note.dueAt,
        updatedAt: note.updatedAt,
      });
    for (const mistake of state.mistakes || [])
      add({
        kind: "mistakes",
        id: mistake.id,
        value: mistake,
        title: mistake.snapshot.question,
        body: mistake.correction,
        tags: [],
        source: {
          type: "quiz",
          id: mistake.questionId,
          label: "公开自测 · " + mistake.questionId,
        },
        status: mistake.status,
        dueAt: mistake.dueAt,
        updatedAt: mistake.updatedAt,
      });
    if (state.personalNotes?.trim())
      add({
        kind: "raw",
        id: "raw-personal",
        title: "本课原有个人笔记",
        body: state.personalNotes,
        context: "",
        tags: [],
        status: "note",
        dueAt: null,
        updatedAt: 0,
        source: { type: "lesson", id: "", label: "复习速记中的我的笔记" },
      });
    for (const item of lesson.experiments) {
      if (
        !state.observations[item.id]?.trim() &&
        !state.predictions[item.id]?.trim() &&
        !state.runs?.[item.id]
      )
        continue;
      add({
        kind: "raw",
        id: "raw-" + item.id,
        title: item.title,
        body:
          state.observations[item.id] ||
          state.predictions[item.id] ||
          "已有运行快照，可以补充自己的观察。",
        context: experimentStudyContext(state, item),
        tags: [],
        status: "note",
        dueAt: null,
        updatedAt: state.runs?.[item.id]?.at || 0,
        source: { type: "experiment", id: item.id, label: item.title },
      });
    }
  }
  return records.sort((left, right) => right.updatedAt - left.updatedAt);
}

export function filterStudyRecords(records, filters, now = Date.now()) {
  const query = (filters.query || "").trim().toLowerCase();
  return records.filter(
    (record) =>
      (!filters.kind ||
        filters.kind === "all" ||
        record.kind === filters.kind) &&
      (!filters.stage || record.stage === filters.stage) &&
      (!filters.lessonId || record.lessonId === filters.lessonId) &&
      (!filters.source || record.source.type === filters.source) &&
      (!filters.status ||
        filters.status === "all" ||
        (filters.status === "weak"
          ? ["weak", "open"].includes(record.status)
          : filters.status === "reviewed"
            ? ["reviewed", "corrected"].includes(record.status)
            : filters.status === "due" &&
              record.dueAt !== null &&
              record.dueAt <= now)) &&
      (!query ||
        [
          record.title,
          record.body,
          record.lessonTitle,
          record.lessonId,
          record.source.label,
          ...record.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)),
  );
}

function studyFence(text) {
  const runs = String(text).match(/~{3,}/g) || [];
  const fence = "~".repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
  return fence + "text\n" + text + "\n" + fence;
}
function studyInline(text) {
  return String(text)
    .replace(/[\r\n]+/g, " ")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/[\\`*_{}\[\]()#+!|]/g, "\\$&");
}
export function exportStudyMarkdown(records, title = "学习笔记本") {
  const lines = [
    "# " + studyInline(title),
    "",
    "个人本机学习记录，不是教师评阅或正式掌握证明。",
    "",
    "导出条目：" + records.length,
    "",
  ];
  for (const record of records) {
    lines.push(
      "## " + record.lessonId + " · " + studyInline(record.title),
      "",
      "阶段：" + record.stage + "；课程：" + record.lessonTitle,
      "来源：" +
        sourceLabels[record.source.type] +
        " / " +
        studyInline(record.source.label),
      "状态：" +
        {
          note: "普通笔记",
          weak: "薄弱点",
          reviewed: "已回顾",
          open: "待订正",
          corrected: "已订正",
        }[record.status],
      "回顾日期：" +
        (record.dueAt === null
          ? "未安排"
          : record.dueAt === 0
            ? "待回顾（旧版未记录日期）"
            : new Date(record.dueAt).toLocaleDateString("zh-CN")),
      "",
    );
    if (record.tags.length)
      lines.push("标签：" + record.tags.map(studyInline).join("、"), "");
    if (record.kind === "mistakes") {
      const item = record.value;
      lines.push(
        ...item.snapshot.options.map(
          (option, index) =>
            String.fromCharCode(65 + index) + ". " + studyInline(option),
        ),
        "",
        "最近错选：" + String.fromCharCode(65 + item.lastWrongAnswer),
        "参考选择：" + String.fromCharCode(65 + item.snapshot.answer),
        "累计错选：" + item.wrongCount + "；复习提交：" + item.reviewCount,
        "",
        "题目解析：",
        studyFence(item.snapshot.explanation),
        "",
        "我的订正：",
        studyFence(item.correction || "（未填写）"),
        "",
        "作答历史（最多保留最近30次）：",
        ...item.history.map(
          (attempt) =>
            "- " +
            (attempt.at
              ? new Date(attempt.at).toLocaleString("zh-CN")
              : "旧版未记录时间") +
            " · " +
            (attempt.via === "review" ? "错题复习" : "课堂自测") +
            " · " +
            String.fromCharCode(65 + attempt.answer) +
            " · " +
            (attempt.correct ? "选对" : "错选"),
        ),
        "",
      );
    } else {
      lines.push("我的记录：", studyFence(record.body || "（未填写）"), "");
      const context =
        record.kind === "notes" ? record.value.context : record.context;
      if (context) lines.push("保存时的关联快照：", studyFence(context), "");
    }
  }
  return lines.join("\n");
}
