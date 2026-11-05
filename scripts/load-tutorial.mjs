import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { browserGuidance } from "../course/browser-guidance.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

// 教程源码引用独立代码文件；生成的 Markdown 和 HTML 都展开为完整代码。
export async function loadTutorial(entry, lessonId) {
  let markdown = await readFile(resolve(repositoryRoot, entry.path), "utf8");
  const guidance = browserGuidance[lessonId];
  const firstHeadingEnd = markdown.indexOf("\n");
  markdown = markdown.slice(0, firstHeadingEnd) + "\n\n" +
    "**网页主线：直接阅读讲解 → 动手实验 → 随堂练习 → 公开自测 → 复习速记。无需启动项目、安装依赖或提供 API Key。**\n\n" +
    "本课网页任务：" + guidance.challenge + "\n\n" +
    "网页实验范围：" + guidance.scope + "\n\n" +
    "**选做实操说明：**下面涉及 Node、Python、数据库或 SDK 的环境、命令和完整文件供进阶使用，不是阅读本课的前置条件。\n" +
    markdown.slice(firstHeadingEnd);
  const walkthrough = await readFile(
    resolve(repositoryRoot, "course/tutorials/walkthrough", lessonId + ".md"),
    "utf8",
  );
  const secondSection = markdown.search(/^## 2[.．]/m);
  if (secondSection < 0) throw new Error("Missing concept-to-code transition: " + lessonId);
  markdown = markdown.slice(0,secondSection) + walkthrough.trimEnd() + "\n\n" + markdown.slice(secondSection);
  const references = [...markdown.matchAll(/^~~~(\S+) include=([A-Za-z0-9_-]+\.(?:mjs|py))\n~~~\s*$/gm)];

  for (const reference of references) {
    const fileName = reference[2];
    if (!fileName.startsWith(lessonId + "." ) && !fileName.startsWith(lessonId + "-")) {
      throw new Error("Tutorial references another lesson: " + fileName);
    }
    const code = await readFile(resolve(repositoryRoot, "course/tutorials/code", fileName), "utf8");
    markdown = markdown.replace(reference[0],
      "### 完整实操文件：" + fileName + "\n\n" +
      "~~~" + reference[1] + " file=" + fileName + "\n" + code.trimEnd() + "\n~~~");
  }

  return markdown;
}
