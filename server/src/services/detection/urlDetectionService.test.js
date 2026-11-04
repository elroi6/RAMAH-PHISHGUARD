import test from "node:test";
import assert from "node:assert/strict";

import { detectUrl } from "./urlDetectionService.js";

test("detects a valid URL and returns its risk assessment", () => {
  const result = detectUrl("https://example.com/");

  assert.equal(result.valid, true);
  assert.equal(result.hostname, "example.com");
  assert.equal(result.risk.score, 0);
  assert.equal(result.risk.level, "LOW");
});

test("returns MODERATE risk for suspicious URLs", () => {
  const result = detectUrl("http://127.0.0.1/login");

  assert.equal(result.valid, true);
  assert.ok(result.findings.length > 0);
  assert.equal(result.risk.score, 25);
  assert.equal(result.risk.level, "MODERATE");
});

test("returns MODERATE risk when findings total 40 points", () => {
  const result = detectUrl(
    "http://192.0.2.10:22/login"
  );

  assert.equal(result.valid, true);
  assert.equal(result.risk.score, 40);
  assert.equal(result.risk.level, "MODERATE");
});

test("does not calculate risk for invalid URLs", () => {
  const result = detectUrl("not-a-valid-url");

  assert.equal(result.valid, false);
  assert.equal(result.risk, null);
});

test("does not classify a zero-score URL as guaranteed safe", () => {
  const result = detectUrl("https://example.com/");

  assert.match(
    result.risk.summary,
    /does not prove the URL is safe/i
  );
});

test("preserves score contributions in the final assessment", () => {
  const result = detectUrl("http://example.com/login");

  assert.ok(result.risk.contributions.length > 0);

  assert.ok(
    result.risk.contributions.some(
      (contribution) =>
        contribution.code === "UNENCRYPTED_HTTP"
    )
  );
});