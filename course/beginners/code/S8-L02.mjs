const events = [
  { name: "model:start", at: 0 },
  { name: "model:end", at: 20 },
  { name: "tool:start", at: 21 },
  { name: "tool:end", at: 921 },
];
function duration(prefix) {
  return (
    events.find((event) => event.name === prefix + ":end").at -
    events.find((event) => event.name === prefix + ":start").at
  );
}
console.log("模型：", duration("model"), "工具：", duration("tool"));
assert.ok(duration("tool") > duration("model"));
