import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { renderMarkdown, escapeHtml } from "../classroom/markdown.mjs";
import { lessons, stages } from "../course/curriculum.mjs";
import { courseMaterials } from "./course-materials.mjs";
import { parseTutorial } from "./tutorial-materials.mjs";
import { loadTutorial } from "./load-tutorial.mjs";
import { lessonMaps } from "../course/knowledge-graphs.mjs";
import { architectureViews } from "../course/architecture.mjs";
import { mindmapSvg, architectureSvg } from "../classroom/diagrams.mjs";
import { loadTeacher } from "./load-teacher.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = path => readFile(resolve(root, path), "utf8");
const generated = courseMaterials(lessons, stages);
const practicalFiles = new Map();
const foundationLectures = new Map();
const advancedLectures = new Map();
const teacherNotes = new Map();
for (const lesson of lessons) {
  const teacher = await loadTeacher(lesson);
  teacherNotes.set(lesson.id,teacher);
  generated.set('course/stage-'+lesson.stage+'/answers/'+lesson.id+'.md',teacher.markdown);
}
for (const item of lessons.filter(item => item.tutorial)) {
  const detailed = await loadTutorial(item.tutorial, item.id);
  const reference = item.sources.map(source=>"- ["+source[0]+"]("+source[1]+")").join("\n");
  generated.set(item.lecturePath, detailed.trimEnd() + "\n\n## 原阶段项目约定\n\n" + item.project + "\n\n## 补充官方来源\n\n" + reference + "\n");
  const files = parseTutorial(detailed, item.id);
  if (!files.some(file => file.name === item.tutorial.primary && file.expected))
    throw new Error("Primary tutorial must have expected output: " + item.id);
  practicalFiles.set(item.id, files);
  for (const file of files) {
    generated.set("examples/tutorials/" + file.name, file.code);
    if (file.expected) generated.set("examples/tutorials/" + file.name + ".expected.txt", file.expected);
  }
  const noteMarker = "## 单页速记\n";
  const noteStart = detailed.indexOf(noteMarker);
  if (noteStart >= 0) {
    const remaining = detailed.slice(noteStart + noteMarker.length);
    const end = remaining.indexOf("\n## ");
    generated.set(item.notesPath, "# " + item.id + " 速记\n\n" + (end<0?remaining:remaining.slice(0,end)).trim() + "\n");
  }
}
for (const item of lessons.filter(item=>item.beginner)) {
  const beginner = item.beginner;
  let main = await read(beginner.lessonPath);
  const code = await read(beginner.codePath);
  main = main.replace(/^~~~js beginner=[A-Za-z0-9_-]+\.mjs\n~~~\s*$/m,
    "~~~js\n"+code.trimEnd()+"\n~~~");
  if (/beginner=/.test(main)) throw new Error("Unresolved beginner code in "+item.id);
  const advanced = beginner.advancedPath ? await read(beginner.advancedPath) :
    generated.get(item.lecturePath) ?? await read(item.lecturePath);
  foundationLectures.set(item.id,main);
  advancedLectures.set(item.id,advanced);
  generated.set(item.lecturePath,main.trimEnd()+"\n\n## 进阶：完整机制与工程边界\n\n"+
    advanced.replace(/^# [^\n]*\n/,"").trim()+"\n");
}
for (const item of lessons) {
  const map=lessonMaps[item.id];
  if(!map || map.branches.length!==4) throw new Error('Missing lesson map: '+item.id);
  for(const id of [...map.prerequisites,...map.next])
    if(!lessons.some(lesson=>lesson.id===id)) throw new Error('Unknown related lesson: '+id);
  generated.set('course/maps/'+item.id+'.svg',mindmapSvg(item.id,item.title,map));
  const summary='# '+item.id+' 思维导图与速记\n\n'+map.question+'\n\n'+map.branches.map(b=>'## '+b.title+'\n\n'+b.points.map(p=>'- '+p).join('\n')).join('\n\n')+
    '\n\n## 知识联系\n\n先修：'+(map.prerequisites.join('、')||'能读懂JavaScript函数、对象、数组和条件判断即可。')+
    '\n\n继续应用：'+(map.next.join('、')||'回到毕业项目与阶段答辩，按证据补齐能力。')+
    '\n\n图源与讲义：Xeehho · CC BY 4.0。公开练习不代表学习者通过正式考试。\n';
  generated.set('course/maps/'+item.id+'.md',summary);
  generated.set(item.notesPath,summary.replace('思维导图与速记','入门速记'));
}
for(const view of architectureViews) {
  generated.set('course/maps/architecture-'+view.id+'.svg',architectureSvg(view));
  generated.set('course/maps/architecture-'+view.id+'.md','# '+view.title+'\n\n'+view.summary+'\n\n'+
    '```mermaid\nflowchart TD\n'+view.nodes.map(n=>'  '+n.id.replaceAll('-','_')+'["'+n.title+'"]\n').join('')+
    view.edges.map(([a,b,label])=>'  '+a.replaceAll('-','_')+' -->|"'+label+'"| '+b.replaceAll('-','_')+'\n').join('')+'```\n\n'+
    view.nodes.map(n=>'## '+n.title+'\n\n输入：'+n.input+'\n\n输出：'+n.output+'\n\n边界：'+n.rule+'\n').join('\n')+'\nXeehho · CC BY 4.0\n');
}
const checking = process.argv.includes("--check");
async function emit(path, content) {
  const target = resolve(root, path);
  if (checking) {
    if (await readFile(target, "utf8") !== content) throw new Error(path + " is stale. Run npm run classroom:build.");
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}
for (const [path, content] of generated) await emit(path, content);
const overviewData = {
  stats: {
    stages: stages.length, lessons: lessons.length,
    experiments: lessons.reduce((sum, lesson) => sum + lesson.experiments.length, 0),
    coreExperiments: lessons.reduce((sum, lesson) => sum + lesson.experiments.filter(e=>e.level!=="advanced").length, 0),
    maps: Object.keys(lessonMaps).length,
    checkpoints: lessons.reduce((sum, lesson) => sum + lesson.checkpoints.length, 0),
    quizzes: lessons.reduce((sum, lesson) => sum + lesson.quiz.length, 0),
    detailed: lessons.filter(lesson => lesson.contentLevel === "detailed").length,
    brief: lessons.filter(lesson => lesson.contentLevel === "brief").length,
  },
  stages: stages.map(stage => ({
    id: stage.id, title: stage.title, deliverable: stage.deliverable,
    lessons: lessons.filter(lesson => lesson.stage === stage.id).map(lesson => ({id:lesson.id,title:lesson.title,contentLevel:lesson.contentLevel})),
  })),
};
await emit("src/generated/course-overview.ts", "// Generated from course/curriculum.mjs. Run npm run classroom:build.\nexport const courseOverview = " + JSON.stringify(overviewData, null, 2) + " as const;\n");
const [template, css, app, core, knowledgeMap,mitLicense,ccLicense] = await Promise.all([
  read("classroom/index.template.html"), read("classroom/classroom.css"), read("classroom/app.js"),
  read("classroom/core.mjs"), read("course/knowledge-map.md"),read("LICENSE"),read("LICENSES/CC-BY-4.0.txt"),
]);
const catalog = [];
for (const item of lessons) {
  const lecture = foundationLectures.get(item.id) ?? generated.get(item.lecturePath) ?? await read(item.lecturePath);
  const notes = generated.get(item.notesPath) ?? await read(item.notesPath);
  const withoutTitle = text => text.replace(/^# [^\n]*\n/,"").trim();
  const lectureBody = withoutTitle(lecture);
  const notesBody = withoutTitle(notes);
  // renderMarkdown 为 h2/h3 都分配编号；目录只展示 h2，但使用相同的实际编号。
  const headings = [...lectureBody.matchAll(/^(#{2,3}) (.+)$/gm)]
    .map((match,index) => ({level:match[1].length,title:match[2],index}))
    .filter(heading => heading.level === 2);
  catalog.push({ ...item,
    checkpoints:teacherNotes.get(item.id).checkpoints,
    quiz:teacherNotes.get(item.id).quiz,
    teacherOverviewHtml:teacherNotes.get(item.id).overviewHtml,
    teacherMarkdown:teacherNotes.get(item.id).markdown,
    mindmap:{...lessonMaps[item.id],svg:mindmapSvg(item.id,item.title,lessonMaps[item.id]),markdown:generated.get('course/maps/'+item.id+'.md')},
    practicalFiles: practicalFiles.get(item.id) || [],
    lectureHtml: renderMarkdown(lectureBody, item.lecturePath),
    advancedLectureHtml: advancedLectures.has(item.id) ?
      renderMarkdown(withoutTitle(advancedLectures.get(item.id)),item.lecturePath).replaceAll('id="section-','id="advanced-section-') : "",
    notesHtml: renderMarkdown(notesBody, item.notesPath).replaceAll('id="section-', 'id="note-section-'),
    tocHtml: headings.map(heading => '<a href="#section-' + heading.index + '">' + escapeHtml(heading.title) + "</a>").join("\n"),
  });
}
const stageNav = stages.map(stage => '<details class="stage-group"' + (stage.id === "01" ? " open" : "") +
  ' data-stage="' + stage.id + '"><summary><span>' + stage.id + "</span> " + escapeHtml(stage.title) +
  '<small>' + catalog.filter(item => item.stage === stage.id).length + ' 课</small></summary><div class="stage-lessons">' +
  catalog.filter(item => item.stage === stage.id).map(item =>
    '<button class="lesson-link' + (item.id === catalog[0].id ? " current" : "") + '" data-lesson="' + item.id +
    '"><span class="lesson-number">' + item.id.split("-L")[1] + "</span><span><b>" + escapeHtml(item.title) +
    "</b><small>" + item.id + " · " + (item.contentLevel === "detailed" ? "详细教程" : "简版待扩写") + "</small></span></button>").join("") +
  "</div></details>").join("\n");
const safeJson = value => JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
const javascript = app.replace("// __CORE__", () => core.replace(/^export /gm, ""))
  .replace("/*__CONTENT__*/", () => safeJson({ lessons: catalog, stages,architecture:architectureViews.map(v=>({...v,svg:architectureSvg(v)})) }));
if (/<\/script/i.test(javascript)) throw new Error("Inline script contains an unsafe closing tag");
const overview = renderMarkdown(knowledgeMap.slice(knowledgeMap.indexOf("## ")), "course/knowledge-map.md")
  .replaceAll('id="section-', 'id="map-section-');
const html = template.replace("/*__CSS__*/", () => css)
  .replace("/*__JS__*/", () => javascript)
  .replace("__LECTURE__", () => catalog[0].lectureHtml)
  .replace("__NOTES__", () => catalog[0].notesHtml)
  .replace("__TOC__", () => catalog[0].tocHtml)
  .replace("__SIDEBAR__", () => stageNav).replace("__OVERVIEW__", () => overview)
  .replace("__LICENSE__",()=>'<p>Agent Engineering Lab — Xeehho。程序与可执行代码：MIT；原创课程、练习、脑图和架构说明：CC BY 4.0。改编请保留署名、许可链接并说明修改。第三方资料、商标与头像不在此授权范围内。</p><p><a href="https://github.com/Xeehho/agent-engineering-lab/blob/main/LICENSING.md" target="_blank" rel="noopener noreferrer">详细许可范围</a></p><details><summary>MIT License 全文</summary><pre>'+escapeHtml(mitLicense)+'</pre></details><details><summary>CC BY 4.0 全文</summary><pre>'+escapeHtml(ccLicense)+'</pre></details>');
if (/__(LECTURE|NOTES|TOC|SIDEBAR|OVERVIEW|CORE|CONTENT|CSS|JS)__/.test(html)) throw new Error("Unresolved classroom template marker");
await emit("public/learn.html", html);
console.log((checking ? "Verified" : "Generated") + " " + lessons.length + " lessons / " + stages.length +
  " stages, " + generated.size + " companion files; standalone HTML " + Buffer.byteLength(html) + " bytes.");
