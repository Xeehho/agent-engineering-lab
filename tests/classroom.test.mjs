import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { Worker } from "node:worker_threads";
import vm from "node:vm";
import { experiments, checkpoints, quiz } from "../classroom/content.mjs";
import { emptyState, normalizeState, emptyBook, normalizeBook, gradeQuiz, summarizeProgress, exportAnswers, classroomWorker } from "../classroom/core.mjs";
import { renderMarkdown } from "../classroom/markdown.mjs";
import { lessons, stages } from "../course/curriculum.mjs";
import { lessonMaps } from "../course/knowledge-graphs.mjs";
import { architectureViews,components } from "../course/architecture.mjs";

test("self-test grades actual choices and does not award unanswered points", () => {
  assert.equal(gradeQuiz({}, quiz).correct, 0);
  assert.equal(gradeQuiz({}, quiz).answered, 0);
  const answers = Object.fromEntries(quiz.map(item => [item.id, item.answer]));
  assert.equal(gradeQuiz(answers, quiz).correct, 6);
  answers.Q1 = 0;
  assert.equal(gradeQuiz(answers, quiz).correct, 5);
});

test("imports accept only bounded known course fields and valid choices", () => {
  const imported = normalizeState({ ...emptyState(), tab: "unknown", drafts: { C1: "x".repeat(13000), evil: "ignored" },
    codes: { assertion: "<script>alert(1)</script>" }, ran: ["json", "json", "evil"],
    answers: { Q1: -1, Q2: 999, Q3: 1, Q4: "0" }, masteryVerified: true, exam: { score: 100 } },
  experiments, checkpoints, quiz);
  assert.equal(imported.tab, "lecture");
  assert.equal(imported.drafts.C1.length, 12000);
  assert.equal(imported.drafts.evil, undefined);
  assert.equal(imported.codes.assertion, "<script>alert(1)</script>");
  assert.deepEqual(imported.ran, ["json"]);
  assert.deepEqual(imported.answers, { Q3: 1 });
  assert.equal(imported.masteryVerified, undefined);
  assert.equal(imported.exam, undefined);
  const incomplete = normalizeState({ ...emptyState(), submitted: true, answers: { Q1: 1 } }, experiments, checkpoints, quiz);
  assert.equal(incomplete.submitted, false);
  assert.throws(() => normalizeState({ schemaVersion: 2, course: "S1-L01" }, experiments, checkpoints, quiz));
  assert.throws(() => normalizeState({ schemaVersion: 1, course: "S2" }, experiments, checkpoints, quiz));
});

test("activity progress tracks drafting and submission, never teacher certification", () => {
  const state = emptyState();
  state.read = true;
  state.ran = experiments.map(item => item.id);
  state.drafts = Object.fromEntries(checkpoints.map(item => [item.id, "我的回答"]));
  state.answers = Object.fromEntries(quiz.map(item => [item.id, 0]));
  assert.equal(summarizeProgress(state, experiments, checkpoints, quiz).completed, 3);
  state.submitted = true;
  assert.equal(summarizeProgress(state, experiments, checkpoints, quiz).completed, 4);
  assert.equal(state.exam, undefined);
  state.drafts.C1 = "   ";
  assert.equal(summarizeProgress(state, experiments, checkpoints, quiz).drafted, 4);
});

test("Markdown export retains learner text and explicitly limits evidence", () => {
  const state = emptyState();
  state.drafts.C1 = "我的结论\n下一行";
  state.predictions.assertion = "预测";
  state.observations.assertion = "实际观察";
  state.personalNotes = "个人笔记";
  const markdown = exportAnswers(state, experiments, checkpoints, quiz);
  for (const text of ["我的结论\n下一行", "预测", "实际观察", "个人笔记", "待老师评阅", "无真实模型调用", "AI 协助范围"])
    assert.ok(markdown.includes(text), text);
});

test("teaching renderer escapes HTML, blocks script URLs, resolves repository links", () => {
  const html = renderMarkdown("## 标题\n\n<script>alert(1)</script>\n\n[速记](../notes/01.md)\n\n~~~js\nconsole.log('<img>');\n~~~", "course/stage-01/lessons/01.md");
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("https://github.com/Xeehho/agent-engineering-lab/blob/main/course/stage-01/notes/01.md"));
  assert.ok(html.includes("&lt;img&gt;"));
  assert.throws(() => renderMarkdown("[bad](javascript:alert)", "course/test.md"));
});

