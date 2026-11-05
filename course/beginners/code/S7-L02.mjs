const spans = [
  { traceId: "trace-42", spanId: "api", parent: null, usage: null },
  { traceId: "trace-42", spanId: "model", parent: "api", usage: null },
];
function summary(span) {
  return span.spanId + ": " + (span.usage === null ? "用量未知" : span.usage.tokens);
}
console.log(spans.map(summary).join("\n"));
assert.equal(spans[0].traceId, spans[1].traceId);
