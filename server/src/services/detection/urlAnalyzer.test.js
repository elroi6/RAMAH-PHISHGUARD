import test from "node:test";
import assert from "node:assert/strict";

import { analyzeUrl } from "./urlAnalyzer.js";

test("accepts a valid HTTPS URL", () => {
  const result = analyzeUrl("https://example.com");

  assert.equal(result.valid, true);
  assert.equal(result.hostname, "example.com");
  assert.equal(result.isIpAddress, false);
});

test("accepts HTTP and detects unencrypted HTTP", () => {
  const result = analyzeUrl("http://example.com");

  assert.ok(result.findings.some(
    (f) => f.code === "UNENCRYPTED_HTTP"
  ));
});

test("detects IPv4 address hosts", () => {
  const result = analyzeUrl("http://192.168.1.10");

  assert.equal(result.isIpAddress, true);
  assert.ok(result.findings.some(
    (f) => f.code === "IP_ADDRESS_HOST"
  ));
});

test("detects IPv6 address hosts", () => {
  const result = analyzeUrl("http://[::1]/");

  assert.equal(result.isIpAddress, true);
  assert.ok(result.findings.some(
    (f) => f.code === "IP_ADDRESS_HOST"
  ));
});

test("detects suspicious login paths", () => {
  const result = analyzeUrl("https://example.com/login");

  assert.ok(result.findings.some(
    (f) => f.code === "SUSPICIOUS_PATH_KEYWORD"
  ));
});

test("does not match login inside unrelated words", () => {
  const result = analyzeUrl("https://example.com/catalog");

  assert.equal(result.findings.length, 0);
});


test("does not match login embedded inside a larger path word", () => {
  const result = analyzeUrl("https://example.com/myloginpage");

  assert.equal(result.valid, true);
  assert.equal(
    result.findings.some((f) => f.code === "SUSPICIOUS_PATH_KEYWORD"),
    false
  );
});

test("detects login surrounded by path separators", () => {
  const result = analyzeUrl("https://example.com/my-login-page");

  assert.ok(result.findings.some(
    (f) => f.code === "SUSPICIOUS_PATH_KEYWORD"
  ));
});


test("detects suspicious query parameter names", () => {
  const result = analyzeUrl(
    "https://example.com/page?redirect=https://other.com"
  );

  assert.ok(result.findings.some(
    (f) => f.code === "SUSPICIOUS_QUERY_PARAMETER"
  ));
});

test("does not match suspicious words inside unrelated parameter names", () => {
  const result = analyzeUrl(
    "https://example.com/page?myredirect=value"
  );

  assert.equal(result.findings.length, 0);
});

test("rejects empty input", () => {
  assert.equal(analyzeUrl("").valid, false);
});

test("rejects whitespace-only input", () => {
  assert.equal(analyzeUrl("   ").valid, false);
});

test("rejects non-string input", () => {
  assert.equal(analyzeUrl(12345).valid, false);
});

test("rejects malformed URLs", () => {
  assert.equal(analyzeUrl("https://").valid, false);
});

test("rejects unsupported protocols", () => {
  const result = analyzeUrl("ftp://example.com");

  assert.equal(result.valid, false);
  assert.match(result.error, /HTTP and HTTPS/);
});

test("rejects embedded credentials", () => {
  const result = analyzeUrl(
    "https://admin:password@example.com"
  );

  assert.equal(result.valid, false);
  assert.match(result.error, /credentials/);
});

test("rejects URLs exceeding maximum length", () => {
  const result = analyzeUrl(
    `https://example.com/${"a".repeat(2050)}`
  );

  assert.equal(result.valid, false);
  assert.match(result.error, /2048/);
});

test("rejects hostnames containing underscores", () => {
  const result = analyzeUrl("https://exa_mple.com/");

  assert.equal(result.valid, false);
  assert.equal(result.error, "The URL contains an invalid hostname.");
});

test("rejects hostname labels ending with hyphens", () => {
  const result = analyzeUrl("https://bad-.example/");

  assert.equal(result.valid, false);
  assert.equal(result.error, "The URL contains an invalid hostname.");
});

test("accepts valid hostnames with a trailing dot", () => {
  const result = analyzeUrl("https://example.com./");

  assert.equal(result.valid, true);
  assert.equal(result.hostname, "example.com.");
});

test("accepts valid single-label hostnames", () => {
  const result = analyzeUrl("https://localhost/");

  assert.equal(result.valid, true);
});

test("normalizes uppercase hostnames", () => {
  const result = analyzeUrl("https://EXAMPLE.COM/login");

  assert.equal(result.hostname, "example.com");
});

test("detects Punycode hostnames", () => {
  const result = analyzeUrl("https://xn--e1afmkfd.example");

  assert.ok(result.findings.some(
    (f) => f.code === "PUNYCODE_HOSTNAME"
  ));
});

test("detects unusual ports", () => {
  const result = analyzeUrl("http://example.com:22/");

  assert.ok(result.findings.some(
    (f) => f.code === "UNUSUAL_PORT"
  ));
});

test("detects excessive subdomains", () => {
  const result = analyzeUrl(
    "https://a.b.c.d.example.com"
  );

  assert.ok(result.findings.some(
    (f) => f.code === "EXCESSIVE_SUBDOMAINS"
  ));
});
test("does not count a trailing DNS dot as an extra subdomain", () => {
  const result = analyzeUrl("https://a.b.example.com./");

  assert.equal(result.valid, true);
  assert.equal(
    result.findings.some((f) => f.code === "EXCESSIVE_SUBDOMAINS"),
    false
  );
});

test("detects unusually long URLs", () => {
  const result = analyzeUrl(
    `https://example.com/${"a".repeat(190)}`
  );

  assert.ok(result.findings.some(
    (f) => f.code === "LONG_URL"
  ));
});

test("accepts ordinary paths without suspicious findings", () => {
  const result = analyzeUrl("https://example.com/about");

  assert.equal(result.valid, true);
  assert.equal(result.findings.length, 0);
});