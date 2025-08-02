// utils/keywordMatch.js

function matchDocumentsByKeyword(question, documents, topN = 3) {
  const lowerQ = question.toLowerCase();

  const scored = documents.map((doc) => {
    let score = 0;
    for (const kw of doc.keyword || []) {
      if (lowerQ.includes(kw.toLowerCase())) score += 1;
    }
    return { doc, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.doc);
}

module.exports = { matchDocumentsByKeyword };
