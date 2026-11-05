// 先按行切块保留位置，再在事务里替换同租户同文档的版本。
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
const database = new DatabaseSync(":memory:");
database.exec(
  `
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  tenant TEXT,
  doc TEXT,
  version INTEGER,
  start_line INTEGER,
  end_line INTEGER,
  text TEXT
)
`,
);
// 输入原文、窗口和重叠行数，输出带来源行号的块。
function splitDocumentIntoChunks(sourceText, windowSize = 3, overlapLines = 1) {
  if (
    !Number.isInteger(windowSize) ||
    windowSize < 1 ||
    !Number.isInteger(overlapLines) ||
    overlapLines < 0 ||
    overlapLines >= windowSize
  ) {
    throw new Error("INVALID_WINDOW");
  }
  const documentLines = sourceText.replaceAll("\r\n", "\n").split("\n"),
    chunks = [];
  for (
    let startIndex = 0;
    startIndex < documentLines.length;
    startIndex += windowSize - overlapLines
  ) {
    const endIndex = Math.min(startIndex + windowSize, documentLines.length);
    chunks.push({
      start: startIndex + 1,
      end: endIndex,
      text: documentLines.slice(startIndex, endIndex).join("\n"),
    });
    if (endIndex === documentLines.length) {
      break;
    }
  }
  return chunks;
}
// 一次事务替换文档；发生错误时旧版本仍可保留。
function ingestDocument(tenantId, documentId, documentVersion, sourceText) {
  const chunks = splitDocumentIntoChunks(sourceText);
  database.exec("BEGIN");
  try {
    database
      .prepare("DELETE FROM chunks WHERE tenant=? AND doc=?")
      .run(tenantId, documentId);
    for (const chunk of chunks) {
      const contentDigest = createHash("sha256")
        .update(chunk.text)
        .digest("hex")
        .slice(0, 12);
      const chunkId = [
        tenantId,
        documentId,
        documentVersion,
        chunk.start,
        chunk.end,
        contentDigest,
      ].join(":");
      database
        .prepare("INSERT INTO chunks VALUES(?,?,?,?,?,?,?)")
        .run(
          chunkId,
          tenantId,
          documentId,
          documentVersion,
          chunk.start,
          chunk.end,
          chunk.text,
        );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
try {
  const originalDocument =
    "退款规则\n未发货可申请\n已发货先退货\n审核需两天\n到账以银行为准";
  const chunks = splitDocumentIntoChunks(originalDocument);
  assert.deepEqual(
    chunks.map((chunk) => [chunk.start, chunk.end]),
    [
      [1, 3],
      [3, 5],
    ],
  );
  assert.equal(chunks[0].text.split("\n")[2], chunks[1].text.split("\n")[0]);
  ingestDocument("A", "refund", 1, originalDocument);
  ingestDocument("B", "refund", 1, "B 的独立规则");
  ingestDocument("A", "refund", 2, "新版规则\n审核需三天");
  assert.equal(
    database
      .prepare(
        `
SELECT
  count(*) AS n
FROM
  chunks
WHERE
  tenant = 'A'
  AND version = 1
`,
      )
      .get().n,
    0,
  );
  assert.equal(
    database.prepare("SELECT count(*) AS n FROM chunks WHERE tenant='B'").get().n,
    1,
  );
  database.prepare("DELETE FROM chunks WHERE tenant=? AND doc=?").run("A", "refund");
  assert.equal(
    database.prepare("SELECT count(*) AS n FROM chunks WHERE tenant='A'").get().n,
    0,
  );
  assert.throws(() => splitDocumentIntoChunks(originalDocument, 3, 3), /WINDOW/);
  console.log("line provenance=1-3,3-5; overlap preserved");
  console.log("A v1 replaced by v2 then deleted; B remained isolated");
} finally {
  database.close();
}
