import assert from "node:assert/strict";
import { z } from "zod";
const handoffSchema = z.object({
  taskId:z.string(),inputVersion:z.number().int(),
  status:z.enum(["ready","blocked"]),
  claims:z.array(z.object({key:z.string(),value:z.string(),evidenceIds:z.array(z.string()).min(1)}).strict()),
  unresolved:z.array(z.string())
}).strict();
const evidence = new Map([
  ["rule-v2",{current:true,tenant:"A",text:"退款审核需两天"}],
  ["rule-v1",{current:false,tenant:"A",text:"旧版需一天"}],
  ["private-B",{current:true,tenant:"B",text:"B 的规则"}]
]);
function accept(raw,context) {
  const h = handoffSchema.parse(raw);
  if (h.taskId!==context.taskId || h.inputVersion!==context.version) throw new Error("STALE_HANDOFF");
  for (const claim of h.claims) for (const id of claim.evidenceIds) {
    const e = evidence.get(id);
    if (!e || !e.current || e.tenant!==context.tenant) throw new Error("INVALID_EVIDENCE");
  }
  return h;
}
function reconcile(handoffs) {
  const values = new Map();
  for (const h of handoffs) {
    if (h.status==="blocked" || h.unresolved.length) return {status:"blocked",reason:"UNRESOLVED"};
    for (const c of h.claims) {
      if (values.has(c.key) && values.get(c.key)!==c.value)
        return {status:"blocked",reason:"CONFLICT",key:c.key};
      values.set(c.key,c.value);
    }
  }
  return {status:"ready",facts:Object.fromEntries(values)};
}
const base = {taskId:"T",inputVersion:2,status:"ready",
  claims:[{key:"reviewDays",value:"2",evidenceIds:["rule-v2"]}],unresolved:[]};
const ctx = {taskId:"T",version:2,tenant:"A"};
const good = accept(base,ctx);
assert.equal(reconcile([good,good]).status,"ready");
const disagree = accept({...base,claims:[{key:"reviewDays",value:"3",evidenceIds:["rule-v2"]}]},ctx);
assert.deepEqual(reconcile([good,disagree]),{status:"blocked",reason:"CONFLICT",key:"reviewDays"});
assert.throws(() => accept({...base,inputVersion:1},ctx),/STALE/);
assert.throws(() => accept({...base,claims:[{key:"x",value:"x",evidenceIds:["private-B"]}]},ctx),/EVIDENCE/);
assert.throws(() => accept({...base,approved:true},ctx));
console.log("handoff schema/version/evidence scope: passed");
console.log("conflict blocked; same-source agreement not treated as independent proof");
