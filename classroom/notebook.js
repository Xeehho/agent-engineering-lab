// 注入课堂IIFE，共用本机课程记录。个人内容始终使用textContent/value。
const notebookFilters = {
  kind: "notes",
  stage: "",
  lessonId: "",
  source: "",
  status: "all",
  query: "",
};
const expandedMistakes = new Set();
const mistakeFeedback = new Map();
let editingNote = null;

function studyOwner(lessonId) {
  if (!book.lessons[lessonId]) book.lessons[lessonId] = emptyState(lessonId);
  return book.lessons[lessonId];
}
function studyDate(value, includeTime = false) {
  if (!value) return "时间未记录";
  return includeTime
    ? new Date(value).toLocaleString("zh-CN")
    : new Date(value).toLocaleDateString("zh-CN");
}
function studyDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}
function studyDueLabel(value) {
  if (value === null) return "未安排回顾";
  if (value <= Date.now()) return "已到回顾日期";
  return studyDate(value) + " 回顾";
}
function studyButton(label, action, className = "button") {
  const button = textElement("button", label, className);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}
function updateNotebookBadge() {
  let due = 0;
  for (const saved of Object.values(book.lessons)) {
    for (const record of [
      ...(saved.notebook || []),
      ...(saved.mistakes || []),
    ]) {
      if (record.dueAt !== null && record.dueAt <= Date.now()) due++;
    }
  }
  byId("notebook-due-badge").hidden = due === 0;
  byId("notebook-due-badge").textContent = String(due);
}

function addStudySourceActions(container, source) {
  const row = textElement("div", undefined, "source-study-actions");
  row.append(
    studyButton(
      source.type === "experiment" ? "整理实验为笔记" : "记一条知识点笔记",
      () => createSourceNote(current.id, source),
    ),
    studyButton("标为薄弱点", () => createSourceNote(current.id, source, true)),
  );
  container.append(row);
}
function decorateStudyHeadings() {
  for (const container of [
    byId("lecture-content"),
    byId("advanced-lecture-content"),
  ]) {
    for (const heading of container.querySelectorAll("h2[id],h3[id]")) {
      const label = heading.textContent;
      const source = { type: "lecture", id: heading.id, label };
      const button = studyButton(
        "记笔记",
        () => createSourceNote(current.id, source),
        "section-note-action",
      );
      button.setAttribute("aria-label", "记录笔记：" + label);
      heading.append(button);
    }
  }
}

function createSourceNote(lessonId, source, weak = false, rawRecord = null) {
  const lesson = catalog.find((item) => item.id === lessonId);
  const owner = studyOwner(lessonId);
  if (owner.notebook.length >= studyLimits.notes) {
    toast("本课笔记达到150条，请先导出并整理自己的条目。");
    return;
  }
  let body = rawRecord?.body || "";
  let context = rawRecord?.context || "";
  if (source.type === "experiment" && !rawRecord) {
    const experiment = lesson.experiments.find((item) => item.id === source.id);
    body = owner.observations[source.id] || "";
    context = experimentStudyContext(owner, experiment);
  }
  if (source.type === "checkpoint") {
    const question = lesson.checkpoints.find((item) => item.id === source.id);
    body = owner.drafts[source.id] || "";
    context =
      "题目：" +
      (question.text || question.question) +
      (question.code ? "\n\n题目代码：\n" + question.code : "");
  }
  if (source.type === "quiz") {
    const question = lesson.quiz.find((item) => item.id === source.id);
    context =
      "题目：" +
      question.question +
      "\n\n" +
      question.options
        .map((option, index) => String.fromCharCode(65 + index) + ". " + option)
        .join("\n");
    const choice = owner.answers[source.id];
    context +=
      "\n\n创建时的选择：" +
      (Number.isInteger(choice) ? String.fromCharCode(65 + choice) : "未选择");
    context += owner.submitted
      ? "（已提交自测）"
      : "（尚未提交，不据此记错题）";
  }
  if (source.type === "lecture") {
    const heading = lessonId === current.id ? byId(source.id) : null;
    if (heading) {
      const parts = [source.label];
      let sibling = heading.nextElementSibling;
      while (sibling && !/^H[23]$/.test(sibling.tagName)) {
        parts.push(sibling.textContent);
        sibling = sibling.nextElementSibling;
      }
      context = parts.join("\n\n").slice(0, studyLimits.context);
    }
  }
  if (source.type === "mindmap") context = lesson.mindmap.markdown;
  if (source.type === "architecture") {
    context =
      source.label +
      "\n\n" +
      byId("architecture-detail").textContent +
      "\n\n当前数据流步骤：" +
      byId("scenario-step").textContent;
  }
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "note-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  const note = createNotebookNote(
    id,
    source,
    rawRecord?.title || source.label || lesson.title,
    body,
    context,
    weak,
  );
  owner.notebook.push(note);
  persist();
  if (state.tab === "notebook") {
    notebookFilters.query = "";
    byId("notebook-query").value = "";
    chooseNotebookKind("notes");
  }
  openNoteEditor(lessonId, note.id);
}

