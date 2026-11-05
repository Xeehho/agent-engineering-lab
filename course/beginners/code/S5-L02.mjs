const query = [1, 0];
const docs = [
  { id: "退款说明", vector: [0.9, 0.1] },
  { id: "登录说明", vector: [0.1, 0.9] },
];
function dot(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}
const ranked = docs
  .map((doc) => ({ id: doc.id, score: dot(query, doc.vector) }))
  .sort((a, b) => b.score - a.score);
console.log(ranked[0].id, ranked[0].score);
assert.equal(ranked[0].id, "退款说明");
