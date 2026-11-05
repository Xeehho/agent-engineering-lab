let row = { id: "task-42", version: 1, state: "running" };
function save(expectedVersion, next) {
  if (row.version !== expectedVersion) return false;
  row = { ...row, state: next, version: row.version + 1 };
  return true;
}
const a = save(1, "succeeded");
const b = save(1, "failed");
console.log("A保存：", a, "B保存：", b, row.state);
assert.equal(row.state, "succeeded");