function openNoteEditor(lessonId, noteId) {
  const note = studyOwner(lessonId).notebook.find((item) => item.id === noteId);
  if (!note) return;
  editingNote = { lessonId, noteId };
  byId("note-editor-source").textContent =
    lessonId +
    " · " +
    sourceLabels[note.source.type] +
    " · " +
    note.source.label;
  byId("note-title").value = note.title;
  byId("note-body").value = note.body;
  byId("note-tags").value = note.tags.join(", ");
  byId("note-status").value = note.status;
  byId("note-due").value = studyDateInput(note.dueAt);
  byId("note-context").hidden = !note.context;
  byId("note-context").open = false;
  byId("note-context-content").textContent = note.context;
  byId("note-editor-save").textContent = storageAvailable
    ? "输入会自动保存到本机；完成后可在笔记本集中回顾。"
    : "当前暂存在本页，请使用下方按钮导出完整备份。";
  byId("note-editor").showModal();
  byId(note.body ? "note-title" : "note-body").focus();
}
function currentEditingNote() {
  if (!editingNote) return null;
  return (
    book.lessons[editingNote.lessonId]?.notebook.find(
      (item) => item.id === editingNote.noteId,
    ) || null
  );
}
function saveNoteEditor(event) {
  const note = currentEditingNote();
  if (!note) return;
  note.title = byId("note-title").value.slice(0, 160);
  note.body = byId("note-body").value.slice(0, studyLimits.body);
  note.tags = [
    ...new Set(
      byId("note-tags")
        .value.split(/[,，、]/)
        .map((tag) => tag.trim().slice(0, 32))
        .filter(Boolean),
    ),
  ].slice(0, 6);
  note.status = byId("note-status").value;
  if (
    event.target.id === "note-status" &&
    note.status !== "note" &&
    !byId("note-due").value
  ) {
    byId("note-due").value = studyDateInput(
      Date.now() + (note.status === "reviewed" ? 3 : 0) * 86400000,
    );
  }
  const due = byId("note-due").value;
  const parsed = due ? new Date(due + "T00:00:00").getTime() : null;
  note.dueAt = Number.isFinite(parsed) ? parsed : null;
  note.updatedAt = Date.now();
  const saved = persist();
  byId("note-editor-save").textContent = saved
    ? "已保存到本机 · " + new Date().toLocaleTimeString("zh-CN")
    : "暂存在本页，未写入浏览器；请先导出完整备份。";
}
for (const id of [
  "note-title",
  "note-body",
  "note-tags",
  "note-status",
  "note-due",
]) {
  byId(id).addEventListener(
    id === "note-status" || id === "note-due" ? "change" : "input",
    saveNoteEditor,
  );
}
byId("close-note-editor").addEventListener("click", () =>
  byId("note-editor").close(),
);
byId("note-editor").addEventListener("close", () => {
  editingNote = null;
  renderNotebook();
});
byId("note-open-source").addEventListener("click", () => {
  const note = currentEditingNote();
  if (!note) return;
  const lessonId = editingNote.lessonId;
  const source = note.source;
  byId("note-editor").close();
  navigateStudySource(lessonId, source);
});
byId("export-single-note").addEventListener("click", () => {
  const record = collectStudyRecords(book, catalog).find(
    (item) =>
      item.kind === "notes" &&
      item.lessonId === editingNote?.lessonId &&
      item.id === editingNote.noteId,
  );
  if (record) exportStudyRecords([record], record.lessonId + "-知识点笔记");
});
byId("delete-note").addEventListener("click", async () => {
  if (!editingNote) return;
  const target = { ...editingNote };
  if (
    !(await askConfirmation(
      "删除这条笔记？",
      "只删除这条知识点笔记；原实验记录、随堂作答和其他笔记保留。建议先导出。",
    ))
  )
    return;
  const owner = studyOwner(target.lessonId);
  owner.notebook = owner.notebook.filter((note) => note.id !== target.noteId);
  persist();
  byId("note-editor").close();
  toast("这条笔记已删除。");
});

