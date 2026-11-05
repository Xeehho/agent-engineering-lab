import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 文件数据库用于验证关闭连接后仍能找回同一业务意图。
const temporaryDirectory = mkdtempSync(join(tmpdir(), "agent-idempotency-"));
const databasePath = join(temporaryDirectory, "drafts.sqlite");
let database = new DatabaseSync(databasePath);
database.exec(`
  CREATE TABLE drafts (
    tenant TEXT NOT NULL,
    key TEXT NOT NULL,
    hash TEXT NOT NULL,
    body TEXT NOT NULL,
    PRIMARY KEY (tenant, key)
  )
`);

function hashDraftPayload(payload) {
  const normalizedPayload = JSON.stringify({ text: payload.text });
  return createHash("sha256").update(normalizedPayload).digest("hex");
}

function createDraft(authenticatedUser, intentKey, payload) {
  // 命中旧结果之前也要检查权限，不能让幂等缓存变成绕过授权的入口。
  if (authenticatedUser.role !== "editor") {
    throw new Error("FORBIDDEN");
  }
  if (
    typeof intentKey !== "string" ||
    intentKey === "" ||
    typeof payload.text !== "string"
  ) {
    throw new Error("INVALID");
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    const previousRecord = database
      .prepare(
        `
      SELECT hash, body
      FROM drafts
      WHERE tenant = ? AND key = ?
    `,
      )
      .get(authenticatedUser.tenant, intentKey);

    let result;
    if (previousRecord) {
      if (previousRecord.hash !== hashDraftPayload(payload)) {
        throw new Error("IDEMPOTENCY_CONFLICT");
      }
      result = JSON.parse(previousRecord.body);
    } else {
      result = {
        id: authenticatedUser.tenant + ":" + intentKey,
        text: payload.text,
      };
      database
        .prepare(
          `
        INSERT INTO drafts (tenant, key, hash, body)
        VALUES (?, ?, ?, ?)
      `,
        )
        .run(
          authenticatedUser.tenant,
          intentKey,
          hashDraftPayload(payload),
          JSON.stringify(result),
        );
    }
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

try {
  const editor = { tenant: "A", role: "editor" };
  const firstResult = createDraft(editor, "intent-42", { text: "收到，正在处理" });

  // 丢弃第一次响应，关闭连接，再模拟同意图的网络重试。
  database.close();
  database = new DatabaseSync(databasePath);
  const replayedResult = createDraft(editor, "intent-42", { text: "收到，正在处理" });
  assert.deepEqual(replayedResult, firstResult);
  assert.equal(database.prepare("SELECT count(*) AS n FROM drafts").get().n, 1);

  assert.throws(
    () => createDraft(editor, "intent-42", { text: "替换内容" }),
    /CONFLICT/,
  );
  assert.throws(
    () =>
      createDraft({ tenant: "A", role: "viewer" }, "intent-42", {
        text: "收到，正在处理",
      }),
    /FORBIDDEN/,
  );

  createDraft({ tenant: "B", role: "editor" }, "intent-42", { text: "B 的草稿" });
  assert.equal(database.prepare("SELECT count(*) AS n FROM drafts").get().n, 2);
  console.log(
    "reopen + retry: one draft; changed payload: conflict; viewer: forbidden",
  );
  console.log("tenant A/B isolated; SQLite transaction only, no external side effect");
} finally {
  database.close();
  rmSync(databasePath);
  rmdirSync(temporaryDirectory);
}
