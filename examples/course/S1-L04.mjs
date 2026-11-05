// S1-L04 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：证据矩阵缺了什么？");
const evidence = [
 {claim:"输入校验", expected:400, actual:400, environment:"local"},
 {claim:"模型准确率", expected:"有标注评测集", actual:null, environment:"mock"}
];
for (const item of evidence) console.log(item.claim, item.actual === item.expected ? "有对应观察" : "证据不足");
}
