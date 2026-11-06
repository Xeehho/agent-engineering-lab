import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../course/curriculum.mjs";
import {
  emptyState,
  emptyBook,
  normalizeBook,
  summarizeProgress,
  exportAnswers,
} from "../classroom/core.mjs";
import {
  createNotebookNote,
  reviewNotebookNote,
  recordQuizSubmission,
  recordMistakeReview,
  collectStudyRecords,
  filterStudyRecords,
  exportStudyMarkdown,
  questionFingerprint,
  experimentStudyContext,
  studyLimits,
} from "../classroom/study.mjs";

const first = lessons[0];
const next = lessons.find((lesson) => lesson.stage !== first.stage);
const clock = Date.UTC(2026, 10, 6, 12);
const day = 86400000;
const coreQuiz = first.quiz.filter((question) => question.level !== "advanced");
const wrong = (question) => (question.answer + 1) % question.options.length;
const source = {
  type: "experiment",
  id: first.experiments[0].id,
  label: first.experiments[0].title,
};
function answeredState() {
  const state = emptyState(first.id);
  state.answers = Object.fromEntries(
    coreQuiz.map((question) => [question.id, question.answer]),
  );
  return state;
}
function pack(state, lesson = first) {
  return {
    ...emptyBook(lessons),
    currentLesson: lesson.id,
    lessons: { [lesson.id]: state },
  };
}
function roundtrip(state) {
  return normalizeBook(JSON.parse(JSON.stringify(pack(state))), lessons)
    .lessons[first.id];
}

test("old v1 and v2 migrate without changing drafts, observations, codes or private notes", () => {
  const legacy = answeredState();
  for (const key of [
    "studyVersion",
    "notebook",
    "mistakes",
    "runs",
    "lastQuizSubmission",
  ])
    delete legacy[key];
  legacy.personalNotes = "自己的薄弱点\n保留原文";
  legacy.observations[source.id] = "JSON.parse(42) 的观察";
  legacy.predictions[source.id] = "预测：可能报错";
  legacy.codes[source.id] = "console.log(42)";
  legacy.drafts[first.checkpoints[0].id] = "原有答案";
  legacy.answers[coreQuiz[0].id] = wrong(coreQuiz[0]);
  legacy.submitted = true;
  for (const backup of [legacy, { ...pack(legacy), schemaVersion: 2 }]) {
    const restored = normalizeBook(backup, lessons);
    assert.equal(restored.schemaVersion, 3);
    const state = restored.lessons[first.id];
    for (const key of [
      "personalNotes",
      "observations",
      "predictions",
      "codes",
      "drafts",
      "answers",
    ])
      assert.deepEqual(state[key], legacy[key]);
    assert.equal(state.mistakes.length, 1);
    assert.equal(state.mistakes[0].firstWrongAt, 0);
    assert.equal(state.mistakes[0].dueAt, 0);
    assert.deepEqual(state.runs, {});
    const records = collectStudyRecords(restored, lessons);
    assert.equal(records.filter((record) => record.kind === "raw").length, 2);
    assert.match(exportStudyMarkdown(records), /旧版未记录时间/);
    assert.doesNotMatch(exportStudyMarkdown(records), /1970/);
  }
  legacy.submitted = false;
  assert.equal(
    normalizeBook(legacy, lessons).lessons[first.id].mistakes.length,
    0,
  );
});

test("only a complete submitted attempt records mistakes; changing a choice alone does not", () => {
  const state = emptyState(first.id);
  state.answers[coreQuiz[0].id] = wrong(coreQuiz[0]);
  assert.throws(() => recordQuizSubmission(state, first.quiz, clock), /完整/);
  assert.equal(state.submitted, false);
  assert.equal(state.mistakes.length, 0);
  state.answers[coreQuiz[1].id] = coreQuiz[1].answer;
  assert.equal(recordQuizSubmission(state, first.quiz, clock), true);
  assert.equal(state.mistakes.length, 1);
  const item = state.mistakes[0];
  assert.equal(item.wrongCount, 1);
  assert.equal(recordQuizSubmission(state, first.quiz, clock + 5000), false);
  assert.equal(item.wrongCount, 1);
  state.answers[coreQuiz[0].id] = coreQuiz[0].answer;
  state.submitted = false;
  assert.equal(item.wrongCount, 1);
  assert.equal(item.history.length, 1);
  recordQuizSubmission(state, first.quiz, clock + 10000);
  assert.equal(item.history.length, 2);
  assert.equal(item.status, "open");
  assert.equal(item.dueAt, clock + 10000 + day);
});