test("committed single-file HTML matches teaching sources, parses, and embeds all assets", async () => {
  execFileSync(process.execPath, ["scripts/build-classroom.mjs", "--check"], { cwd: new URL("../", import.meta.url) });
  const html = await readFile(new URL("../public/learn.html", import.meta.url), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  new vm.Script(scripts[0][1]);
  assert.ok(!/<script[^>]+src=|<link[^>]+stylesheet/.test(html));
  assert.ok(html.includes("connect-src 'none'"));
  assert.ok(html.includes("window.print()"));
  assert.equal(experiments.length, 4);
  assert.equal(checkpoints.length, 5);
  assert.equal(quiz.length, 6);
  assert.ok(html.includes("JSON.parse只解决JSON语法解析"));
});

async function runDemo(code, includeMetrics = false) {
  const worker = new Worker(
    'const {parentPort} = require("node:worker_threads"); global.self = global;' +
    'self.postMessage = value => parentPort.postMessage(value);' +
    "(" + classroomWorker.toString() + ")();" +
    'parentPort.on("message", data => self.onmessage({data}));',
    { eval: true });
  const lines = [];
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Demo deadline exceeded")), 2000);
      worker.on("error", error => { clearTimeout(timer); reject(error); });
      worker.on("message", message => {
        if (message.type === "log") lines.push(message.text);
        if (message.type === "error") { clearTimeout(timer); reject(new Error(message.text)); }
        if (message.type === "done") { clearTimeout(timer); resolve(includeMetrics ? {output:lines.join("\n"),checks:message.checks} : lines.join("\n")); }
      });
      worker.postMessage(code);
    });
  } finally { await worker.terminate(); }
}
test("all four editable demos execute the actual runner protocol", async () => {
  const output = [];
  for (const item of experiments) output.push(await runDemo(item.code));
  assert.match(output[0], /string[\s\S]*TypeError/);
  assert.match(output[1], /null => object/);
  assert.match(output[2], /status: 503[\s\S]*ok: false/);
  assert.match(output[3], /请增加深色模式[\s\S]*订单页白屏/);
});

test("all 31 lesson overviews have distinct topics, valid quizzes and stage coverage", () => {
  assert.equal(lessons.length, 31);
  assert.equal(stages.length, 8);
  assert.equal(new Set(lessons.map(item => item.id)).size, lessons.length);
  assert.equal(lessons.reduce((sum,item) => sum + item.quiz.length,0), 158);
  for (const item of lessons) {
    assert.ok(stages.some(stage => stage.id === item.stage), item.id);
    assert.ok(item.experiments.length >= 1, item.id);
    assert.ok(item.checkpoints.length >= 3, item.id);
    assert.ok(item.quiz.length >= 3, item.id);
    assert.equal(new Set(item.quiz.map(question => question.id)).size, item.quiz.length);
    for (const question of item.quiz) {
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4, item.id + " unique options");
      assert.ok(question.answer >= 0 && question.answer < 4);
      assert.ok(question.explanation.length > 8);
    }
    if (item.id !== "S1-L01") {
      assert.equal(item.sections.length, 3);
      assert.ok(item.sections.every(section => section[1].length > 85), item.id + " substantive sections");
      assert.ok(item.sources.length > 0);
      assert.ok(item.project.length > 25);
    }
  }
});

test("multi-lesson backup isolates identical question IDs and restores migrated legacy records", () => {
  const first = emptyState("S1-L01");
  first.drafts.C1 = "第一课回答";
  const second = emptyState("S2-L01");
  second.drafts.C1 = "工具课回答"; second.answers.Q1 = 2;
  const book = emptyBook(lessons);
  book.currentLesson = second.course;
  book.lessons[first.course] = first; book.lessons[second.course] = second;
  const restored = normalizeBook(JSON.parse(JSON.stringify(book)), lessons);
  assert.equal(restored.lessons["S1-L01"].drafts.C1, "第一课回答");
  assert.equal(restored.lessons["S2-L01"].drafts.C1, "工具课回答");
  assert.equal(restored.currentLesson, "S2-L01");
  assert.ok(exportAnswers(second, lessons[6].experiments, lessons[6].checkpoints, lessons[6].quiz).startsWith("# S2-L01"));
  const migrated = normalizeBook(first, lessons);
  assert.equal(migrated.lessons["S1-L01"].drafts.C1, first.drafts.C1);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.lessons["S2-L01"], undefined);
  assert.throws(() => normalizeBook({schemaVersion:9}, lessons));
  assert.throws(() => normalizeBook({...book,lessons:{"S2-L01":first}}, lessons));
});

