const initial = { requestId: "B", seq: 0, text: "", done: false };
function apply(state, event) {
  if (event.requestId !== state.requestId) return state;
  if (state.done || event.seq <= state.seq) return state;
  return {
    ...state,
    seq: event.seq,
    text: state.text + (event.text ?? ""),
    done: event.done === true,
  };
}
const events = [
  { requestId: "A", seq: 1, text: "旧答案" },
  { requestId: "B", seq: 1, text: "新答案" },
  { requestId: "B", seq: 2, done: true },
  { requestId: "B", seq: 3, text: "结束后晚到" },
];
const state = events.reduce(apply, initial);
console.log(state.text, state.done);
assert.equal(state.text, "新答案");