test("answered optional questions join wrong book without requiring unanswered optional items", () => {
  const state = answeredState();
  const optional = first.quiz.find((question) => question.level === "advanced");
  state.answers[optional.id] = wrong(optional);
  recordQuizSubmission(state, first.quiz, clock);
  assert.deepEqual(
    state.mistakes.map((item) => item.questionId),
    [optional.id],
  );
  assert.equal(state.mistakes[0].snapshot.question, optional.question);
});

test("correction requires a correct review; history and prior wrong answer survive later success", () => {
  const state = answeredState();
  const question = coreQuiz[0];
  state.answers[question.id] = wrong(question);
  recordQuizSubmission(state, first.quiz, clock);
  const item = state.mistakes[0];
  recordMistakeReview(item, question.answer, clock + 1000);
  assert.equal(item.status, "open");
  item.correction = "我把可解析误当成业务正确，必须再检查结构和字段。";
  // 即使紧接上一次选对后补订正，也必须真正转为已订正。
  recordMistakeReview(item, question.answer, clock + 1100);
  assert.equal(item.status, "corrected");
  assert.equal(item.dueAt, clock + 1100 + 3 * day);
  assert.equal(item.lastWrongAnswer, wrong(question));
  const count = item.history.length;
  recordMistakeReview(item, question.answer, clock + 1150);
  assert.equal(item.history.length, count);
  recordMistakeReview(item, wrong(question), clock + 3000);
  assert.equal(item.status, "open");
  assert.equal(item.wrongCount, 2);
  assert.equal(item.dueAt, clock + 3000 + day);
  assert.throws(() => recordMistakeReview(item, 99), /先选择/);
  assert.deepEqual(roundtrip(state), state);
});

test("same answer indices against a changed question create a separate immutable snapshot", () => {
  const state = answeredState();
  state.answers[coreQuiz[0].id] = wrong(coreQuiz[0]);
  recordQuizSubmission(state, first.quiz, clock);
  const changed = first.quiz.map((question) =>
    question.id === coreQuiz[0].id
      ? { ...question, question: question.question + "（新版反例）" }
      : question,
  );
  recordQuizSubmission(state, changed, clock + 1000);
  assert.equal(state.mistakes.length, 2);
  assert.notEqual(state.mistakes[0].fingerprint, state.mistakes[1].fingerprint);
  assert.equal(state.mistakes[0].snapshot.question, coreQuiz[0].question);
  assert.equal(questionFingerprint(changed[0]), state.mistakes[1].fingerprint);
  assert.deepEqual(roundtrip(state).mistakes, state.mistakes);
});

test("v3 roundtrip includes notebook, code/output snapshots, due dates, tags and all wrong history", () => {
  const state = answeredState();
  state.notebook.push(
    createNotebookNote(
      "n-1",
      source,
      "typeof 的边界",
      "null 需要单独排除。",
      "当时的实验",
      true,
      clock,
    ),
  );
  state.notebook[0].tags = ["JS", "校验"];
  state.notebook.push(
    createNotebookNote(
      "n-architecture",
      { type: "architecture", id: "knowledge:retrieval", label: "检索职责" },
      "检索与证据",
      "相似不等于支持",
      "",
      false,
      clock,
    ),
  );
  state.runs[source.id] = {
    code: "console.log(42)",
    output: "42\n",
    status: "passed",
    at: clock,
  };
  state.answers[coreQuiz[0].id] = wrong(coreQuiz[0]);
  recordQuizSubmission(state, first.quiz, clock);
  assert.deepEqual(roundtrip(state), state);
  const text = exportAnswers(
    state,
    first.experiments,
    first.checkpoints,
    first.quiz,
  );
  for (const expected of [
    "typeof 的边界",
    "当时的实验",
    "累计错选：1",
    "console.log(42)",
  ])
    assert.ok(text.includes(expected), expected);
  const other = emptyState(next.id);
  other.notebook.push(
    createNotebookNote(
      "n-1",
      { type: "lesson", id: "", label: "另一课" },
      "工具的误解",
      "另一课正文",
      "",
      false,
      clock,
    ),
  );
  const book = pack(state);
  book.lessons[next.id] = other;
  const restored = normalizeBook(book, lessons);
  assert.equal(
    restored.lessons[first.id].notebook[0].body,
    "null 需要单独排除。",
  );
  assert.equal(restored.lessons[next.id].notebook[0].body, "另一课正文");
});

test("raw record collection is nondestructive, snapshots record executed code rather than later draft", () => {
  const state = emptyState(first.id);
  state.observations[source.id] = "实际是42";
  state.predictions[source.id] = "可能得到对象";
  state.runs[source.id] = {
    code: "console.log(42)",
    output: "42",
    status: "passed",
    at: clock,
  };
  state.codes[source.id] = "console.log(null)";
  const original = JSON.stringify(state);
  const context = experimentStudyContext(state, first.experiments[0]);
  const raw = collectStudyRecords(pack(state), lessons)[0];
  assert.equal(JSON.stringify(state), original);
  assert.match(context, /console.log\(42\)/);
  assert.match(context, /当前草稿尚不能由上述输出证明/);
  const note = createNotebookNote(
    "n-1",
    source,
    "记录",
    raw.body,
    raw.context,
    true,
    clock,
  );
  state.observations[source.id] = "后来改写原观察";
  assert.equal(note.body, "实际是42");
  assert.match(note.context, /实际是42/);
});