function navigateStudySource(lessonId, source) {
  const tab = {
    lesson: "notes",
    lecture: "lecture",
    experiment: "lab",
    checkpoint: "practice",
    quiz: "quiz",
    mindmap: "mindmap",
    architecture: "architecture",
  }[source.type];
  selectLesson(lessonId, tab);
  selectTab(tab, true);
  if (source.type === "architecture" && source.id) {
    const [viewId, componentId] = source.id.split(":");
    const view = material.architecture.find((item) => item.id === viewId);
    if (view?.nodes.some((node) => node.id === componentId)) {
      architecture = view;
      scenarioIndex = 0;
      renderArchitecture();
      selectComponent(componentId);
    }
  }
  const target =
    source.type === "lecture"
      ? byId(source.id)
      : source.type === "experiment"
        ? byId("experiment-card-" + source.id)
        : source.type === "checkpoint"
          ? byId("checkpoint-card-" + source.id)
          : source.type === "quiz"
            ? byId("quiz-question-" + source.id)
            : source.type === "lesson"
              ? byId("personal-notes")
              : source.type === "architecture"
                ? byId("architecture-detail")
                : byId("panel-" + tab);
  if (!target) {
    toast("这个知识点的材料已更新，请在当前课查找。");
    return;
  }
  let ancestor = target.parentElement;
  while (ancestor && ancestor !== document.body) {
    if (ancestor.tagName === "DETAILS") ancestor.open = true;
    ancestor = ancestor.parentElement;
  }
  target.scrollIntoView({ block: "start" });
}

