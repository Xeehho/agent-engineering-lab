// S4-L03 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：旧快照不应覆盖新状态");
let task = {version:4,status:"waiting_approval"};
const updates = [{version:3,status:"running"},{version:5,status:"succeeded"}];
for (const update of updates) {
  if (update.version > task.version) task = update;
  else console.log("忽略旧快照",update.version);
}
console.log(task);
}
