for (const text of ["null", "[]", '"done"', "42", '{"category":"bug"}']) {
  const value = JSON.parse(text);
  console.log(text, "=>", typeof value, "数组:", Array.isArray(value));
}
