const capacity = 100;
const outputReserve = 20;
const pieces = [
  { name: "规则", tokens: 15 },
  { name: "当前问题", tokens: 10 },
  { name: "相关文档", tokens: 40 },
  { name: "无关历史", tokens: 50 },
];
let used = 0;
const selected = [];
for (const piece of pieces) {
  if (used + piece.tokens + outputReserve > capacity) continue;
  selected.push(piece.name);
  used += piece.tokens;
}
console.log(selected.join("、"), used);
assert.equal(used, 65);
