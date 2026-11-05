import assert from "node:assert/strict";
const chunks = [
  {id:"c1",version:2,text:"未发货订单可以申请退款。"},
  {id:"c2",version:2,text:"已发货订单需先完成退货，再审核退款。"},
  {id:"c3",version:1,text:"旧版：所有订单立即退款。"}
];
function rerank(candidates,score) {
  return candidates.filter(c => c.version===2)
    .map(c => ({...c,score:score(c)}))
    .sort((a,b) => b.score-a.score || a.id.localeCompare(b.id));
}
function validateQuote(claim,available) {
  const c = available.find(x => x.id===claim.chunkId && x.version===claim.version);
  if (!c) return {ok:false,reason:"MISSING_OR_STALE_SOURCE"};
  if (!claim.quote || !c.text.includes(claim.quote)) return {ok:false,reason:"QUOTE_NOT_FOUND"};
  return {ok:true,scope:"quote-exists-only"};
}
function answerFromApprovedRule(question,ranked) {
  // 固定业务规则夹具，用来验证证据路径，不是自然语言生成器。
  if (question !== "已发货如何退款" || ranked[0]?.id !== "c2")
    return {kind:"abstain",reason:"INSUFFICIENT_SUPPORTED_RULE"};
  return {kind:"answer",claim:"已发货需先退货",chunkId:"c2",version:2,quote:"需先完成退货"};
}
const ranked = rerank(chunks,c => ({c1:0.2,c2:0.9}[c.id]));
assert.equal(ranked[0].id,"c2");
assert.equal(ranked.some(c => c.id==="c3"),false);
const answer = answerFromApprovedRule("已发货如何退款",ranked);
assert.equal(validateQuote(answer,ranked).ok,true);
assert.equal(validateQuote({...answer,quote:"无需退货"},ranked).ok,false);
assert.equal(validateQuote({...answer,version:1},ranked).ok,false);
assert.equal(answerFromApprovedRule("多久到银行卡",ranked).kind,"abstain");
// 反例：真实引用存在，但与答案无关；机械校验仍会通过。
const misleading = {...answer,claim:"所有订单都能立即到账"};
assert.equal(validateQuote(misleading,ranked).ok,true);
console.log("current candidates reranked; missing/stale/fabricated quote rejected");
console.log("unsupported question abstained; valid quote alone did not prove entailment");
