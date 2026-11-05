// S5-L01 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：相同文字不等于相同可见证据");
const chunks = [
 {id:"a",tenant:"A",version:2,text:"排障步骤"},
 {id:"b",tenant:"B",version:2,text:"排障步骤"},
 {id:"c",tenant:"A",version:1,text:"旧步骤"}
];
console.log(chunks.filter(c => c.tenant === "A" && c.version === 2));
}
