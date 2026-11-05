import assert from "node:assert/strict";
function softmax(logits, temperature) {
  if (!(temperature > 0)) throw new Error("TEMPERATURE_MUST_BE_POSITIVE");
  const scaled = logits.map(value => value/temperature);
  const max = Math.max(...scaled);
  const exp = scaled.map(value => Math.exp(value-max));
  const total = exp.reduce((a,b)=>a+b,0);
  return exp.map(value=>value/total);
}
const broad = softmax([2,1,0],1);
const sharp = softmax([2,1,0],0.3);
assert.ok(sharp[0] > broad[0]);
assert.ok(Math.abs(sharp.reduce((a,b)=>a+b,0)-1) < 1e-9);
assert.throws(()=>softmax([1,2],0),/POSITIVE/);
const plan = {system:1000,tools:1800,history:5000,evidence:2800,output:2000};
const total = Object.values(plan).reduce((a,b)=>a+b,0);
assert.equal(total,12600);
assert.equal(Math.max(0,total-12000),600);
console.log("lower temperature: sharper distribution, not a truth guarantee");
console.log("planned=12600; assumed budget=12000; excess=600");
console.log("synthetic numbers; not a tokenizer or provider invoice");
