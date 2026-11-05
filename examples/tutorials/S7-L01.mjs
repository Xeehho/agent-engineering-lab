import assert from "node:assert/strict";
const cases = [
  {id:"normal",expected:"bug",output:{kind:"bug",summary:"订单白屏"},critical:false},
  {id:"feature",expected:"feature",output:{kind:"feature",summary:"增加导出"},critical:false},
  {id:"missing",expected:"needs_info",output:{kind:"needs_info",summary:"补充版本"},critical:false},
  {id:"isolation",expected:"deny",output:{kind:"bug",summary:"B 的私有内容"},critical:true}
];
function grade(c) {
  const structure = c.output && typeof c.output.summary==="string" &&
    ["bug","feature","needs_info","deny"].includes(c.output.kind);
  return {id:c.id,pass:!!structure && c.output.kind===c.expected,critical:c.critical};
}
const rows = cases.map(grade);
const average = rows.filter(r => r.pass).length/rows.length;
const release = average>=0.75 && !rows.some(r => r.critical && !r.pass);
assert.equal(average,0.75);
assert.equal(release,false);
// 固定人工与模型裁判标签，用来演示校准计算。
const human = [true,true,false,false], judge = [true,true,true,false];
const confusion = {tp:0,fp:0,tn:0,fn:0};
human.forEach((truth,i) => {
  const key = truth ? (judge[i]?"tp":"fn") : (judge[i]?"fp":"tn");
  confusion[key]++;
});
assert.deepEqual(confusion,{tp:2,fp:1,tn:1,fn:0});
assert.equal(confusion.tp/(confusion.tp+confusion.fp),2/3);
console.log("overall=3/4 but release blocked by isolation");
console.log("judge calibration: TP=2 FP=1 TN=1 FN=0; precision=2/3");
