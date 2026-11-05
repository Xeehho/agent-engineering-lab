(function () {
  "use strict";
  // __CORE__
  const material = /*__CONTENT__*/;
  const catalog = material.lessons;
  const storageKey = "agent-engineering-lab:classroom:book:v2";
  let book = emptyBook(catalog);
  let current = catalog[0];
  let experiments = current.experiments, checkpoints = current.checkpoints, quiz = current.quiz;
  const byId = id => document.getElementById(id);
  if (location.protocol === "file:") {
    byId("classroom-home").href = "https://github.com/Xeehho/agent-engineering-lab#readme";
    byId("classroom-home").setAttribute("aria-label", "查看项目介绍");
    byId("classroom-home").target = "_blank";
    byId("classroom-home").rel = "noopener noreferrer";
  }
  let state = emptyState();
  let storageAvailable = true;
  let toastTimer;
  const activeWorkers = new Map();
  const textElement = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  function toast(message) {
    clearTimeout(toastTimer);
    byId("toast").textContent = message;
    byId("toast").hidden = false;
    toastTimer = setTimeout(() => { byId("toast").hidden = true; }, 4200);
  }
  try {
    const saved = localStorage.getItem(storageKey) || localStorage.getItem("agent-engineering-lab:classroom:S1-L01:v1");
    if (saved) book = normalizeBook(JSON.parse(saved), catalog);
  } catch {
    storageAvailable = false;
    toast("本机记录不可读取。仍可学习，请及时导出备份。");
  }
  function persist() {
    book.lessons[current.id] = state;
    book.currentLesson = current.id;
    try {
      localStorage.setItem(storageKey, JSON.stringify(book));
      storageAvailable = true;
    } catch { storageAvailable = false; }
    byId("save-status").textContent = storageAvailable ? "已保存到本机" : "无法自动保存，请导出备份";
    updateProgress();
  }
  function updateProgress() {
    const progress = summarizeProgress(state, experiments, checkpoints, quiz);
    byId("progress-label").textContent = progress.completed + " / 4";
    byId("lesson-progress").value = progress.completed;
    ["read", "lab", "practice", "quiz"].forEach((key, index) =>
      byId("progress-" + key).classList.toggle("done", progress.parts[index]));
    byId("quiz-count").textContent = "已选 " + progress.grade.answered + " / " + quiz.length;
    for (const item of checkpoints)
      byId("draft-status-" + item.id).textContent = state.drafts[item.id]?.trim() ? "已填写 · 待评阅" : "待作答";
    for (const button of document.querySelectorAll("[data-lesson]")) {
      const item = catalog.find(item => item.id === button.dataset.lesson);
      const saved = book.lessons[item.id];
      button.querySelector("small").textContent = item.id + " · " + (item.contentLevel==="detailed"?"详细教程":"简版待扩写") +
        (saved ? " · " + summarizeProgress(saved, item.experiments, item.checkpoints, item.quiz).completed + "/4" : "");
    }
  }
  function selectTab(name, focus = false) {
    if (!tabs.includes(name)) name = "lecture";
    state.tab = name;
    for (const tab of tabs) {
      byId("tab-" + tab).setAttribute("aria-selected", String(tab === name));
      byId("tab-" + tab).tabIndex = tab === name ? 0 : -1;
      byId("panel-" + tab).hidden = tab !== name;
    }
    if (focus) {
      byId("tab-" + name).focus({ preventScroll: true });
      document.querySelector(".tabs-wrap").scrollIntoView({ block: "start" });
    }
    persist();
    const hash = "#" + current.id + "/" + name;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }
  function selectLesson(id, tab, focus = false) {
    const next = catalog.find(item => item.id === id);
    if (!next) return;
    stopWorkers();
    if (current) book.lessons[current.id] = state;
    current = next;
    byId("lesson-search").value = "";
    byId("search-status").textContent = "";
    document.querySelectorAll("[data-lesson],.stage-group").forEach(node => { node.hidden = false; });
    experiments = current.experiments; checkpoints = current.checkpoints; quiz = current.quiz;
    state = book.lessons[current.id] || emptyState(current.id);
    if (tab && tabs.includes(tab)) state.tab = tab;
    document.title = current.id + " · " + current.title + " | Agent Engineering Lab";
    const stage = material.stages.find(stage => stage.id === current.stage);
    byId("stage-crumb").textContent = "阶段 " + current.stage + " · " + stage.title;
    byId("lesson-crumb").textContent = current.id;
    byId("lesson-version").textContent = current.id;
    byId("lesson-badge").textContent = current.id + " · BUILD YOUR JUDGMENT";
    byId("lesson-title").textContent = current.title;
    byId("lesson-summary").textContent = current.summary;
    byId("content-status").textContent = current.contentLevel==="detailed" ? "详细教程 · 含步骤、实操、排错与验收" : "简版材料 · 详细教程正在补写";
    byId("lesson-duration").textContent = "◷ " + current.duration;
    byId("lab-meta").textContent = experiments.length + " 个实验";
    byId("practice-meta").textContent = checkpoints.length + " 道随堂题";
    byId("lab-description").textContent = experiments.length + " 个可编辑 JavaScript 实验。只教机制，不代替真实服务、协议、Python 或生产验证。";
    byId("quiz-description").textContent = quiz.length + " 道公开单选题。提交后显示解析，可修改后重测。";
    byId("progress-lab").textContent = "运行 " + experiments.length + " 个实验";
    byId("progress-practice").textContent = "填写 " + checkpoints.length + " 道随堂题";
    byId("tab-lab").querySelector("b").textContent = experiments.length;
    byId("tab-practice").querySelector("b").textContent = checkpoints.length;
    // Only compiler-generated trusted teaching HTML is rendered here; answers always use textContent/value.
    byId("lecture-content").innerHTML = current.lectureHtml;
    byId("notes-content").innerHTML = current.notesHtml;
    byId("lecture-toc").innerHTML = '<span class="eyebrow">本课目录</span>' + current.tocHtml;
    byId("mission-text").textContent = current.project;
    byId("tutorial-files").replaceChildren();
    byId("tutorial-files").hidden = !current.practicalFiles?.length;
    if (current.practicalFiles?.length) {
      byId("tutorial-files").append(textElement("h3","本课本地实操文件"),
        textElement("p","文件已随仓库提供，也可在这里单独下载。保存到 examples/tutorials/，按讲义命令运行；Node/Python 等本地能力不在网页 Worker 内执行。"));
      for (const file of current.practicalFiles) {
        const button = textElement("button","下载 " + file.name,"button small");
        button.type="button";
        button.addEventListener("click",()=>download(file.name,file.code,"text/plain;charset=utf-8"));
        byId("tutorial-files").append(button);
      }
    }
    byId("exam-link").href = "https://github.com/Xeehho/agent-engineering-lab/blob/main/assessments/stage-" + current.stage + "/exam-blueprint.md";
    const maps = document.querySelectorAll(".map-step");
    maps.forEach((node, index) => {
      node.querySelector("b").textContent = current.goals[index];
      node.querySelector("small").textContent = ["理解机制", "识别失败边界", "用证据验证"][index];
      node.querySelector(".map-tag").textContent = ["LEARN", "VERIFY", "APPLY"][index];
    });
    document.querySelector(".boundary-map").setAttribute("aria-label", "本课三个学习目标");
    document.querySelector(".map-label").innerHTML = '<span class="terminal-dot"></span> concept → boundary → evidence <span>' + current.stage + "</span>";
    document.querySelector(".boundary-map > p").textContent = "教材可提前阅读，掌握程度由本人作答与项目证据判断。";
    const position = catalog.indexOf(current);
    byId("lesson-position").textContent = (position + 1) + " / " + catalog.length + " · " + current.id;
    byId("previous-lesson").disabled = position === 0;
    byId("next-lesson").disabled = position === catalog.length - 1;
    document.querySelectorAll("[data-lesson]").forEach(button => {
      const selected = button.dataset.lesson === current.id;
      button.classList.toggle("current", selected);
      if (selected) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    document.querySelectorAll(".stage-group").forEach(group => { group.open = group.dataset.stage === current.stage; });
    restoreControls();
    if (focus) {
      byId("lesson-title").tabIndex = -1; byId("lesson-title").focus({preventScroll:true});
      window.scrollTo({top:0,behavior:"auto"});
    }
  }
  document.querySelectorAll("[data-lesson]").forEach(button =>
    button.addEventListener("click", () => selectLesson(button.dataset.lesson, "lecture", true)));
  byId("previous-lesson").addEventListener("click", () => selectLesson(catalog[catalog.indexOf(current) - 1]?.id, "lecture", true));
  byId("next-lesson").addEventListener("click", () => selectLesson(catalog[catalog.indexOf(current) + 1]?.id, "lecture", true));
  byId("lesson-search").addEventListener("input", event => {
    const query = event.target.value.trim().toLowerCase();
    let matches = 0;
    document.querySelectorAll("[data-lesson]").forEach(button => {
      const item = catalog.find(item => item.id === button.dataset.lesson);
      const match = !query || [item.id,item.title,item.summary,...item.goals].join(" ").toLowerCase().includes(query);
      button.hidden = !match; if (match) matches++;
    });
    document.querySelectorAll(".stage-group").forEach(group => {
      group.hidden = !Array.from(group.querySelectorAll("[data-lesson]")).some(button => !button.hidden);
      group.open = Boolean(query) || group.dataset.stage === current.stage;
    });
    byId("search-status").textContent = query ? matches + " 课匹配" : "";
  });
  window.addEventListener("hashchange", () => {
    const [id, tab] = location.hash.slice(1).split("/");
    if (catalog.some(item => item.id === id)) selectLesson(id, tab);
  });
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => selectTab(button.dataset.tab));
    button.addEventListener("keydown", event => {
      let target = null;
      const index = tabs.indexOf(button.dataset.tab);
      if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft") target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === "Home") target = tabs[0];
      if (event.key === "End") target = tabs[tabs.length - 1];
      if (target) { event.preventDefault(); selectTab(target); byId("tab-" + target).focus(); }
    });
  });
  document.querySelectorAll("[data-go]").forEach(button =>
    button.addEventListener("click", () => selectTab(button.dataset.go, true)));
  document.querySelectorAll('a[href="#lecture"],a[href="#quiz"]').forEach(link =>
    link.addEventListener("click", event => {
      event.preventDefault(); selectTab(link.getAttribute("href").slice(1), true);
    }));
  byId("read-complete").addEventListener("change", event => {
    state.read = event.target.checked; persist();
  });

  function textareaField(parent, id, label, value, placeholder, max, onChange, className) {
    const wrapper = textElement("div", undefined, className);
    const caption = textElement("label", label, "field-label");
    caption.htmlFor = id;
    const textarea = document.createElement("textarea");
    textarea.id = id; textarea.rows = 3; textarea.maxLength = max;
    textarea.value = value || ""; textarea.placeholder = placeholder;
    textarea.addEventListener("input", () => { onChange(textarea.value); persist(); });
    wrapper.append(caption, textarea); parent.append(wrapper);
    return textarea;
  }
  function addHint(parent, content) {
    const details = textElement("details", undefined, "hint");
    details.append(textElement("summary", "需要一条提示？"), textElement("p", content));
    parent.append(details);
  }
  function renderExperiments() {
    byId("experiments").replaceChildren();
    for (const item of experiments) {
      const card = textElement("article", undefined, "experiment");
      card.append(textElement("span", item.label, "eyebrow green"), textElement("h3", item.title),
        textElement("p", item.intro));
      textareaField(card, "predict-" + item.id, "运行前预测", state.predictions[item.id],
        "先写下你预期的输出，再用运行结果验证。", 6000,
        value => { state.predictions[item.id] = value; }, "prediction");
      const shell = textElement("div", undefined, "editor-shell");
      const header = textElement("div", undefined, "editor-header");
      const codeLabel = textElement("label", item.id + ".js");
      codeLabel.htmlFor = "code-" + item.id;
      header.append(codeLabel, textElement("span", "JavaScript · 可编辑"));
      const editor = document.createElement("textarea");
      editor.id = "code-" + item.id; editor.className = "code-editor"; editor.spellcheck = false;
      editor.setAttribute("aria-label", item.title + " 实验代码");
      editor.maxLength = 20000; editor.value = state.codes[item.id] ?? item.code;
      editor.addEventListener("input", () => { state.codes[item.id] = editor.value; persist(); });
      editor.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          if (!activeWorkers.has(item.id)) runExperiment(item, editor.value);
        }
      });
      const toolbar = textElement("div", undefined, "editor-toolbar");
      const run = textElement("button", "▶ 运行代码", "button primary");
      run.type = "button"; run.id = "run-" + item.id;
      run.setAttribute("aria-label", "运行实验 " + item.id);
      run.addEventListener("click", () => runExperiment(item, editor.value));
      const reset = textElement("button", "恢复示例", "button");
      reset.type = "button"; reset.setAttribute("aria-label", "恢复实验 " + item.id);
      reset.addEventListener("click", async () => {
        if (editor.value !== item.code && !await askConfirmation("恢复示例代码？", "你对此实验代码的修改会被替换，预测与观察记录保留。")) return;
        editor.value = item.code; state.codes[item.id] = item.code; persist(); toast("已恢复课堂示例代码。");
      });
      const runStatus = textElement("span", state.ran.includes(item.id) ? "上次已运行" : "Ctrl / ⌘ + Enter", "run-state");
      runStatus.id = "run-state-" + item.id;
      toolbar.append(run, reset, runStatus);
      const output = textElement("pre", "等待运行。先写预测，再点击运行。", "output");
      output.id = "output-" + item.id; output.setAttribute("role", "log");
      output.setAttribute("aria-label", item.title + " 运行输出"); output.setAttribute("aria-live", "polite");
      shell.append(header, editor, toolbar, textElement("div", "CONSOLE / 本地实际运行", "output-label"), output);
      card.append(shell);
      addHint(card, item.hint);
      card.append(textElement("div", "观察方向：" + item.expected, "expected"));
      textareaField(card, "observe-" + item.id, "观察与证据边界", state.observations[item.id],
        "实际输出是什么？与预测有什么不同？哪些事情仍未被证明？", 6000,
        value => { state.observations[item.id] = value; });
      byId("experiments").append(card);
    }
  }
  function runExperiment(item, code) {
    if (activeWorkers.has(item.id)) return;
    const output = byId("output-" + item.id);
    const button = byId("run-" + item.id);
    const status = byId("run-state-" + item.id);
    output.textContent = ""; output.classList.remove("error");
    button.disabled = true; status.textContent = "运行中…";
    let worker, blobUrl, timer, finished = false, lineCount = 0;
    const finish = (message, failure = false, completed = false) => {
      if (finished) return;
      finished = true; clearTimeout(timer); worker?.terminate();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      activeWorkers.delete(item.id);
      button.disabled = false; status.textContent = message;
      output.classList.toggle("error", failure);
      if (completed && !state.ran.includes(item.id)) { state.ran.push(item.id); persist(); }
      if (!output.textContent) output.textContent = completed ? "执行结束（没有 console 输出）。" : message;
    };
    try {
      blobUrl = URL.createObjectURL(new Blob(["(" + classroomWorker.toString() + ")()"], { type: "text/javascript" }));
      worker = new Worker(blobUrl);
      activeWorkers.set(item.id, () => finish("已停止"));
      timer = setTimeout(() => {
        output.textContent += "\n超过 3 秒，已终止实验。检查循环或未完成的等待。";
        finish("运行超时", true);
      }, 3000);
      worker.onmessage = event => {
        const message = event.data;
        if (!message || typeof message.type !== "string") return;
        if (message.type === "log" && lineCount++ < 80)
          output.textContent += String(message.text).slice(0, 4000) + "\n";
        if (message.type === "error") {
          output.textContent += String(message.text).slice(0, 4000);
          finish("有错误 · 可修改后再试", true);
        }
        if (message.type === "done") finish("执行结束", false, true);
      };
      worker.onerror = event => {
        event.preventDefault();
        output.textContent += event.message || "Worker 无法执行；可尝试本地服务方式打开。";
        finish("运行失败", true);
      };
      worker.postMessage(code);
    } catch (error) {
      output.textContent = error.name + ": " + error.message + "\n若浏览器限制 file:// Worker，请用仓库本地服务打开。";
      finish("运行器不可用", true);
    }
  }

  function renderCheckpoints() {
    byId("checkpoints").replaceChildren();
    for (const item of checkpoints) {
      const card = textElement("article", undefined, "checkpoint");
      const meta = textElement("div", undefined, "question-meta");
      meta.append(textElement("span", item.id), textElement("span", item.badge, "tag"));
      card.append(meta, textElement("h3", item.title), textElement("p", item.text));
      if (item.code) card.append(textElement("pre", item.code));
      addHint(card, item.hint);
      const caption = textElement("label", undefined, "answer-label");
      caption.htmlFor = "answer-" + item.id;
      caption.append(textElement("b", "你的回答"), textElement("span", "待作答"));
      caption.lastChild.id = "draft-status-" + item.id;
      const answer = document.createElement("textarea");
      answer.id = "answer-" + item.id; answer.rows = 5; answer.maxLength = 12000;
      answer.placeholder = "结论：\n依据：\n还需要补查的证据：";
      answer.value = state.drafts[item.id] || "";
      answer.addEventListener("input", () => { state.drafts[item.id] = answer.value; persist(); });
      card.append(caption, answer); byId("checkpoints").append(card);
    }
  }
  function renderQuiz() {
    byId("quiz-questions").replaceChildren();
    quiz.forEach((item, index) => {
      const fieldset = textElement("fieldset", undefined, "quiz-question");
      const legend = textElement("legend");
      legend.append(textElement("span", "0" + (index + 1)), document.createTextNode(item.question));
      fieldset.append(legend);
      const options = textElement("div", undefined, "quiz-options");
      item.options.forEach((option, optionIndex) => {
        const label = textElement("label", undefined, "quiz-option");
        const input = document.createElement("input");
        input.type = "radio"; input.name = item.id; input.value = String(optionIndex);
        input.checked = state.answers[item.id] === optionIndex;
        input.addEventListener("change", () => {
          state.answers[item.id] = optionIndex;
          // Invalidate the old result until the learner explicitly submits the new attempt.
          state.submitted = false; renderQuizResults(); persist();
        });
        label.append(input, textElement("span", String.fromCharCode(65 + optionIndex) + ".", "option-letter"),
          textElement("span", option));
        options.append(label);
      });
      const explanation = textElement("p", undefined, "quiz-explanation");
      explanation.id = "explanation-" + item.id; explanation.hidden = true;
      fieldset.append(options, explanation); byId("quiz-questions").append(fieldset);
    });
    renderQuizResults();
  }
  function renderQuizResults() {
    const grade = gradeQuiz(state.answers, quiz);
    byId("quiz-result").hidden = !state.submitted;
    for (const item of quiz) {
      const explanation = byId("explanation-" + item.id);
      explanation.hidden = !state.submitted;
      if (!state.submitted) continue;
      const correct = state.answers[item.id] === item.answer;
      explanation.classList.toggle("incorrect", !correct);
      explanation.textContent = (correct ? "回答正确。" : "再想一想。") + "参考选择：" +
        String.fromCharCode(65 + item.answer) + "。" + item.explanation;
    }
    if (state.submitted) {
      byId("quiz-result").replaceChildren(
        textElement("h3", "本次自测 " + grade.correct + " / " + grade.total),
        textElement("p", grade.correct === grade.total
          ? "基础选择题全对。接下来请完成开放作答，用自己的话解释；正式考试仍待阶段交卷与老师评阅。"
          : "按题目解析回到讲义或实验补学，再修改选项重新提交。这个结果不计入正式成绩。"));
    }
  }
  byId("quiz-form").addEventListener("submit", event => {
    event.preventDefault();
    const grade = gradeQuiz(state.answers, quiz);
    if (grade.answered !== quiz.length) {
      const unanswered = grade.items.find(item => !item.answered);
      toast("还有 " + (quiz.length - grade.answered) + " 道题未选择，请先完成。");
      document.querySelector('input[name="' + unanswered.id + '"]').focus(); return;
    }
    state.submitted = true; renderQuizResults(); persist();
    byId("quiz-result").scrollIntoView({ block: "center", behavior: "auto" });
  });

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url; link.download = name; document.body.append(link);
    link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast("已生成下载文件，请在浏览器下载列表中查看。");
  }
  function downloadAnswers() {
    download(current.id + "-课堂作答.md", exportAnswers(state, experiments, checkpoints, quiz), "text/markdown;charset=utf-8");
  }
  ["export-top", "export-answers", "export-notes"].forEach(id =>
    byId(id).addEventListener("click", downloadAnswers));
  byId("backup").addEventListener("click", () =>
    download("agent-engineering-lab-progress.json", JSON.stringify(book, null, 2), "application/json;charset=utf-8"));
  byId("personal-notes").addEventListener("input", event => {
    state.personalNotes = event.target.value; persist();
  });
  byId("print-notes").addEventListener("click", () => window.print());
  function askConfirmation(title, message) {
    const dialog = byId("confirm-dialog");
    byId("dialog-title").textContent = title; byId("dialog-message").textContent = message;
    return new Promise(resolve => {
      let answer = false;
      const finish = () => {
        byId("dialog-confirm").removeEventListener("click", confirm);
        byId("dialog-cancel").removeEventListener("click", cancel);
        resolve(answer);
      };
      const confirm = () => { answer = true; dialog.close(); };
      const cancel = () => dialog.close();
      byId("dialog-confirm").addEventListener("click", confirm);
      byId("dialog-cancel").addEventListener("click", cancel);
      dialog.addEventListener("close", finish, { once: true });
      dialog.showModal();
    });
  }
  function stopWorkers() {
    for (const stop of activeWorkers.values()) stop();
  }
  function restoreControls() {
    renderExperiments(); renderCheckpoints(); renderQuiz();
    byId("read-complete").checked = state.read;
    byId("personal-notes").value = state.personalNotes;
    selectTab(state.tab);
  }
  async function importBackup(text) {
    if (new Blob([text]).size > 10000000) throw new Error("备份过大，上限 10 MB。");
    const imported = normalizeBook(JSON.parse(text), catalog);
    if (!await askConfirmation("导入学习记录？", "将以备份替换当前浏览器的课程记录。建议先备份；第一课旧版文件也可导入，分数不作为老师认证。")) return;
    stopWorkers(); book = imported;
    // Do not write the pre-import active lesson back into the imported book.
    current = null; state = emptyState(imported.currentLesson);
    selectLesson(imported.currentLesson);
    byId("import-text").value = "";
    toast("课程记录已导入；运行输出需重新执行。");
  }
  byId("import-file").addEventListener("change", async event => {
    const file = event.target.files[0]; event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 10000000) throw new Error("进度文件过大，上限为 10 MB。");
      await importBackup(await file.text());
    } catch (error) { toast("导入失败：" + error.message); }
  });
  byId("import-text-button").addEventListener("click", async () => {
    try { await importBackup(byId("import-text").value); }
    catch (error) { toast("导入失败：" + error.message); }
  });
  byId("reset-progress").addEventListener("click", async () => {
    if (!await askConfirmation("清空当前课记录？", "仅清空 " + current.id + " 在当前浏览器的答案、代码修改、笔记与活动记录，其他课保留。请先备份。")) return;
    stopWorkers(); state = emptyState(current.id); restoreControls(); toast("当前课记录已清空。");
  });
  window.addEventListener("pagehide", stopWorkers);
  const [requestedLesson, requestedTab] = location.hash.slice(1).split("/");
  const startId = catalog.some(item => item.id === requestedLesson) ? requestedLesson : book.currentLesson;
  current = null; // Initial selection must not overwrite a migrated first-lesson record.
  selectLesson(startId, requestedTab);
})();
