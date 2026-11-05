// S5-L02 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：相似度不是正确率");
function cosine(a,b) {
 const dot=a.reduce((sum,x,i)=>sum+x*b[i],0);
 const norm=Math.hypot(...a)*Math.hypot(...b);
 return norm === 0 ? 0 : dot/norm;
}
console.log(cosine([1,0],[0.8,0.2]));
console.log(cosine([1,0],[0,1]));
console.log("人工二维向量，不是真实 embedding 或正确概率");
}