function exportStudyRecords(records, name = "学习笔记本") {
  download(
    name + ".md",
    exportStudyMarkdown(records, name),
    "text/markdown;charset=utf-8",
  );
}
function downloadNotebookBackup() {
  book.lessons[current.id] = state;
  download(
    "agent-engineering-lab-progress.json",
    JSON.stringify(book, null, 2),
    "application/json;charset=utf-8",
  );
}
function notebookRecords() {
  book.lessons[current.id] = state;
  return collectStudyRecords(book, catalog);
}
function chooseNotebookKind(kind) {
  notebookFilters.kind = kind;
  notebookFilters.status = kind === "all" ? "due" : "all";
  notebookFilters.source = "";
  byId("notebook-status").value = notebookFilters.status;
  byId("notebook-source").value = "";
  renderNotebook();
}
for (const stage of material.stages) {
  const option = textElement("option", stage.id + " · " + stage.title);
  option.value = stage.id;
  byId("notebook-stage").append(option);
}
for (const [value, label] of Object.entries(sourceLabels)) {
  const option = textElement("option", label);
  option.value = value;
  byId("notebook-source").append(option);
}
function populateNotebookLessons() {
  const selected = notebookFilters.lessonId;
  byId("notebook-lesson").replaceChildren(textElement("option", "全部课程"));
  byId("notebook-lesson").firstChild.value = "";
  for (const lesson of catalog.filter(
    (item) => !notebookFilters.stage || item.stage === notebookFilters.stage,
  )) {
    const option = textElement("option", lesson.id + " · " + lesson.title);
    option.value = lesson.id;
    byId("notebook-lesson").append(option);
  }
  byId("notebook-lesson").value = selected;
  if (byId("notebook-lesson").value !== selected) notebookFilters.lessonId = "";
}
for (const [id, key] of [
  ["notebook-stage", "stage"],
  ["notebook-lesson", "lessonId"],
  ["notebook-source", "source"],
  ["notebook-status", "status"],
  ["notebook-query", "query"],
]) {
  byId(id).addEventListener(
    id === "notebook-query" ? "input" : "change",
    (event) => {
      notebookFilters[key] = event.target.value;
      if (key === "stage") populateNotebookLessons();
      renderNotebook();
    },
  );
}
document
  .querySelectorAll("[data-notebook-kind]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      chooseNotebookKind(button.dataset.notebookKind),
    ),
  );
byId("notebook-current").addEventListener("click", () => {
  notebookFilters.stage = current.stage;
  notebookFilters.lessonId = current.id;
  byId("notebook-stage").value = current.stage;
  populateNotebookLessons();
  renderNotebook();
});
byId("notebook-clear").addEventListener("click", () => {
  Object.assign(notebookFilters, {
    stage: "",
    lessonId: "",
    source: "",
    status: "all",
    query: "",
  });
  for (const id of ["notebook-query", "notebook-stage", "notebook-source"])
    byId(id).value = "";
  byId("notebook-status").value = "all";
  populateNotebookLessons();
  renderNotebook();
});
byId("new-notebook-note").addEventListener("click", () => {
  const lessonId =
    notebookFilters.lessonId ||
    (!notebookFilters.stage || current.stage === notebookFilters.stage
      ? current.id
      : catalog.find((lesson) => lesson.stage === notebookFilters.stage).id);
  createSourceNote(lessonId, {
    type: "lesson",
    id: "",
    label: "我的课程知识点",
  });
});
byId("export-notebook").addEventListener("click", () =>
  exportStudyRecords(
    filterStudyRecords(notebookRecords(), notebookFilters),
    "学习笔记本-当前筛选",
  ),
);
for (const id of ["backup-notebook", "note-backup-all", "conflict-backup"])
  byId(id).addEventListener("click", downloadNotebookBackup);
byId("notebook-import").addEventListener("click", () => {
  selectTab("notes", true);
  byId("import-file").click();
});
populateNotebookLessons();

