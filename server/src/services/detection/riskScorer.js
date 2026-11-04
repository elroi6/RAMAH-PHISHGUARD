const FINDING_WEIGHTS = Object.freeze({
  IP_ADDRESS_HOST: 15,
  UNUSUAL_PORT: 15,
  PUNYCODE_HOSTNAME: 15,
  EXCESSIVE_SUBDOMAINS: 10,
  UNENCRYPTED_HTTP: 5,
  LONG_URL: 5,
  SUSPICIOUS_PATH_KEYWORD: 5,
  SUSPICIOUS_QUERY_PARAMETER: 5,
});

const MAX_HEURISTIC_SCORE = 74;

const getRiskLevel = (score) => {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
};

export const calculateRiskScore = (findings = []) => {
  if (!Array.isArray(findings)) {
    throw new TypeError("Findings must be provided as an array.");
  }

  const seenCodes = new Set();
  const contributions = [];

  for (const finding of findings) {
    if (!finding || typeof finding.code !== "string") {
      continue;
    }

    const code = finding.code;

    if (seenCodes.has(code)) {
      continue;
    }

    seenCodes.add(code);

    if (!Object.hasOwn(FINDING_WEIGHTS, code)) {
  continue;
}

const points = FINDING_WEIGHTS[code];

    contributions.push({
      code,
      severity: finding.severity,
      message: finding.message,
      points,
    });
  }

  const rawScore = contributions.reduce(
    (total, contribution) => total + contribution.points,
    0
  );

  const score = Math.min(rawScore, MAX_HEURISTIC_SCORE);

  return {
    score,
    level: getRiskLevel(score),
    contributions,
    summary:
      score === 0
        ? "No suspicious URL structure indicators were detected. This does not prove the URL is safe."
        : "This score reflects suspicious URL characteristics. It is not a confirmed phishing classification.",
  };
};