const document = {
  id: "policy",
  version: 2,
  tenant: "A",
  text: "交通费需要发票。\n住宿费需要审批。",
};
const chunks = document.text.split("\n").map((text, index) => ({
  chunkId: document.id + "@v" + document.version + "#" + index,
  sourceId: document.id,
  version: document.version,
  tenant: document.tenant,
  active: true,
  text,
}));
const visible = chunks.filter((chunk) => chunk.tenant === "A" && chunk.active);
console.log(visible.map((chunk) => chunk.chunkId).join("、"));
assert.equal(visible.length, 2);