function notebookCardHeader(record) {
  const card = textElement("article", undefined, "notebook-card");
  const meta = textElement("div", undefined, "notebook-meta");
  const labels = {
    note: "普通笔记",
    weak: "薄弱点",
    reviewed: "已回顾",
    open: "待订正",
    corrected: "已订正",
  };
  meta.append(
    textElement("span", record.lessonId + " · 阶段 " + record.stage),
    textElement(
      "span",
      record.kind === "raw" ? "原始记录" : labels[record.status],
      "notebook-status " + (record.kind === "raw" ? "raw" : record.status),
    ),
    textElement("span", sourceLabels[record.source.type]),
  );
  card.append(meta, textElement("h3", record.title));
  return card;
}
function renderNoteRecord(record) {
  const card = notebookCardHeader(record);
  if (record.tags.length)
    card.append(
      textElement(
        "div",
        record.tags.map((tag) => "#" + tag).join("  "),
        "notebook-tags",
      ),
    );
  card.append(
    textElement(
      "p",
      record.body
        ? record.body.slice(0, 300) + (record.body.length > 300 ? "…" : "")
        : "尚未填写正文，点击编辑继续记录。",
      "notebook-preview",
    ),
  );
  if (record.kind !== "raw")
    card.append(
      textElement(
        "p",
        studyDueLabel(record.dueAt) + " · 更新：" + studyDate(record.updatedAt),
        "microcopy",
      ),
    );
  const actions = textElement("div", undefined, "record-buttons");
  if (record.kind === "raw") {
    actions.append(
      studyButton("整理成独立笔记", () =>
        createSourceNote(record.lessonId, record.source, false, record),
      ),
      studyButton("整理为薄弱点", () =>
        createSourceNote(record.lessonId, record.source, true, record),
      ),
      studyButton("回到原记录编辑 →", () =>
        navigateStudySource(record.lessonId, record.source),
      ),
    );
  } else {
    actions.append(
      studyButton("编辑 / 继续记录", () =>
        openNoteEditor(record.lessonId, record.id),
      ),
      studyButton("仍需巩固 · 明天再看", () => {
        reviewNotebookNote(record.value, false);
        persist();
        renderNotebook();
      }),
      studyButton("已解释清楚 · 3天后再看", () => {
        reviewNotebookNote(record.value, true);
        persist();
        renderNotebook();
      }),
      studyButton("回到知识点 →", () =>
        navigateStudySource(record.lessonId, record.source),
      ),
    );
  }
  actions.append(
    studyButton("导出本条", () =>
      exportStudyRecords([record], record.lessonId + "-学习记录"),
    ),
  );
  card.append(actions);
  return card;
}

