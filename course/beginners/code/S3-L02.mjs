let connected = false;
function connect() {
  connected = true;
}
function call(ticketId) {
  if (!connected) throw new Error("连接尚未建立");
  if (ticketId !== "T-42") {
    return { isError: true, content: [{ text: "工单不存在" }] };
  }
  return { isError: false, content: [{ text: "订单页白屏" }] };
}
assert.throws(() => call("T-42"), /连接/);
connect();
console.log(call("missing").isError, call("T-42").content[0].text);