test("all course demonstrations really run without network, keys or external dependencies", async () => {
  for (const item of lessons) {
    for (const demo of item.experiments) {
      const result = await runDemo(demo.code, true);
      assert.ok(result.output.trim().length > 0, item.id + ":" + demo.id);
      if (item.id !== "S1-L01") assert.ok(result.checks > 0,item.id+" checks really executed");
      assert.ok(!/\b(fetch|XMLHttpRequest)\s*\(/.test(demo.code), item.id);
    }
  }
});

test("each beginner lesson documents the actual output of its minimal program",async()=>{
  for(const lesson of lessons) {
    const source=(await readFile(new URL('../'+lesson.beginner.lessonPath,import.meta.url),'utf8')).replaceAll('\r\n','\n');
    const afterCode=source.split('~~~js beginner='+lesson.id+'.mjs\n~~~')[1];
    assert.ok(afterCode,lesson.id+' includes the same source used by the runner');
    const expected=afterCode.match(/~~~text\n([\s\S]+?)\n~~~/)?.[1];
    assert.ok(expected,lesson.id+' documented stdout');
    const actual=await runDemo(lesson.experiments.find(e=>e.id==='start').code);
    assert.equal(actual,expected,lesson.id+' beginner stdout');
  }
});

test("browser assertion failures and rejection mismatches stop the exercise",async () => {
  await assert.rejects(runDemo("assert.equal(1,2);"),/检查失败/);
  await assert.rejects(runDemo('await assert.rejects(Promise.resolve("ok"));'),/检查失败/);
  const result = await runDemo('assert.deepEqual({a:[1,2]},{a:[1,2]}); await assert.rejects(Promise.reject(new Error("EXPECTED")),/EXPECTED/); console.log("done");',true);
  assert.equal(result.checks,2);
});

test("generated optional Node companions import their assertion dependency and execute",() => {
  for (const item of lessons) {
    const output = execFileSync(process.execPath,["examples/course/"+item.id+".mjs"],{
      cwd:new URL("../",import.meta.url),encoding:"utf8",timeout:5000,
      stdio:["ignore","pipe","pipe"],
    });
    assert.ok(output.trim(),item.id+" Node companion output");
  }
});

test("teaching code has file labels, copy controls, optional local blocks and correct table-of-contents anchors",async () => {
  const html = await readFile(new URL("../public/learn.html",import.meta.url),"utf8");
  const catalog = JSON.parse(html.match(/const material = (.+);\n  const catalog/)[1]).lessons;
  for (const item of catalog) {
    const headings = new Map([...item.lectureHtml.matchAll(/<h2 id="(section-\d+)">([^<]+)<\/h2>/g)].map(match=>[match[1],match[2]]));
    for (const anchor of item.tocHtml.matchAll(/href="#(section-\d+)">([^<]+)<\/a>/g)) {
      assert.equal(headings.get(anchor[1]),anchor[2],item.id+" matching heading");
    }
    if (item.id==="S1-L01") continue;
    assert.ok(item.advancedLectureHtml.includes('class="optional-code"'));
    assert.ok(!item.advancedLectureHtml.includes('class="optional-code" open'));
    assert.ok(item.lectureHtml.includes('class="copy-code"'));
    assert.ok(item.advancedLectureHtml.includes("代码阅读"));
    assert.ok(item.lectureHtml.includes("名字与字段") || item.lectureHtml.includes("名字与字段从哪里来"));
    assert.ok(item.experiments[0].challenge);
  }
});

test("entry experiments are required without discarding old optional code or learner records",()=>{
  for(const lesson of lessons) {
    const core=lesson.experiments.filter(e=>e.level!=="advanced");
    assert.equal(core.length,1,lesson.id);
    assert.equal(core[0].id,"start");
    const old=lesson.experiments.find(e=>e.level==="advanced");
    const state=normalizeState({...emptyState(lesson.id),codes:{[old.id]:"我的旧代码"},ran:["start"]},lesson.experiments,lesson.checkpoints,lesson.quiz,lesson.id);
    assert.equal(state.codes[old.id],"我的旧代码");
    assert.equal(summarizeProgress(state,lesson.experiments,lesson.checkpoints,lesson.quiz).parts[1],true);
  }
});

test("mind maps link known lessons and architecture edges/steps reference existing components",()=>{
  for(const lesson of lessons) {
    const map=lessonMaps[lesson.id];
    assert.equal(map.branches.length,4);
    assert.ok(map.branches.every(branch=>branch.points.length===2));
    for(const id of [...map.prerequisites,...map.next]) assert.ok(lessons.some(item=>item.id===id));
    for(const id of map.components) assert.ok(components[id]);
  }
  for(const view of architectureViews) {
    const ids=new Set(view.nodes.map(n=>n.id));
    for(const [from,to,label] of view.edges) {assert.ok(ids.has(from));assert.ok(ids.has(to));assert.ok(label);}
    for(const [id,text] of view.steps) {assert.ok(ids.has(id));assert.ok(text);}
  }
});

test("generated lesson and project materials expose sources and preserve formal exam boundary", async () => {
  for (const stage of stages) {
    const blueprint = await readFile(new URL("../assessments/stage-" + stage.id + "/exam-blueprint.md", import.meta.url), "utf8");
    assert.ok(blueprint.includes("30") && blueprint.includes("50") && blueprint.includes("20"));
  }
  for (const item of lessons.slice(1)) {
    const lecture = await readFile(new URL("../" + item.lecturePath, import.meta.url), "utf8");
    assert.ok(lecture.includes(item.project));
    assert.ok(lecture.includes("不代表学习者"));
    assert.ok(lecture.includes(item.sources[0][1]));
    const checkpoint = await readFile(new URL("../" + item.checkpointPath, import.meta.url), "utf8");
    assert.ok(checkpoint.includes(item.checkpoints[0].text));
  }
});
