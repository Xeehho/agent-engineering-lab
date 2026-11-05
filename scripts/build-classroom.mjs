import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { renderMarkdown, escapeHtml } from "../classroom/markdown.mjs";
import { experiments, checkpoints, quiz } from "../classroom/content.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = path => readFile(resolve(root, path), "utf8");
const [template, css, app, core, lecture, notes] = await Promise.all([
  read("classroom/index.template.html"), read("classroom/classroom.css"), read("classroom/app.js"),
  read("classroom/core.mjs"), read("course/stage-01/lessons/01-success-contracts.md"),
  read("course/stage-01/notes/01-quick-reference.md"),
]);
const lectureBody = lecture.slice(lecture.indexOf("## 本课目标"));
const notesBody = notes.slice(notes.indexOf("## 五个需要"));
const headings = [...lectureBody.matchAll(/^## (.+)$/gm)].map(match => match[1]);
const toc = headings.map((title, index) => '<a href="#section-' + index + '">' + escapeHtml(title) + "</a>").join("\n");
const safeJson = value => JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
const javascript = app.replace("// __CORE__", () => core.replace(/^export /gm, ""))
  .replace("/*__CONTENT__*/", () => safeJson({ experiments, checkpoints, quiz }));
if (/<\/script/i.test(javascript)) throw new Error("Inline script contains an unsafe closing tag");
const html = template.replace("/*__CSS__*/", () => css)
  .replace("/*__JS__*/", () => javascript)
  .replace("__LECTURE__", () => renderMarkdown(lectureBody, "course/stage-01/lessons/01-success-contracts.md"))
  .replace("__NOTES__", () => renderMarkdown(notesBody, "course/stage-01/notes/01-quick-reference.md").replaceAll('id="section-', 'id="note-section-'))
  .replace("__TOC__", () => toc);
if (/__(LECTURE|NOTES|TOC|CORE|CONTENT|CSS|JS)__/.test(html)) throw new Error("Unresolved classroom template marker");
const target = resolve(root, "public/learn.html");
if (process.argv.includes("--check")) {
  if (await readFile(target, "utf8") !== html)
    throw new Error("public/learn.html is stale. Run npm run classroom:build.");
  console.log("Standalone classroom matches its source material.");
  process.exit(0);
}
await mkdir(dirname(target), { recursive: true });
await writeFile(target, html, "utf8");
console.log("Generated public/learn.html (" + Buffer.byteLength(html) + " bytes), all assets embedded.");
