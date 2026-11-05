import assert from "node:assert/strict";
const gold = [
  {id:"q1",relevant:["a","b"],answerable:true},
  {id:"q2",relevant:["c"],answerable:true},
  {id:"q3",relevant:[],answerable:false}
];
const runs = {
  q1:{retrieved:["a","x","b"],abstained:false},
  q2:{retrieved:["x","c","c"],abstained:true},
  q3:{retrieved:["x"],abstained:true}
};
function report(gold,runs,k) {
  const rows = gold.map(g => {
    const r = runs[g.id];
    if (!r) throw new Error("MISSING_RUN:"+g.id);
    const found = [...new Set(r.retrieved)].slice(0,k);
    const hits = found.filter(id => g.relevant.includes(id)).length;
    const first = found.findIndex(id => g.relevant.includes(id));
    return {id:g.id,recall:g.relevant.length ? hits/g.relevant.length : null,
      rr:g.relevant.length ? (first<0?0:1/(first+1)) : null,
      correctAbstention:r.abstained === !g.answerable};
  });
  const defined = rows.filter(r => r.recall !== null);
  return {rows,recall:defined.reduce((s,r) => s+r.recall,0)/defined.length,
    mrr:defined.reduce((s,r) => s+r.rr,0)/defined.length,
    abstentionAccuracy:rows.filter(r => r.correctAbstention).length/rows.length,
    retrievalDenominator:defined.length,total:rows.length};
}
const result = report(gold,runs,2);
assert.equal(result.recall,0.75);
assert.equal(result.mrr,0.75);
assert.equal(result.abstentionAccuracy,2/3);
assert.equal(result.rows[2].recall,null);
assert.throws(() => report(gold,{q1:runs.q1},2),/MISSING/);
assert.deepEqual(result.rows.filter(r => !r.correctAbstention).map(r => r.id),["q2"]);
console.log("Recall@2=0.75; MRR@2=0.75; retrieval denominator=2");
console.log("abstention decisions=2/3; q2 false refusal; q3 retrieval N/A");
