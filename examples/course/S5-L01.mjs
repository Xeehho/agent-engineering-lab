// S5-L01 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：可追溯的切块与版本");
// 这里实际执行切块算法，版本存储是内存夹具，不模拟向量数据库。
function splitDocument(text, windowSize = 3, overlap = 1) {
  if (
    !Number.isInteger(windowSize) ||
    !Number.isInteger(overlap) ||
    windowSize < 1 ||
    overlap < 0 ||
    overlap >= windowSize
  ) {
    throw new Error("INVALID_WINDOW");
  }
  const lines = text.split("\n");
  const chunks = [];
  for (let start = 0; start < lines.length; start += windowSize - overlap) {
    const end = Math.min(start + windowSize, lines.length);
    chunks.push({
      startLine: start + 1,
      endLine: end,
      text: lines.slice(start, end).join("\n"),
    });
    if (end === lines.length) {
      break;
    }
  }
  return chunks;
}
const documentVersions = new Map();
function replaceDocument(tenant, documentId, version, text) {
  const key = JSON.stringify([tenant, documentId]);
  documentVersions.set(key, { version, chunks: splitDocument(text) });
}

const text = "退款规则\n未发货可申请\n已发货先退货\n审核需两天\n到账以银行为准";
const chunks = splitDocument(text);
assert.deepEqual(
  chunks.map((chunk) => [chunk.startLine, chunk.endLine]),
  [
    [1, 3],
    [3, 5],
  ],
);
assert.throws(() => splitDocument(text, 3, 3), /WINDOW/);
assert.throws(() => splitDocument(text, 3, 1.5), /WINDOW/);
replaceDocument("A", "refund", 1, text);
replaceDocument("B", "refund", 1, "B独立规则");
replaceDocument("A", "refund", 2, "新版\n审核三天");
assert.equal(documentVersions.get('["A","refund"]').version, 2);
assert.equal(documentVersions.get('["B","refund"]').version, 1);
console.log("切块", chunks);
console.log("A版本替换不影响B；真实索引与删除传播仍需进阶实操。");

}
