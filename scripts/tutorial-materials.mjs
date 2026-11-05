export function parseTutorial(markdown, id) {
  const files = [];
  const expected = new Map();
  const fences = [...markdown.replaceAll("\r\n", "\n").matchAll(/^~~~(\S+)(?: (file|expect)=([A-Za-z0-9._-]+))?\n([\s\S]*?)^~~~\s*$/gm)];
  for (const match of fences) {
    if (!match[2]) continue;
    const name = match[3];
    if (!name.startsWith(id) || !/^[A-Za-z0-9_-]+\.(mjs|py|json|sql|txt)$/.test(name))
      throw new Error("Invalid tutorial asset name: " + name);
    if (match[2] === "file") files.push({name,code:match[4].trimEnd()+"\n",language:match[1]});
    else {
      if (expected.has(name)) throw new Error("Duplicate expectation in " + id);
      expected.set(name, match[4].trimEnd()+"\n");
    }
  }
  if (!files.length) throw new Error("Missing runnable material: " + id);
  if (new Set(files.map(file => file.name)).size !== files.length) throw new Error("Duplicate file in " + id);
  for (const name of expected.keys())
    if (!files.some(file => file.name === name)) throw new Error("Orphan expectation in " + id);
  for (const file of files) if (expected.has(file.name)) file.expected = expected.get(file.name);
  return files;
}
