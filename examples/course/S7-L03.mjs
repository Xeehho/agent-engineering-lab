// S7-L03 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：队列也需要容量上限");
const max=2;
let queued=0;
for (const id of [1,2,3,4]) {
 if (queued>=max) console.log(id,"拒绝/提示稍后重试");
 else {queued++;console.log(id,"已入队");}
}
console.log("内存示例，不是分布式限流");
}
