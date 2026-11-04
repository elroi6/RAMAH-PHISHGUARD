import test from "node:test";
import assert from "node:assert/strict";

import { validateInspectionTarget } from "./httpTargetPolicy.js";

test("accepts a valid HTTPS URL", () => {
  const result = validateInspectionTarget("https://example.com/login");

  assert.equal(result.valid, true);
  assert.equal(result.target.protocol, "https:");
  assert.equal(result.target.hostname, "example.com");
  assert.equal(result.target.port, 443);
  assert.equal(result.target.requestPath, "/login");
});

test("accepts a valid HTTP URL", () => {
  const result = validateInspectionTarget("http://example.com");

  assert.equal(result.valid, true);
  assert.equal(result.target.port, 80);
  assert.equal(result.target.requestPath, "/");
});

test("accepts HTTPS with an explicit default port", () => {
  const result = validateInspectionTarget("https://example.com:443/path");

  assert.equal(result.valid, true);
  assert.equal(result.target.port, 443);
});

test("accepts HTTP with an explicit default port", () => {
  const result = validateInspectionTarget("http://example.com:80/path");

  assert.equal(result.valid, true);
  assert.equal(result.target.port, 80);
});

test("rejects unsupported protocols", () => {
  const protocols = [
    "ftp://example.com",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "ws://example.com",
  ];

  for (const input of protocols) {
    assert.equal(
      validateInspectionTarget(input).valid,
      false,
      input
    );
  }
});

test("rejects non-standard HTTP ports", () => {
  const result = validateInspectionTarget("http://example.com:8080");

  assert.equal(result.valid, false);
});

test("rejects non-standard HTTPS ports", () => {
  const result = validateInspectionTarget("https://example.com:8443");

  assert.equal(result.valid, false);
});

test("rejects HTTPS using HTTP port", () => {
  const result = validateInspectionTarget("https://example.com:80");

  assert.equal(result.valid, false);
});

test("rejects HTTP using HTTPS port", () => {
  const result = validateInspectionTarget("http://example.com:443");

  assert.equal(result.valid, false);
});

test("rejects embedded username and password", () => {
  const result = validateInspectionTarget(
    "https://user:password@example.com"
  );

  assert.equal(result.valid, false);
});

test("removes URL fragments from the inspection target", () => {
  const result = validateInspectionTarget(
    "https://example.com/path?next=home#section"
  );

  assert.equal(result.valid, true);
  assert.equal(result.target.url, "https://example.com/path?next=home");
  assert.equal(result.target.requestPath, "/path?next=home");
});

test("preserves query parameters", () => {
  const result = validateInspectionTarget(
    "https://example.com/search?q=security"
  );

  assert.equal(result.valid, true);
  assert.equal(result.target.requestPath, "/search?q=security");
});

test("normalizes uppercase hostnames", () => {
  const result = validateInspectionTarget("HTTPS://EXAMPLE.COM/path");

  assert.equal(result.valid, true);
  assert.equal(result.target.hostname, "example.com");
});

test("handles IPv4 hostname targets", () => {
  const result = validateInspectionTarget("https://8.8.8.8");

  assert.equal(result.valid, true);
  assert.equal(result.target.hostname, "8.8.8.8");
});

test("handles IPv6 hostname targets", () => {
  const result = validateInspectionTarget("https://[2606:4700:4700::1111]");

  assert.equal(result.valid, true);
  assert.equal(result.target.hostname, "2606:4700:4700::1111");
});

test("rejects empty input", () => {
  assert.equal(validateInspectionTarget("").valid, false);
});

test("rejects whitespace-only input", () => {
  assert.equal(validateInspectionTarget("   ").valid, false);
});

test("rejects non-string input", () => {
  assert.equal(validateInspectionTarget(null).valid, false);
});

test("rejects malformed URLs", () => {
  assert.equal(validateInspectionTarget("https://").valid, false);
});

test("rejects URLs exceeding the maximum length", () => {
  const input = `https://example.com/${"a".repeat(2050)}`;

  assert.equal(validateInspectionTarget(input).valid, false);
});