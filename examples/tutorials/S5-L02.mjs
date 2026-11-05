import assert from "node:assert/strict";
function cosine(a,b) {
  if (a.length !== b.length || !a.length || [...a,...b].some(x => !Number.isFinite(x)))
    throw new Error("INVALID_VECTOR");
  const norm = v => Math.sqrt(v.reduce((s,x) => s+x*x,0));
  if (!norm(a) || !norm(b)) throw new Error("ZERO_VECTOR");
  return a.reduce((s,x,i) => s+x*b[i],0)/(norm(a)*norm(b));
}
const docs = [
  {id:"refund",words:["refund","arrival"],vector:[1,0]},
  {id:"error",words:["E_CONN_RESET","retry"],vector:[0,1]},
  {id:"shipping",words:["shipping","arrival"],vector:[0.8,0.2]}
];
const terms = ["refund","arrival"];
const lexical = docs.map(d => ({
  id:d.id,score:terms.filter(t => d.words.includes(t)).length
})).filter(d => d.score>0).sort((a,b) => b.score-a.score || a.id.localeCompare(b.id)).map(d => d.id);
const vector = docs.map(d => ({id:d.id,score:cosine([1,0],d.vector)}))
  .sort((a,b) => b.score-a.score || a.id.localeCompare(b.id)).map(d => d.id);
function rrf(rankings,k=60) {
  const scores = new Map();
  for (const ranking of rankings) {
    if (new Set(ranking).size !== ranking.length) throw new Error("DUPLICATE_RANK");
    ranking.forEach((id,i) => scores.set(id,(scores.get(id)||0)+1/(k+i+1)));
  }
  return [...scores].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).map(([id]) => id);
}
assert.equal(cosine([1,0],[1,0]),1);
assert.equal(cosine([1,0],[0,1]),0);
assert.throws(() => cosine([0,0],[1,0]),/ZERO/);
assert.throws(() => cosine([1],[1,2]),/INVALID/);
assert.deepEqual(lexical,["refund","shipping"]);
assert.deepEqual(rrf([lexical,vector]),["refund","shipping","error"]);
assert.deepEqual(rrf([["a","b"],["b","a"]]),["a","b"]);
console.log("cosine checks + lexical ranking + reciprocal-rank fusion: passed");
console.log("top=refund; vectors synthetic; no trained embedding model executed");
