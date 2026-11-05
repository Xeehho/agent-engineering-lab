import assert from "node:assert/strict";
function parseCount(text) {
  const value = JSON.parse(text);
  if (!value || Array.isArray(value) || typeof value !== "object")
    throw new Error("NOT_OBJECT");
  if (!Number.isInteger(value.count) || value.count < 0)
    throw new Error("INVALID_COUNT");
  return value.count;
}
const cases = [
  {id:"normal",input:'{"count":2}',expected:2},
  {id:"string",input:'{"count":"2"}',expected:"INVALID_COUNT"},
  {id:"null",input:"null",expected:"NOT_OBJECT"},
  {id:"negative",input:'{"count":-1}',expected:"INVALID_COUNT"}
];
const evidence = cases.map(test => {
  let actual;
  try { actual = parseCount(test.input); }
  catch (error) { actual = error.message; }
  return {...test, actual, passed:Object.is(actual,test.expected),
    environment:"Node/local",provider:"none"};
});
assert.equal(evidence.filter(item => item.passed).length,4);
for (const item of evidence)
  console.log(item.id + ": " + item.passed + " (" + item.actual + ")");
console.log("scope: four local contract cases; no model accuracy claim");
