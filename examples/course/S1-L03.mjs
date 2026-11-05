// S1-L03 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：字节拆包与终态守卫");
// 直接在网页运行。assert 是课堂提供的检查工具，失败会中断本次实验。

// 这是课堂事件契约；项目作业仍使用 started/completed/failed，不能直接混接。
const fixtureEvents = [
  { runId: "r1", type: "delta", text: "订单" },
  { runId: "r1", type: "done" },
  { runId: "r1", type: "delta", text: "旧结果" },
];
const sourceText = fixtureEvents
  .map((event) => "data: " + JSON.stringify(event) + "\n\n")
  .join("");
const encodedBytes = new TextEncoder().encode(sourceText);

function validateEvent(rawEvent) {
  const isObject =
    rawEvent !== null && typeof rawEvent === "object" && !Array.isArray(rawEvent);
  if (!isObject || typeof rawEvent.runId !== "string") {
    throw new Error("BAD_EVENT");
  }
  if (!["delta", "done"].includes(rawEvent.type)) {
    throw new Error("BAD_EVENT");
  }
  if (rawEvent.type === "delta" && typeof rawEvent.text !== "string") {
    throw new Error("BAD_DELTA");
  }
  return rawEvent;
}

function parseEventChunks(byteChunks) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let unconsumedText = "";
  const parsedEvents = [];

  for (const byteChunk of byteChunks) {
    // stream:true 会在解码器内暂存尚不完整的多字节字符。
    unconsumedText += decoder.decode(byteChunk, { stream: true });

    let separatorIndex = unconsumedText.indexOf("\n\n");
    while (separatorIndex >= 0) {
      const completeFrame = unconsumedText.slice(0, separatorIndex);
      unconsumedText = unconsumedText.slice(separatorIndex + 2);

      if (!completeFrame.startsWith("data: ")) {
        throw new Error("BAD_FRAME");
      }
      const jsonText = completeFrame.slice("data: ".length);
      parsedEvents.push(validateEvent(JSON.parse(jsonText)));
      separatorIndex = unconsumedText.indexOf("\n\n");
    }
  }

  // 不再传 stream:true 表示输入结束，让解码器检查残缺字符。
  unconsumedText += decoder.decode();
  if (unconsumedText.trim() !== "") {
    throw new Error("INCOMPLETE_FRAME");
  }
  return parsedEvents;
}

function reduceStreamEvent(previousState, event) {
  if (event.runId !== previousState.runId) {
    return previousState;
  }
  if (previousState.status !== "running") {
    return previousState;
  }

  if (event.type === "delta") {
    return { ...previousState, text: previousState.text + event.text };
  }
  return { ...previousState, status: "succeeded" };
}

const wholePacketEvents = parseEventChunks([encodedBytes]);
const oneByteChunks = Array.from(encodedBytes, (byteValue) => Uint8Array.of(byteValue));
const fragmentedEvents = parseEventChunks(oneByteChunks);
assert.deepEqual(fragmentedEvents, wholePacketEvents);

const initialState = { runId: "r1", status: "running", text: "" };
const finalState = fragmentedEvents.reduce(reduceStreamEvent, initialState);
assert.deepEqual(finalState, {
  runId: "r1",
  status: "succeeded",
  text: "订单",
});
assert.deepEqual(
  reduceStreamEvent(initialState, { runId: "old", type: "delta", text: "污染" }),
  initialState,
);
assert.throws(() => parseEventChunks([encodedBytes.slice(0, -1)]), /INCOMPLETE_FRAME/);
assert.throws(
  () => parseEventChunks([new TextEncoder().encode("data: null\n\n")]),
  /BAD_EVENT/,
);
console.log("whole packet = byte-by-byte packet");
console.log("text=订单; terminal protected; truncated frame rejected");

}
