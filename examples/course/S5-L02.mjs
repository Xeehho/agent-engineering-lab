// S5-L02 local teaching demo. No model API calls; not a complete homework solution.
import assert from "node:assert/strict";
{
console.log("实验 1：相似度与混合排名");
// 直接在网页运行。assert 是课堂提供的检查工具，失败会中断本次实验。

// 本课向量来自题目，不是 embedding 模型。先读公式，再读排名与融合。
function cosineSimilarity(leftVector, rightVector) {
  const sameDimension =
    leftVector.length > 0 && leftVector.length === rightVector.length;
  const allFinite = [...leftVector, ...rightVector].every(Number.isFinite);
  if (!sameDimension || !allFinite) {
    throw new Error("INVALID_VECTOR");
  }

  let dotProduct = 0;
  let leftSquaredLength = 0;
  let rightSquaredLength = 0;
  for (let index = 0; index < leftVector.length; index += 1) {
    dotProduct += leftVector[index] * rightVector[index];
    leftSquaredLength += leftVector[index] ** 2;
    rightSquaredLength += rightVector[index] ** 2;
  }
  const denominator = Math.sqrt(leftSquaredLength) * Math.sqrt(rightSquaredLength);
  if (denominator === 0) {
    throw new Error("ZERO_VECTOR");
  }
  return dotProduct / denominator;
}

const fixtureDocuments = [
  { id: "refund", words: ["refund", "arrival"], vector: [1, 0] },
  { id: "error", words: ["E_CONN_RESET", "retry"], vector: [0, 1] },
  { id: "shipping", words: ["shipping", "arrival"], vector: [0.8, 0.2] },
];

function sortByScore(scoredDocuments) {
  return scoredDocuments.sort((left, right) => {
    return right.score - left.score || left.id.localeCompare(right.id);
  });
}

const queryTerms = ["refund", "arrival"];
const keywordScores = fixtureDocuments.map((document) => ({
  id: document.id,
  score: queryTerms.filter((term) => document.words.includes(term)).length,
}));
const lexicalRanking = sortByScore(
  keywordScores.filter((document) => document.score > 0),
).map((document) => document.id);

const vectorScores = fixtureDocuments.map((document) => ({
  id: document.id,
  score: cosineSimilarity([1, 0], document.vector),
}));
const vectorRanking = sortByScore(vectorScores).map((document) => document.id);

// 接收排名而非原始分数，每一路同一文档只能贡献一次。
function reciprocalRankFusion(rankings, rankConstant = 60) {
  const fusedScores = new Map();
  for (const ranking of rankings) {
    if (new Set(ranking).size !== ranking.length) {
      throw new Error("DUPLICATE_RANK");
    }
    ranking.forEach((documentId, zeroBasedIndex) => {
      const rank = zeroBasedIndex + 1;
      const previousScore = fusedScores.get(documentId) ?? 0;
      fusedScores.set(documentId, previousScore + 1 / (rankConstant + rank));
    });
  }
  const scoredDocuments = [...fusedScores].map(([id, score]) => ({ id, score }));
  return sortByScore(scoredDocuments).map((document) => document.id);
}

assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
assert.throws(() => cosineSimilarity([0, 0], [1, 0]), /ZERO/);
assert.throws(() => cosineSimilarity([1], [1, 2]), /INVALID/);
assert.deepEqual(lexicalRanking, ["refund", "shipping"]);
assert.deepEqual(reciprocalRankFusion([lexicalRanking, vectorRanking]), [
  "refund",
  "shipping",
  "error",
]);
assert.deepEqual(
  reciprocalRankFusion([
    ["a", "b"],
    ["b", "a"],
  ]),
  ["a", "b"],
);
console.log("cosine checks + lexical ranking + reciprocal-rank fusion: passed");
console.log("top=refund; vectors synthetic; no trained embedding model executed");

}
