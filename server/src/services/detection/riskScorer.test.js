import test from "node:test";
import assert from "node:assert/strict";

import { calculateRiskScore } from "./riskScorer.js";

test("returns LOW risk when there are no findings", () => {
  const result = calculateRiskScore([]);

  assert.equal(result.score, 0);
  assert.equal(result.level, "LOW");
  assert.equal(result.contributions.length, 0);
});

test("assigns the correct weight to an IP address hostname", () => {
  const result = calculateRiskScore([
    {
      code: "IP_ADDRESS_HOST",
      severity: "medium",
      message: "The URL uses an IP address.",
    },
  ]);

  assert.equal(result.score, 15);
  assert.equal(result.level, "LOW");
});

test("calculates the combined score of multiple findings", () => {
  const result = calculateRiskScore([
    { code: "IP_ADDRESS_HOST" },
    { code: "UNENCRYPTED_HTTP" },
    { code: "SUSPICIOUS_PATH_KEYWORD" },
  ]);

  assert.equal(result.score, 25);
  assert.equal(result.level, "MODERATE");
});

test("assigns LOW risk below 25 points", () => {
  const result = calculateRiskScore([
    { code: "UNENCRYPTED_HTTP" },
    { code: "LONG_URL" },
    { code: "SUSPICIOUS_PATH_KEYWORD" },
  ]);

  assert.equal(result.score, 15);
  assert.equal(result.level, "LOW");
});

test("assigns MODERATE risk at exactly 25 points", () => {
  const result = calculateRiskScore([
    { code: "IP_ADDRESS_HOST" },
    { code: "UNENCRYPTED_HTTP" },
    { code: "SUSPICIOUS_PATH_KEYWORD" },
  ]);

  assert.equal(result.score, 25);
  assert.equal(result.level, "MODERATE");
});

test("assigns HIGH risk at exactly 50 points", () => {
  const result = calculateRiskScore([
    { code: "IP_ADDRESS_HOST" },          // 15
    { code: "UNUSUAL_PORT" },             // 15
    { code: "EXCESSIVE_SUBDOMAINS" },     // 10
    { code: "UNENCRYPTED_HTTP" },         // 5
    { code: "LONG_URL" },                 // 5
  ]);

  assert.equal(result.score, 50);
  assert.equal(result.level, "HIGH");
});

test("caps heuristic scores at 74 points", () => {
  const result = calculateRiskScore([
    { code: "IP_ADDRESS_HOST" },
    { code: "UNUSUAL_PORT" },
    { code: "PUNYCODE_HOSTNAME" },
    { code: "EXCESSIVE_SUBDOMAINS" },
    { code: "UNENCRYPTED_HTTP" },
    { code: "LONG_URL" },
    { code: "SUSPICIOUS_PATH_KEYWORD" },
    { code: "SUSPICIOUS_QUERY_PARAMETER" },
  ]);

  assert.equal(result.score, 74);
  assert.equal(result.level, "HIGH");
});

test("does not count duplicate finding codes twice", () => {
  const result = calculateRiskScore([
    { code: "IP_ADDRESS_HOST" },
    { code: "IP_ADDRESS_HOST" },
  ]);

  assert.equal(result.score, 15);
  assert.equal(result.contributions.length, 1);
});

test("ignores unknown finding codes", () => {
  const result = calculateRiskScore([
    { code: "UNKNOWN_FINDING" },
  ]);

  assert.equal(result.score, 0);
  assert.equal(result.level, "LOW");
});

test("ignores findings without a valid code", () => {
  const result = calculateRiskScore([
    null,
    {},
    { code: 123 },
    { code: "UNENCRYPTED_HTTP" },
  ]);

  assert.equal(result.score, 5);
});

test("rejects non-array findings input", () => {
  assert.throws(
    () => calculateRiskScore("UNENCRYPTED_HTTP"),
    {
      name: "TypeError",
      message: "Findings must be provided as an array.",
    }
  );
});

test("returns score contributions with their finding details", () => {
  const result = calculateRiskScore([
    {
      code: "UNENCRYPTED_HTTP",
      severity: "low",
      message: "The URL uses HTTP.",
    },
  ]);

  assert.deepEqual(result.contributions, [
    {
      code: "UNENCRYPTED_HTTP",
      severity: "low",
      message: "The URL uses HTTP.",
      points: 5,
    },
  ]);
});

test("does not describe a zero score as proof of safety", () => {
  const result = calculateRiskScore([]);

  assert.match(result.summary, /does not prove the URL is safe/i);
});
test("ignores inherited object property names as finding codes", () => {
  const result = calculateRiskScore([
    {
      code: "constructor",
      severity: "high",
      message: "Unexpected finding",
    },
    {
      code: "toString",
      severity: "high",
      message: "Unexpected finding",
    },
  ]);

  assert.equal(result.score, 0);
  assert.equal(result.level, "LOW");
  assert.equal(result.contributions.length, 0);
});