// Small escaped renderer for this repository's teaching Markdown subset.
// Raw HTML is always text. Only code, links, bold, headings, lists and tables are supported.
export const escapeHtml = value => String(value).replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export function renderMarkdown(markdown, sourcePath) {
  const inline = value => {
    const tokens = [];
    const token = html => "\u0000" + (tokens.push(html) - 1) + "\u0000";
    let text = value.replace(new RegExp(String.fromCharCode(96) + "([^" + String.fromCharCode(96) + "]+)" + String.fromCharCode(96), "g"),
      (_, code) => token("<code>" + escapeHtml(code) + "</code>"));
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, target) => {
      const url = new URL(target, "https://github.com/Xeehho/agent-engineering-lab/blob/main/" + sourcePath);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported Markdown link");
      return token('<a href="' + escapeHtml(url.href) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label) + "</a>");
    });
    text = escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
  };
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  let html = "", index = 0, heading = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index++; continue; }
    if (line.startsWith("~~~")) {
      const language = line.slice(3).trim();
      const code = [];
      index++;
      while (index < lines.length && !lines[index].startsWith("~~~")) code.push(lines[index++]);
      if (index === lines.length) throw new Error("Unclosed code fence");
      const metadata = language.match(/^(\S+?)(?: (file|expect)=([A-Za-z0-9._-]+))?$/);
      const codeLanguage = metadata?.[1] || "text";
      const sourceFile = metadata?.[3];
      const caption = (sourceFile ? sourceFile + " · " : "") + codeLanguage + " · " + code.length + " 行";
      const codeLines = code.map(line => '<span class="code-line">' + escapeHtml(line) + "</span>").join("");
      const figure = '<figure class="code-block"><figcaption><span>' + escapeHtml(caption) +
        '</span><button type="button" class="copy-code">复制代码</button></figcaption>' +
        '<pre tabindex="0" aria-label="' + escapeHtml(caption) + '"><code>' + codeLines + "</code></pre></figure>";
      const setupCommand = ["powershell","bash","sh","shell"].includes(codeLanguage);
      html += sourceFile || setupCommand ? '<details class="optional-code"><summary>' +
        (setupCommand ? "选做实操：运行命令" : metadata[2] === "expect" ? "选做实操：预期输出" : "选做实操：完整本地代码") +
        " · " + escapeHtml(sourceFile || codeLanguage) + "</summary>" + figure + "</details>" : figure;
      index++; continue;
    }
    const title = line.match(/^(#{1,3}) (.+)$/);
    if (title) {
      const level = Math.max(2, title[1].length);
      html += "<h" + level + ' id="section-' + heading++ + '">' + inline(title[2]) + "</h" + level + ">";
      index++; continue;
    }
    if (line.startsWith("|")) {
      const rows = [];
      while (index < lines.length && lines[index].startsWith("|")) rows.push(lines[index++]);
      const cells = row => row.slice(1, -1).split("|").map(cell => cell.trim());
      html += '<div class="table-wrap" tabindex="0" role="region" aria-label="课程对照表"><table><thead><tr>' +
        cells(rows[0]).map(cell => "<th>" + inline(cell) + "</th>").join("") + "</tr></thead><tbody>";
      for (const row of rows.slice(2)) html += "<tr>" + cells(row).map(cell => "<td>" + inline(cell) + "</td>").join("") + "</tr>";
      html += "</tbody></table></div>"; continue;
    }
    const item = line.match(/^(- |\d+\. )(.+)$/);
    if (item) {
      const tag = line.startsWith("- ") ? "ul" : "ol";
      html += "<" + tag + ">";
      while (index < lines.length) {
        const next = lines[index].match(tag === "ul" ? /^- (.+)$/ : /^\d+\. (.+)$/);
        if (!next) break;
        html += "<li>" + inline(next[1]) + "</li>"; index++;
      }
      html += "</" + tag + ">"; continue;
    }
    const paragraph = [line];
    index++;
    while (index < lines.length && lines[index].trim() && !/^(#|~~~|\||- |\d+\. )/.test(lines[index]))
      paragraph.push(lines[index++]);
    html += "<p>" + inline(paragraph.join("\n")) + "</p>";
  }
  return html;
}
