// src/utils/riskEngine.js
//-------------------------------------------------------
// Tiny helper that converts 4 domain scores (0-3 each)
// into a weighted total & a risk-level string.
//-------------------------------------------------------

const WEIGHTS = {
  1: 1.2,   // Risky Behaviors / Low Self-Worth
  2: 1.0,   // Academic Disengagement
  3: 0.8,   // Psychological Disengagement
  4: 1.5    // Poor School Performance
};

const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

/** domainScores: Map<domain_id, score> */
function calculate(domainScores) {
  let sum = 0;
  for (const [domainId, score] of Object.entries(domainScores)) {
    const w = WEIGHTS[domainId] ?? 1;
    sum += w * score;
  }
  const total = Number((sum / totalWeight).toFixed(3)); // 0-3 range-ish

  let level;
  if (total >= 2.5) level = 'Very High';
  else if (total >= 2.0) level = 'High';
  else if (total >= 1.5) level = 'Medium';
  else level = 'Low';

  return { total, level };
}

module.exports = { calculate };
