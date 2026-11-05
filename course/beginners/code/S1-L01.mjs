// 三个候选都假设已经通过网络返回。
const candidates = [
  "不是JSON",
  '{"group":7}',
  '{"group":"火星组"}',
  '{"group":"技术支持"}',
];
function parse(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return "文本不能解析";
  }
  if (!value || typeof value.group !== "string") return "字段类型不对";
  if (!["技术支持", "账务支持"].includes(value.group)) return "业务不允许";
  return "可以分诊";
}
for (const raw of candidates) console.log(parse(raw));
assert.equal(parse(candidates[3]), "可以分诊");
