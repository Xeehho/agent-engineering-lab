import assert from "node:assert/strict";
const source = [
  {runId:"r1", type:"delta", text:"订单"},
  {runId:"r1", type:"done"},
  {runId:"r1", type:"delta", text:"旧结果"}
].map(event => "data: " + JSON.stringify(event) + "\n\n").join("");
const bytes = new TextEncoder().encode(source);

function parse(chunks) {
  const decoder = new TextDecoder("utf-8", {fatal:true});
  let buffer = "";
  const events = [];
  for (const chunk of chunks) {
    buffer += decoder.decode(chunk, {stream:true});
    let end;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0,end); buffer = buffer.slice(end+2);
      if (!frame.startsWith("data: ")) throw new Error("BAD_FRAME");
      const event = JSON.parse(frame.slice(6));
      if (event.runId !== "r1" || !["delta","done"].includes(event.type))
        throw new Error("BAD_EVENT");
      if (event.type === "delta" && typeof event.text !== "string")
        throw new Error("BAD_DELTA");
      events.push(event);
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) throw new Error("INCOMPLETE_FRAME");
  return events;
}
const whole = parse([bytes]);
const split = parse(Array.from(bytes, byte => Uint8Array.of(byte)));
assert.deepEqual(split,whole);
let state = {runId:"r1",status:"running",text:""};
for (const event of split) {
  if (event.runId !== state.runId || state.status !== "running") continue;
  state = event.type === "delta"
    ? {...state,text:state.text+event.text}
    : {...state,status:"succeeded"};
}
assert.equal(state.text,"订单");
assert.equal(state.status,"succeeded");
assert.throws(() => parse([bytes.slice(0,-1)]), /INCOMPLETE_FRAME/);
console.log("whole packet = byte-by-byte packet");
console.log("text=订单; terminal protected; truncated frame rejected");
