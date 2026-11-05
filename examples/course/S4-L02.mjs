// S4-L02 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：重复交付如何去重");
const processed = new Set();
let writes = 0;
for (const message of [{intent:"i-1"},{intent:"i-1"},{intent:"i-2"}]) {
  if (processed.has(message.intent)) {console.log("重复");continue;}
  processed.add(message.intent); writes++;
}
console.log({writes});
console.log("示例没有数据库原子性，也不证明故障恢复");
}
