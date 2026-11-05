// A registration means a long-form tutorial exists; it does not certify learner mastery.
export const tutorials = Object.fromEntries([
  "S1-L02", "S1-L03", "S1-L04", "S1-L05", "S1-L06",
  "S2-L01", "S2-L02", "S2-L03", "S2-L04",
  "S3-L01", "S3-L02", "S3-L03",
  "S4-L01", "S4-L02", "S4-L03", "S4-L04",
  "S5-L01", "S5-L02", "S5-L03", "S5-L04",
  "S6-L01", "S6-L02", "S6-L03",
  "S7-L01", "S7-L02", "S7-L03", "S7-L04",
  "S8-L01", "S8-L02", "S8-L03",
].map(id => [id, { path: "course/tutorials/" + id + ".md", primary: id + (id === "S1-L06" ? ".py" : ".mjs") }]));
