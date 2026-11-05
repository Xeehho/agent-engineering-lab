const facts = [{ id: "doc-1", supportedClaim: "审核需要三天" }];
const answer = { claim: "退款三天到账", evidenceId: "doc-1" };
const evidence = facts.find((item) => item.id === answer.evidenceId);
const supported = evidence?.supportedClaim === answer.claim;
console.log("引用存在：", Boolean(evidence), "主张受支持：", supported);
console.log(supported ? answer.claim : "资料不足，不能确定到账时间");
assert.equal(supported, false);
