// S6-L02 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：赞成票不是独立证据");
const reports=[{agent:"A",source:"doc-old",claim:"可执行"},{agent:"B",source:"doc-old",claim:"可执行"}];
console.log("赞同数:",reports.length);
console.log("不同来源数:",new Set(reports.map(x=>x.source)).size);
console.log("同一旧证据的两次赞同不等于独立核验");
}
