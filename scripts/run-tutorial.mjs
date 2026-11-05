import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { tutorials } from "../course/tutorials/catalog.mjs";
const root = fileURLToPath(new URL("../",import.meta.url));
const id = process.argv[2];
if (!tutorials[id]) {
  console.error("Choose a detailed tutorial: " + Object.keys(tutorials).join(", "));
  process.exit(1);
}
const primary = resolve(root,"examples/tutorials",tutorials[id].primary);
let command = process.execPath, args = [primary];
if (primary.endsWith(".py")) {
  const venv = resolve(root,process.platform==="win32"?".venv/Scripts/python.exe":".venv/bin/python");
  command = process.env.COURSE_PYTHON || (existsSync(venv)?venv:process.platform==="win32"?"py":"python3");
  args = [...(command==="py"?["-3"]:[]),primary];
}
const result = spawnSync(command,args,{cwd:root,stdio:"inherit",timeout:15000});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