test("stage, lesson, module, tag and due filters compose; reviewed notes remain available", () => {
  const state = emptyState(first.id);
  const note = createNotebookNote(
    "n-1",
    source,
    "运行时校验",
    "JSON 语法与对象",
    "",
    true,
    clock,
  );
  note.tags = ["typeof"];
  state.notebook.push(note);
  const book = pack(state);
  book.lessons[next.id] = emptyState(next.id);
  book.lessons[next.id].notebook.push(
    createNotebookNote(
      "n-1",
      { type: "lesson", id: "", label: "工具" },
      "工具边界",
      "另一课",
      "",
      false,
      clock,
    ),
  );
  let records = collectStudyRecords(book, lessons);
  const filters = {
    kind: "notes",
    stage: first.stage,
    lessonId: first.id,
    source: "experiment",
    query: "TYPEOF",
    status: "due",
  };
  assert.equal(filterStudyRecords(records, filters, clock).length, 1);
  assert.equal(
    filterStudyRecords(records, { ...filters, stage: next.stage }, clock)
      .length,
    0,
  );
  reviewNotebookNote(note, true, clock);
  records = collectStudyRecords(book, lessons);
  assert.equal(filterStudyRecords(records, { status: "due" }, clock).length, 0);
  assert.equal(
    filterStudyRecords(records, { status: "reviewed" }, clock).length,
    1,
  );
  assert.equal(
    filterStudyRecords(records, { status: "due" }, clock + 3 * day).length,
    1,
  );
  assert.equal(note.reviewCount, 1);
  assert.equal(
    summarizeProgress(state, first.experiments, first.checkpoints, first.quiz)
      .completed,
    0,
  );
});

test("Markdown export preserves full records and fences personal HTML, backticks and tildes", () => {
  const state = emptyState(first.id);
  const body =
    "正文\n<script>alert(1)</script>\n~~~\n````\n" + "完整内容".repeat(300);
  state.notebook.push(
    createNotebookNote(
      "n-1",
      source,
      "<img src=x>\n标题",
      body,
      "保存快照",
      false,
      clock,
    ),
  );
  const markdown = exportStudyMarkdown(
    collectStudyRecords(pack(state), lessons),
  );
  assert.ok(markdown.includes(body));
  assert.ok(markdown.includes("~~~~text\n"));
  assert.match(markdown, /## S1-L01 · &lt;img src=x&gt; 标题/);
  assert.match(markdown, /保存快照/);
});

test("invalid notebook imports fail as a whole so callers can retain the original storage", () => {
  const state = emptyState(first.id);
  state.notebook.push(
    createNotebookNote("n-1", source, "原记录", "不能丢", "", false, clock),
  );
  const badCases = [
    (value) => {
      value.studyVersion = 2;
    },
    (value) => {
      value.notebook.push(value.notebook[0]);
    },
    (value) => {
      value.notebook[0].source.id = "unknown-experiment";
    },
    (value) => {
      value.notebook = Array(studyLimits.notes + 1).fill(value.notebook[0]);
    },
    (value) => {
      value.mistakes = [
        { questionId: coreQuiz[0].id, snapshot: { options: ["x"], answer: 0 } },
      ];
    },
  ];
  for (const corrupt of badCases) {
    const copy = structuredClone(state);
    corrupt(copy);
    const raw = JSON.stringify(pack(copy));
    assert.throws(() => normalizeBook(JSON.parse(raw), lessons));
    assert.equal(JSON.stringify(pack(copy)), raw);
  }
  assert.throws(
    () =>
      normalizeBook(
        { ...pack(state), lessons: { removedCourse: state } },
        lessons,
      ),
    /无法识别/,
  );
  assert.equal(state.notebook[0].body, "不能丢");
});

test("capacity failure does not partially submit a quiz or discard existing wrong history", () => {
  const state = answeredState();
  state.answers[coreQuiz[0].id] = wrong(coreQuiz[0]);
  state.mistakes = Array.from({ length: studyLimits.mistakes }, (_, index) => ({
    id: "old-version-" + index,
  }));
  assert.throws(() => recordQuizSubmission(state, first.quiz, clock), /已满/);
  assert.equal(state.submitted, false);
  assert.equal(state.lastQuizSubmission, null);
  assert.equal(state.mistakes.length, studyLimits.mistakes);
});
