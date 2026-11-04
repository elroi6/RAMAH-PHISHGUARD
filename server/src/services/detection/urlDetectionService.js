import { analyzeUrl } from "./urlAnalyzer.js";
import { calculateRiskScore } from "./riskScorer.js";

export const detectUrl = (input) => {
  const analysis = analyzeUrl(input);

  // Do not calculate a risk score for invalid URLs.
  if (!analysis.valid) {
    return {
      ...analysis,
      risk: null,
    };
  }

  const risk = calculateRiskScore(analysis.findings);

  return {
    ...analysis,
    risk,
  };
};