// S5-L03 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：引用存在与引用支持不同");
const authorized = new Map([["doc-2",{version:3,text:"超时默认 5 秒"}]]);
for (const claim of [{text:"超时 5 秒",source:"doc-2"},{text:"超时 1 秒",source:"doc-9"}]) {
 console.log(claim, {sourceExists:authorized.has(claim.source)});
}
console.log("存在性检查不能单独验证内容支持关系");
}
