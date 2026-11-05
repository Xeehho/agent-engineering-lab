// S4-L01 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：拒绝非法状态跳转");
const allowed = {queued:["running","cancelled"],running:["waiting_approval","succeeded","failed","cancelled"],waiting_approval:["running","cancelled"]};
function transition(from,to) {
  if (!allowed[from]?.includes(to)) throw new Error("INVALID_TRANSITION");
  return to;
}
console.log(transition("queued","running"));
try { console.log(transition("succeeded","running")); } catch(e) {console.log(e.message);}
}
