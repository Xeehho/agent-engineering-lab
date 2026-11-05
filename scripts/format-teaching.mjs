import { readdir, readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";

const checkOnly = process.argv.includes("--check");
let changed = 0;
for (const directory of ["course/tutorials/code", "course/browser-demos", "course/beginners/code"]) {
  for (const name of (await readdir(directory)).sort()) {
    if (!name.endsWith(".mjs")) continue;
    const path = directory + "/" + name;
    const source = await readFile(path, "utf8");
    const formatted = await format(source, {
      parser: "babel",
      printWidth: 88,
      tabWidth: 2,
    });
    if (source === formatted) continue;
    changed += 1;
    if (checkOnly) console.error("Teaching code needs formatting: " + path);
    else await writeFile(path, formatted, "utf8");
  }
}
if (checkOnly && changed) process.exitCode = 1;
else console.log(checkOnly ? "Teaching code formatting verified." : "Formatted teaching code: " + changed + " files.");
