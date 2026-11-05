import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { renderMarkdown, escapeHtml } from "../classroom/markdown.mjs";
import { lessons, stages } from "../course/curriculum.mjs";
import { courseMaterials } from "./course-materials.mjs";
import { parseTutorial } from "./tutorial-materials.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = path => readFile(resolve(root, path), "utf8");
const generated = courseMaterials(lessons, stages);
const practicalFiles = new Map();
for (const item of lessons.filter(item => item.tutorial)) {
  const detailed = await read(item.tutorial.path);
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
const [template, css, app, core, knowledgeMap] = await Promise.all([
  read("classroom/index.template.html"), read("classroom/classroom.css"), read("classroom/app.js"),
  read("classroom/core.mjs"), read("course/knowledge-map.md"),
]);
const catalog = [];
for (const item of lessons) {
  const lecture = generated.get(item.lecturePath) ?? await read(item.lecturePath);
  const notes = generated.get(item.notesPath) ?? await read(item.notesPath);
  const withoutTitle = text => text.replace(/^# [^\n]*\n/,"").trim();
  const lectureBody = withoutTitle(lecture);
  const notesBody = withoutTitle(notes);
  const headings = [...lectureBody.matchAll(/^## (.+)$/gm)].map(match => match[1]);
  catalog.push({ ...item,
    practicalFiles: practicalFiles.get(item.id) || [],
    lectureHtml: renderMarkdown(lectureBody, item.lecturePath),
    notesHtml: renderMarkdown(notesBody, item.notesPath).replaceAll('id="section-', 'id="note-section-'),
    tocHtml: headings.map((title, index) => '<a href="#section-' + index + '">' + escapeHtml(title) + "</a>").join("\n"),
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
  .replace("/*__CONTENT__*/", () => safeJson({ lessons: catalog, stages }));
if (/<\/script/i.test(javascript)) throw new Error("Inline script contains an unsafe closing tag");
const overview = renderMarkdown(knowledgeMap.slice(knowledgeMap.indexOf("## ")), "course/knowledge-map.md")
  .replaceAll('id="section-', 'id="map-section-');
const html = template.replace("/*__CSS__*/", () => css)
  .replace("/*__JS__*/", () => javascript)
  .replace("__LECTURE__", () => catalog[0].lectureHtml)
  .replace("__NOTES__", () => catalog[0].notesHtml)
  .replace("__TOC__", () => catalog[0].tocHtml)
  .replace("__SIDEBAR__", () => stageNav).replace("__OVERVIEW__", () => overview);
if (/__(LECTURE|NOTES|TOC|SIDEBAR|OVERVIEW|CORE|CONTENT|CSS|JS)__/.test(html)) throw new Error("Unresolved classroom template marker");
await emit("public/learn.html", html);
console.log((checking ? "Verified" : "Generated") + " " + lessons.length + " lessons / " + stages.length +
  " stages, " + generated.size + " companion files; standalone HTML " + Buffer.byteLength(html) + " bytes.");
