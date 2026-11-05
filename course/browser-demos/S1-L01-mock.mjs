function mockProvider(input) {
  return {
    category: "bug",
    priority: "medium",
    summary: "订单页白屏",
    missingInformation: [],
  };
}
for (const input of ["订单页白屏", "请增加深色模式"]) {
  console.log("输入：", input);
  console.log("输出：", mockProvider(input));
}
