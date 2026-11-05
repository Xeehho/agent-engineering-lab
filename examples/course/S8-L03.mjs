// S8-L03 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：简历指标是否有证据？");
const bullets=[
 {text:"课程项目：完成工单分诊",source:"commit + 本地用例"},
 {text:"生产准确率 99.9%",source:null}
];
for(const b of bullets) console.log(b.text,b.source?"可继续核验":"缺依据，不能这样宣称");
}