function renderMistakeRecord(record) {
  const item = record.value;
  const lesson = catalog.find((lesson) => lesson.id === record.lessonId);
  const currentQuestion = lesson.quiz.find(
    (question) => question.id === item.questionId,
  );
  const changed =
    !currentQuestion ||
    questionFingerprint(currentQuestion) !== item.fingerprint;
  const card = notebookCardHeader(record);
  card.append(
    textElement(
      "p",
      "错选 " +
        item.wrongCount +
        " 次 · 最近错选 " +
        String.fromCharCode(65 + item.lastWrongAnswer) +
        " · " +
        studyDate(item.lastWrongAt, true) +
        " · " +
        studyDueLabel(item.dueAt),
      "microcopy",
    ),
  );
  if (changed)
    card.append(
      textElement(
        "p",
        "课程题面已更新，本卡保留当时的题面和选项；本卡复习按这个快照判断。",
        "study-entry-notice",
      ),
    );
  if (!item.correction.trim() && item.history.at(-1)?.correct)
    card.append(
      textElement(
        "p",
        "最近已经选对，补充自己的订正说明后，再提交一次复习即可标记已订正。",
        "study-entry-notice",
      ),
    );
  const details = textElement("details");
  details.open = expandedMistakes.has(record.lessonId + "/" + record.id);
  details.append(textElement("summary", "写订正并重新作答"));
  details.addEventListener("toggle", () => {
    const key = record.lessonId + "/" + record.id;
    if (details.open) expandedMistakes.add(key);
    else expandedMistakes.delete(key);
  });
  const correctionId = "correction-" + record.lessonId + "-" + record.id;
  textareaField(
    details,
    correctionId,
    "我错在哪里？正确的判断方法是什么？",
    item.correction,
    "写下原先的误解、正确解释，以及用什么反例验证。输入自动保存。",
    12000,
    (value) => {
      item.correction = value;
      item.updatedAt = Date.now();
      if (!value.trim()) {
        item.status = "open";
        card.querySelector(".notebook-status").textContent = "待订正";
        card.querySelector(".notebook-status").className =
          "notebook-status open";
      }
      renderNotebookStats();
    },
    "mistake-correction",
  );
  const question = textElement("fieldset", undefined, "mistake-question");
  question.append(textElement("legend", "重新选择：" + item.questionId));
  const radioName = "review-" + record.lessonId + "-" + record.id;
  for (const [index, option] of item.snapshot.options.entries()) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = radioName;
    radio.value = String(index);
    radio.checked = item.reviewChoice === index;
    radio.addEventListener("change", () => {
      item.reviewChoice = index;
      persist();
    });
    label.append(
      radio,
      textElement("span", String.fromCharCode(65 + index) + ". " + option),
    );
    question.append(label);
  }
  const feedbackKey = record.lessonId + "/" + record.id;
  const feedback = textElement(
    "p",
    mistakeFeedback.get(feedbackKey) ||
      "选对且填写订正说明后记为已订正，历史仍保留。",
    "microcopy",
  );
  feedback.setAttribute("role", "status");
  const submit = studyButton(
    "提交这道题的复习",
    () => {
      if (!Number.isInteger(item.reviewChoice)) {
        toast("先选择这道错题的复习答案。");
        return;
      }
      const correct = recordMistakeReview(item, item.reviewChoice);
      persist();
      const message = correct
        ? item.status === "corrected"
          ? "本次选对，订正已保存；安排3天后再回顾，原错题继续保留。"
          : "本次选对，但还没有订正说明。先写清误解与正确解释，再提交复习。"
        : "这次仍有误，保留为待订正；可以先对照解析，安排明天再回顾。";
      mistakeFeedback.set(feedbackKey, message);
      expandedMistakes.add(feedbackKey);
      renderNotebook();
      byId("review-submit-" + record.lessonId + "-" + record.id)?.focus({
        preventScroll: true,
      });
      toast(message);
    },
    "button primary",
  );
  submit.id = "review-submit-" + record.lessonId + "-" + record.id;
  details.append(question, submit, feedback);
  const dueLabel = textElement(
    "label",
    "调整本题回顾日期（清空则不提醒）",
    "field-label",
  );
  const dueInput = document.createElement("input");
  dueInput.type = "date";
  dueInput.value = studyDateInput(item.dueAt);
  dueLabel.htmlFor = dueInput.id =
    "review-due-" + record.lessonId + "-" + record.id;
  dueInput.addEventListener("change", () => {
    item.dueAt = dueInput.value
      ? new Date(dueInput.value + "T00:00:00").getTime()
      : null;
    item.updatedAt = Date.now();
    persist();
    renderNotebookStats();
  });
  details.append(dueLabel, dueInput);
  const reference = textElement("details", undefined, "mistake-answer");
  reference.append(
    textElement("summary", "查看参考答案与讲评"),
    textElement(
      "p",
      "参考选择：" +
        String.fromCharCode(65 + item.snapshot.answer) +
        ". " +
        item.snapshot.options[item.snapshot.answer],
    ),
    textElement("p", item.snapshot.explanation),
  );
  if (!changed && currentQuestion.solutionHtml) {
    const explanation = textElement("div", undefined, "article-body");
    explanation.innerHTML = currentQuestion.solutionHtml; // 仅使用编译期的可信讲评。
    reference.append(explanation);
  }
  const history = textElement("ol", undefined, "mistake-history");
  for (const attempt of [...item.history].reverse())
    history.append(
      textElement(
        "li",
        studyDate(attempt.at, true) +
          " · " +
          (attempt.via === "review" ? "错题复习" : "课堂自测") +
          " · " +
          String.fromCharCode(65 + attempt.answer) +
          " · " +
          (attempt.correct ? "选对" : "错选"),
      ),
    );
  const historyDetails = textElement("details");
  historyDetails.append(
    textElement("summary", "查看作答历史（最近30次）"),
    history,
  );
  const actions = textElement("div", undefined, "record-buttons");
  actions.append(
    studyButton("回到当前课自测 →", () =>
      navigateStudySource(record.lessonId, record.source),
    ),
    studyButton("记一条关联笔记", () =>
      createSourceNote(record.lessonId, record.source, true),
    ),
    studyButton("导出本题与订正", () =>
      exportStudyRecords([record], record.lessonId + "-错题"),
    ),
  );
  card.append(details, reference, historyDetails, actions);
  return card;
}

