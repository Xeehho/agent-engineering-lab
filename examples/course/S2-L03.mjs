// S2-L03 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：同一个意图重试两次");
const results = new Map();
let created = 0;
function create(key) {
  if (!results.has(key)) results.set(key, {id:++created});
  return results.get(key);
}
console.log(create("intent-42"), create("intent-42"), {created});
console.log("Map 只演示单进程去重，不提供分布式原子性或持久化");
}
