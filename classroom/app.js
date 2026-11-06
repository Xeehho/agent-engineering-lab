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
  let architecture = material.architecture[0];
  let scenarioIndex = 0;
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
  function lessonButtons(ids, container) {
    for (const id of ids) {
      const lesson = catalog.find(item=>item.id===id);
      const button=textElement("button",id+" · "+lesson.title,"button lesson-jump");
      button.type="button";
      button.dataset.openLesson=id;
      container.append(button);
    }
  }
  function mapTree(map) {
    const tree=textElement("div",undefined,"map-branches");
    for(const branch of map.branches) {
      const card=textElement("section");
      card.append(textElement("h3",branch.title));
      const list=document.createElement("ul");
      branch.points.forEach(point=>list.append(textElement("li",point)));
      card.append(list);tree.append(card);
    }
    return tree;
  }
  function renderLearningMaps() {
    const map=current.mindmap;
    byId("inline-mindmap").replaceChildren(textElement("p",map.question,"map-root"),mapTree(map));
    byId("mindmap-visual").innerHTML=map.svg;
    byId("mindmap-tree").replaceChildren(textElement("p",map.question,"map-root"),mapTree(map));
    const relations=byId("lesson-relations");relations.replaceChildren();
    for(const [title,ids,fallback] of [["开始前，先能解释",map.prerequisites,"能阅读JavaScript函数、对象、数组和if判断即可；第一次出现的AI概念会在讲义中解释。"],["学完后，会用在",map.next,"回到毕业项目，用阶段交卷与新变式答辩验证掌握。"]]) {
      const block=textElement("section");block.append(textElement("h3",title));
      if(ids.length) lessonButtons(ids,block); else block.append(textElement("p",fallback));
      relations.append(block);
    }
    const orientation=byId("lesson-orientation");orientation.replaceChildren(
      textElement("strong","本课先回答："+map.question),
      textElement("p","先读入门讲义 → 运行1个最小例子 → 完成随堂题。完整机制与原有实验放在进阶折叠区，可理解主线后再看。"));
    if(map.prerequisites.length) {
      const list=textElement("div",undefined,"prerequisite-links");
      list.append(textElement("span","若前置概念不熟，回到："));lessonButtons(map.prerequisites,list);orientation.append(list);
    }
    renderArchitecture();
  }
  function selectComponent(id) {
    const node=architecture.nodes.find(node=>node.id===id);
    if(!node) return;
    for(const button of byId("architecture-components").querySelectorAll("button"))
      button.setAttribute("aria-pressed",String(button.dataset.component===id));
    for(const group of byId("architecture-visual").querySelectorAll("[data-graph-node]"))
      group.classList.toggle("active",group.dataset.graphNode===id);
    const detail=byId("architecture-detail");detail.replaceChildren(textElement("h3",node.title));
    for(const [label,value] of [["输入",node.input],["输出",node.output],["先记住",node.rule]]) {
      const p=textElement("p");p.append(textElement("b",label+"："),document.createTextNode(value));detail.append(p);
    }
    const incoming=architecture.edges.filter(edge=>edge[1]===id).map(edge=>architecture.nodes.find(n=>n.id===edge[0]).title+"（"+edge[2]+"）");
    const outgoing=architecture.edges.filter(edge=>edge[0]===id).map(edge=>architecture.nodes.find(n=>n.id===edge[1]).title+"（"+edge[2]+"）");
    detail.append(textElement("p","上游："+(incoming.join("；")||"此视角的起点")),textElement("p","下游："+(outgoing.join("；")||"此视角的出口")),textElement("h4","对应课程"));
    lessonButtons(catalog.filter(item=>item.mindmap.components.includes(id)).map(item=>item.id),detail);
  }
  function renderScenario() {
    const [id,text]=architecture.steps[scenarioIndex];
    byId("scenario-step").textContent=(scenarioIndex+1)+" / "+architecture.steps.length+" · "+text;
    byId("scenario-previous").disabled=scenarioIndex===0;
    byId("scenario-next").disabled=scenarioIndex===architecture.steps.length-1;
    selectComponent(id);
  }
  function renderArchitecture() {
    const views=byId("architecture-views");views.replaceChildren();
    for(const view of material.architecture) {
      const button=textElement("button",view.title,"button");
      button.type="button";button.setAttribute("aria-pressed",String(view.id===architecture.id));
      button.addEventListener("click",()=>{architecture=view;scenarioIndex=0;renderArchitecture();});views.append(button);
    }
    byId("architecture-summary").textContent=architecture.summary;
    byId("architecture-visual").innerHTML=architecture.svg;
    byId("architecture-components").replaceChildren();
    architecture.nodes.forEach((node,index)=>{
      const button=textElement("button",(current.mindmap.components.includes(node.id)?"★ ":"")+(index+1)+". "+node.title,"button");
      button.type="button";button.dataset.component=node.id;button.addEventListener("click",()=>selectComponent(node.id));
      byId("architecture-components").append(button);
    });
    byId("architecture-edges").replaceChildren();
    for(const [a,b,label] of architecture.edges) byId("architecture-edges").append(textElement("li",architecture.nodes.find(n=>n.id===a).title+" → "+architecture.nodes.find(n=>n.id===b).title+"："+label));
    renderScenario();
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest?.("[data-open-lesson]");
    if(button) selectLesson(button.dataset.openLesson,"lecture",true);
  });
  byId("scenario-previous").addEventListener("click",()=>{if(scenarioIndex>0){scenarioIndex-=1;renderScenario();}});
  byId("scenario-next").addEventListener("click",()=>{if(scenarioIndex<architecture.steps.length-1){scenarioIndex+=1;renderScenario();}});
  byId("download-mindmap").addEventListener("click",()=>download(current.id+"-脑图.svg",current.mindmap.svg,"image/svg+xml;charset=utf-8"));
  byId("download-map-notes").addEventListener("click",()=>download(current.id+"-脑图笔记.md",current.mindmap.markdown,"text/markdown;charset=utf-8"));
  byId("download-teacher-notes").addEventListener("click",()=>download(current.id+"-老师讲评.md",current.teacherMarkdown,"text/markdown;charset=utf-8"));
  byId("download-architecture").addEventListener("click",()=>download("architecture-"+architecture.id+".svg",architecture.svg,"image/svg+xml;charset=utf-8"));
  document.addEventListener("click", async event => {
    const button = event.target.closest?.(".copy-code");
    if (!button) return;
    const code = button.closest(".code-block").querySelector("code");
    const source = Array.from(code.querySelectorAll(".code-line"),line => line.textContent).join("\n");
    try {
      await navigator.clipboard.writeText(source);
      toast("代码已复制。");
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      toast("已选中代码，可按 Ctrl / ⌘ + C 复制。");
    }
  });
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
    byId("quiz-count").textContent = "入门已选 " + progress.grade.answered + " / " + requiredItems(quiz).length;
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
      // Scroll the newly visible content. A sticky tab bar can remain at the
      // viewport top while its normal document position is far above us.
      byId("panel-" + name).scrollIntoView({ block: "start" });
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
    const coreExperimentCount = experiments.filter(item=>item.level!=="advanced").length;
    const advancedExperimentCount = experiments.length-coreExperimentCount;
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
    byId("lab-meta").textContent = coreExperimentCount + " 个入门实验" + (advancedExperimentCount ? " · "+advancedExperimentCount+" 个进阶选做" : "");
    byId("practice-meta").textContent = requiredItems(checkpoints).length + " 道入门随堂题";
    byId("lab-description").textContent = "直接在网站里预测、修改、运行和观察。每个实验标明实际执行与模拟的范围，无需启动项目。";
    byId("quiz-description").textContent = requiredItems(quiz).length + " 道入门题计入本次自测；进阶题选做，提交后已作答题显示解析。";
    byId("progress-lab").textContent = "运行 " + coreExperimentCount + " 个核心实验";
    byId("progress-practice").textContent = "填写 " + requiredItems(checkpoints).length + " 道入门题";
    byId("tab-lab").querySelector("b").textContent = coreExperimentCount;
    byId("tab-practice").querySelector("b").textContent = requiredItems(checkpoints).length;
    // Only compiler-generated trusted teaching HTML is rendered here; answers always use textContent/value.
    byId("lecture-content").innerHTML = current.lectureHtml;
    byId("advanced-lecture").hidden = !current.advancedLectureHtml;
    byId("advanced-lecture").open = false;
    byId("advanced-lecture-content").innerHTML = current.advancedLectureHtml || "";
    byId("notes-content").innerHTML = current.notesHtml;
    byId("teacher-overview").innerHTML = current.teacherOverviewHtml;
    byId("teacher-overview").parentElement.open = false;
    renderLearningMaps();
    byId("lecture-toc").innerHTML = '<span class="eyebrow">本课目录</span>' + current.tocHtml;
    byId("mission-title").textContent = "本课网页任务";
    byId("mission-text").textContent = current.experiments[0].challenge || "预测实验输出，再修改一个条件，用自己的话解释检查通过和未证明的事项。";
    byId("tutorial-files").replaceChildren();
    byId("tutorial-files").open = false;
    byId("tutorial-files").hidden = !current.practicalFiles?.length;
    if (current.practicalFiles?.length) {
      byId("tutorial-files").append(textElement("summary","选做：下载本地与真实组件实操"),
        textElement("p","网页主线不需要这些文件。想验证真实 Node/Python、SQLite 或 MCP 时，可下载到仓库 examples/tutorials/，按讲义命令运行。"));
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
      const branch=current.mindmap.branches[index];
      node.querySelector("b").textContent = branch.title+"："+branch.points[0];
      node.querySelector("small").textContent = branch.points[1];
      node.querySelector(".map-tag").textContent = ["START", "FOLLOW", "CHECK"][index];
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
    button.addEventListener("click", () => selectTab(button.dataset.tab, true));
    button.addEventListener("keydown", event => {
      let target = null;
      const index = tabs.indexOf(button.dataset.tab);
      if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft") target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === "Home") target = tabs[0];
      if (event.key === "End") target = tabs[tabs.length - 1];
      if (target) { event.preventDefault(); selectTab(target, true); }
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
      if (item.challenge) card.append(textElement("p","这次只改一件事：" + item.challenge,"browser-challenge"));
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
      shell.append(header, editor, toolbar, textElement("div", "CONSOLE / 浏览器实际运行", "output-label"), output);
      card.append(shell);
      addHint(card, item.hint);
      card.append(textElement("div", "观察方向：" + item.expected, "expected"));
      textareaField(card, "observe-" + item.id, "观察与证据边界", state.observations[item.id],
        "实际输出是什么？与预测有什么不同？哪些事情仍未被证明？", 6000,
        value => { state.observations[item.id] = value; });
      if (item.level === "advanced") {
        const advanced = textElement("details",undefined,"advanced-experiment");
        advanced.append(textElement("summary","进阶实验："+item.title),card);
        byId("experiments").append(advanced);
      } else byId("experiments").append(card);
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
        if (message.type === "done") finish(message.checks ? "执行结束 · " + message.checks + " 项检查通过" : "执行结束", false, true);
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
      card.append(caption, answer);
      const reference = textElement("details", undefined, "teacher-answer");
      reference.append(textElement("summary","参考答案与老师讲评（建议先思考）"));
      const explanation = textElement("div", undefined, "article-body");
      // Only authored, escaped build-time teaching HTML goes here, never drafts.
      explanation.innerHTML = item.solutionHtml;
      reference.append(explanation);card.append(reference);
      if(item.level==="advanced") {
        const optional=textElement("details",undefined,"advanced-experiment");
        optional.append(textElement("summary","进阶选做："+item.title),card);byId("checkpoints").append(optional);
      } else byId("checkpoints").append(card);
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
          if(item.level!=="advanced") state.submitted = false;
          renderQuizResults(); persist();
        });
        label.append(input, textElement("span", String.fromCharCode(65 + optionIndex) + ".", "option-letter"),
          textElement("span", option));
        options.append(label);
      });
      const explanation = textElement("div", undefined, "quiz-explanation");
      explanation.id = "explanation-" + item.id; explanation.hidden = true;
      fieldset.append(options, explanation);
      if(item.level==="advanced") {
        const optional=textElement("details",undefined,"advanced-experiment");
        optional.append(textElement("summary","进阶选做题："+item.id),fieldset);byId("quiz-questions").append(optional);
      } else byId("quiz-questions").append(fieldset);
    });
    renderQuizResults();
  }
  function renderQuizResults() {
    const grade = gradeQuiz(state.answers, requiredItems(quiz));
    byId("quiz-result").hidden = !state.submitted;
    for (const item of quiz) {
      const explanation = byId("explanation-" + item.id);
      explanation.hidden = !state.submitted || !Number.isInteger(state.answers[item.id]);
      if (explanation.hidden) continue;
      const correct = state.answers[item.id] === item.answer;
      explanation.classList.toggle("incorrect", !correct);
      explanation.replaceChildren(textElement("p",(correct ? "回答正确。" : "再想一想。") + "参考选择：" +
        String.fromCharCode(65 + item.answer) + "。" + item.explanation));
      const walkthrough=textElement("div",undefined,"teacher-quiz-detail");
      walkthrough.append(textElement("strong","老师讲评："));
      const body=textElement("div",undefined,"article-body");
      body.innerHTML=item.solutionHtml;walkthrough.append(body);explanation.append(walkthrough);
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
    const grade = gradeQuiz(state.answers, requiredItems(quiz));
    if (grade.answered !== grade.total) {
      const unanswered = grade.items.find(item => !item.answered);
      toast("还有 " + (grade.total - grade.answered) + " 道入门题未选择，请先完成。");
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