function renderNotebookStats(records = notebookRecords()) {
  const stats = [
    ["知识点笔记", records.filter((record) => record.kind === "notes").length],
    ["原始记录", records.filter((record) => record.kind === "raw").length],
    [
      "待订正错题",
      records.filter(
        (record) => record.kind === "mistakes" && record.status === "open",
      ).length,
    ],
    [
      "到期回顾",
      records.filter(
        (record) => record.dueAt !== null && record.dueAt <= Date.now(),
      ).length,
    ],
  ];
  byId("notebook-stats").replaceChildren(
    ...stats.map(([label, count]) => {
      const block = textElement("div", undefined, "notebook-stat");
      block.append(
        textElement("strong", String(count)),
        textElement("span", label),
      );
      return block;
    }),
  );
}
function renderNotebook() {
  const records = notebookRecords();
  renderNotebookStats(records);
  document
    .querySelectorAll("[data-notebook-kind]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.notebookKind === notebookFilters.kind),
      ),
    );
  const visible = filterStudyRecords(records, notebookFilters);
  byId("notebook-results-label").textContent =
    "全课程统计 · 当前筛选找到 " +
    visible.length +
    " 条记录" +
    (visible.length > 80
      ? "，先显示80条。可缩小筛选，导出会包含全部匹配结果。"
      : "。复习记录仅用于自己巩固，不计正式成绩。");
  const results = byId("notebook-results");
  results.replaceChildren();
  if (!visible.length) {
    const empty = textElement("div", undefined, "notebook-empty");
    empty.append(
      textElement("strong", "这里暂时没有匹配记录。"),
      textElement(
        "p",
        notebookFilters.kind === "notes"
          ? "可以在讲义、实验和题目旁记笔记。旧版观察和个人笔记保留在“原始记录”，可以整理后标为薄弱点。"
          : notebookFilters.kind === "mistakes"
            ? "选择题完成并提交后，答错的题会自动留在这里；尚未提交的选择不计入。也可以清除筛选再找找。"
            : "实验预测、观察与运行快照会保存在原始记录。没有到期回顾时，也可以切回笔记或错题主动复习。",
      ),
    );
    empty.append(studyButton("查看原始记录", () => chooseNotebookKind("raw")));
    results.append(empty);
    return;
  }
  for (const record of visible.slice(0, 80))
    results.append(
      record.kind === "mistakes"
        ? renderMistakeRecord(record)
        : renderNoteRecord(record),
    );
}

byId("backup-raw-storage").addEventListener("click", () => {
  try {
    const raw =
      localStorage.getItem(storageKey) ||
      localStorage.getItem("agent-engineering-lab:classroom:S1-L01:v1");
    if (!raw) {
      toast("浏览器里没有可下载的原始记录，本页暂存可用另一个按钮导出。");
      return;
    }
    download(
      "agent-engineering-lab-raw-storage.txt",
      raw,
      "text/plain;charset=utf-8",
    );
  } catch {
    toast("浏览器不允许读取存储；请先导出本页暂存记录。");
  }
});
byId("reload-storage").addEventListener("click", async () => {
  if (
    !(await askConfirmation(
      "载入浏览器最新记录？",
      "本页尚未保存的暂存内容将被替换。请先导出本页完整JSON；此操作不合并两个版本。",
    ))
  )
    return;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      toast("浏览器没有最新记录，本页暂存已保留。");
      return;
    }
    const latest = normalizeBook(JSON.parse(raw), catalog);
    stopWorkers();
    lastStoredValue = raw;
    storageWriteBlocked = false;
    book = latest;
    current = null;
    state = emptyState(latest.currentLesson);
    selectLesson(latest.currentLesson);
    toast("已载入浏览器最新记录。");
  } catch (error) {
    toast("未能载入，原始记录与本页暂存均保留：" + error.message);
  }
});
