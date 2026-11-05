import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { lessons } from "../course/curriculum.mjs";
import { tutorials } from "../course/tutorials/catalog.mjs";
import { parseTutorial } from "../scripts/tutorial-materials.mjs";
import { loadTutorial } from "../scripts/load-tutorial.mjs";

const root = new URL("../",import.meta.url);
const read = path => readFile(new URL(path,root),"utf8");
const normalize = text => text.replaceAll("\r\n","\n");

test("tutorial extraction rejects duplicate, orphan and escaping assets",() => {
  assert.throws(() => parseTutorial("~~~js file=../evil.mjs\nx\n~~~","S1-L02"));
  assert.throws(() => parseTutorial("~~~js file=S1-L02.mjs\nx\n~~~\n~~~text expect=S1-L02-missing.mjs\nx\n~~~","S1-L02"),/Orphan/);
  assert.throws(() => parseTutorial("~~~js file=S1-L02.mjs\nx\n~~~\n~~~text expect=S1-L02.mjs\nx\n~~~\n~~~text expect=S1-L02.mjs\nx\n~~~","S1-L02"),/Duplicate/);
});

test("compiled classroom preserves tutorial introductions, quick notes and downloadable source",async () => {
  const html = await read("public/learn.html");
  const match = html.match(/const material = (.+);\n  const catalog/);
  assert.ok(match,"compiled course catalog");
  const catalog = JSON.parse(match[1]).lessons;
  assert.equal(catalog.filter(item => item.contentLevel==="detailed").length,31);
  for (const [id,entry] of Object.entries(tutorials)) {
    const raw = await loadTutorial(entry, id);
    const files = parseTutorial(raw,id);
    const compiled = catalog.find(item => item.id===id);
    assert.ok(compiled.lectureHtml.includes("不代表学习者"),id+" scope introduction");
    assert.ok(compiled.notesHtml.includes("<li>"),id+" readable quick notes");
    assert.deepEqual(compiled.practicalFiles,files);
    for (const file of files) {
      assert.equal(await read("examples/tutorials/"+file.name),file.code,id+" extracted source");
      if (file.expected) assert.equal(await read("examples/tutorials/"+file.name+".expected.txt"),file.expected);
    }
  }
  assert.equal(lessons[0].tutorial,null);
  assert.equal(Object.keys(tutorials).length,30);
});

for (const [id,entry] of Object.entries(tutorials)) {
  test(id+" local practical executes assertions and matches documented output",async () => {
    const files = parseTutorial(await loadTutorial(entry,id),id);
    const primary = files.find(file => file.name===entry.primary);
    assert.ok(primary?.expected,id+" expected stdout");
    const output = execFileSync(process.execPath,["scripts/run-tutorial.mjs",id],{
      cwd:root,encoding:"utf8",timeout:20000,maxBuffer:1024*1024,
      stdio:["ignore","pipe","pipe"]
    });
    assert.equal(normalize(output),primary.expected);
  });
}
