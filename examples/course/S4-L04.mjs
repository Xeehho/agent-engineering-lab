// S4-L04 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：先读后写的竞争窗口");
let version=1;
function conditionalUpdate(expected) {
 if(version!==expected) return false;
 version++; return true;
}
const workerARead=version,workerBRead=version;
console.log("A",conditionalUpdate(workerARead));
console.log("B",conditionalUpdate(workerBRead));
console.log("同步 JS 示意 CAS；真实数据库需原子条件更新");
}
