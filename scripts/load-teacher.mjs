// Loader code: MIT. Authored teaching explanations: CC BY 4.0.
import { readFile } from "node:fs/promises";
import { renderMarkdown } from "../classroom/markdown.mjs";

/**
 * Teacher notes are readable Markdown, keyed by the existing question IDs.
 * Missing, extra or duplicate IDs fail the build. Changes to a question's
 * meaning still require editorial review. No learner records are read here.
 */
export async function loadTeacher(lesson) {
  const path = "course/teacher/" + lesson.id + ".md";
  const source = await readFile(new URL("../" + path, import.meta.url), "utf8");
  return parseTeacher(source, lesson, path);
}

export function parseTeacher(raw, lesson, path = "course/teacher/" + lesson.id + ".md") {
  const source = raw.replaceAll("\r\n", "\n");
  const markers = [...source.matchAll(/^## ([A-Z]+\d+)\s*$/gm)];
  const questions = [...lesson.checkpoints, ...lesson.quiz];
  const knownIds = new Set(questions.map(question => question.id));
  const sections = new Map();
  for (const [index, marker] of markers.entries()) {
    const id = marker[1];
    if (!knownIds.has(id) || sections.has(id)) {
      throw new Error("Unknown or duplicate teacher section: " + lesson.id + "/" + id);
    }
    const body = source.slice(marker.index + marker[0].length,
      markers[index + 1]?.index ?? source.length).trim();
    if (body.length < 70) throw new Error("Teacher explanation is incomplete: " + lesson.id + "/" + id);
    sections.set(id, body);
  }
  for (const question of questions) {
    if (!sections.has(question.id)) throw new Error("Missing teacher answer: " + lesson.id + "/" + question.id);
    if (lesson.checkpoints.includes(question)) {
      for (const heading of ["### 参考回答", "### 推导与反例", "### 自查要点"]) {
        if (!sections.get(question.id).includes(heading)) {
          throw new Error("Missing " + heading + " in " + lesson.id + "/" + question.id);
        }
      }
    }
  }
  const overview = source.slice(0, markers[0].index).replace(/^# [^\n]*\n/, "").trim();
  const html = (body, prefix) => renderMarkdown(body, path)
    .replaceAll('id="section-', 'id="teacher-' + lesson.id + "-" + prefix + '-');
  const markdown = source.replace(/^## ([A-Z]+\d+)\s*$/gm, (_, id) => {
    const question = questions.find(item => item.id === id);
    const choice = question.options
      ? "\n\n"+question.options.map((option,index)=>"- "+String.fromCharCode(65+index)+". "+option).join("\n")+
        "\n\n参考选择：" + String.fromCharCode(65 + question.answer) + ". " + question.options[question.answer]
      : "";
    const code = question.code ? "\n\n~~~text\n"+question.code+"\n~~~" : "";
    return "## " + id + " · " + (question.question || question.title) + "\n\n题目：" +
      (question.question || question.text) + code + choice;
  })+"\n\nAgent Engineering Lab — Xeehho · 原创讲评 CC BY 4.0。https://creativecommons.org/licenses/by/4.0/\n";
  return {
    path, markdown, overviewHtml: html(overview, "overview"),
    checkpoints: lesson.checkpoints.map(question => ({...question,
      solutionHtml: html(sections.get(question.id), question.id)})),
    quiz: lesson.quiz.map(question => ({...question,
      solutionHtml: html(sections.get(question.id), question.id)})),
  };
}
