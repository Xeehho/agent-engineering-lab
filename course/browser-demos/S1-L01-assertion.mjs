const reading = JSON.parse('{"value":"8"}');
console.log("实际类型：", typeof reading.value);
try {
  console.log(reading.value.toFixed(1));
} catch (error) {
  console.log(error.name + ": " + error.message);
}

// 这才是实际运行的检查；typeof 断言不会自动改变字符串。
function hasNumericValue(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.value === "number" &&
    Number.isFinite(value.value)
  );
}
assert.equal(hasNumericValue(reading), false);
assert.equal(hasNumericValue({ value: 8 }), true);
assert.equal(hasNumericValue(null), false);
console.log("运行时校验：字符串、数字、null 已分别检查");
