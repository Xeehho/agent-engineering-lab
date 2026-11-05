const relevant = new Set(["doc-1", "doc-2"]);
const retrieved = new Set(["doc-1", "doc-3", "doc-1"]);
const hits = [...relevant].filter((id) => retrieved.has(id)).length;
const recall = hits / relevant.size;
console.log("相关资料找回：", hits + "/" + relevant.size, "召回率：", recall);
assert.equal(recall, 0.5);
