import test from "node:test";
import assert from "node:assert/strict";

import { redactUrl } from "./urlPrivacy.js";

test("redacts all query parameter values", () => {
  const result = redactUrl(
    "https://example.com/login?token=SECRET123&next=/account"
  );

  assert.equal(
    result,
    "https://example.com/login?token=%5BREDACTED%5D&next=%5BREDACTED%5D"
  );
});

test("removes URL fragments", () => {
  assert.equal(
    redactUrl("https://example.com/login#secret"),
    "https://example.com/login"
  );
});

test("preserves URLs without query parameters", () => {
  assert.equal(
    redactUrl("https://example.com/login"),
    "https://example.com/login"
  );
});

test("handles invalid input safely", () => {
  assert.equal(redactUrl("not a URL"), "[INVALID URL]");
});

test("handles empty input safely", () => {
  assert.equal(redactUrl(""), "[INVALID URL]");
});
test("removes embedded URL credentials", () => {
  assert.equal(
    redactUrl("https://user:password@example.com/login"),
    "https://example.com/login"
  );
});