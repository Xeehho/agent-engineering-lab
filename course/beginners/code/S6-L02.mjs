const packet = {
  taskId: "task-42",
  sourceVersion: 1,
  facts: ["审核需要三天"],
  unresolved: ["到账时间未知"],
};
function accept(packet, expectedVersion) {
  if (packet.sourceVersion !== expectedVersion) return "重新检索";
  if (packet.unresolved.length) return "保留不确定项";
  return "可继续撰写";
}
console.log(accept(packet, 2));
console.log(accept(packet, 1));
assert.equal(accept(packet, 2), "重新检索");
