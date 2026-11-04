import test from "node:test";
import assert from "node:assert/strict";

import { inspectIpAddress } from "./ipSafety.js";

test("accepts a public IPv4 address", () => {
  const result = inspectIpAddress("8.8.8.8");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, true);
  assert.equal(result.normalizedAddress, "8.8.8.8");
  assert.equal(result.range, "unicast");
  assert.equal(result.reason, null);
});

test("accepts another public IPv4 address", () => {
  const result = inspectIpAddress("1.1.1.1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, true);
});

test("blocks private IPv4 addresses", () => {
  const addresses = [
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
  ];

  for (const address of addresses) {
    const result = inspectIpAddress(address);

    assert.equal(result.valid, true, address);
    assert.equal(result.isPublic, false, address);
  }
});

test("blocks IPv4 loopback addresses", () => {
  const result = inspectIpAddress("127.0.0.1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
  assert.equal(result.range, "loopback");
});

test("blocks IPv4 link-local addresses", () => {
  const result = inspectIpAddress("169.254.10.20");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
  assert.equal(result.range, "linkLocal");
});

test("blocks carrier-grade NAT addresses", () => {
  const result = inspectIpAddress("100.64.0.1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
});

test("blocks IPv4 multicast addresses", () => {
  const result = inspectIpAddress("224.0.0.1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
});

test("blocks IPv4 broadcast addresses", () => {
  const result = inspectIpAddress("255.255.255.255");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
});

test("blocks IPv4 documentation addresses", () => {
  const addresses = [
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
  ];

  for (const address of addresses) {
    const result = inspectIpAddress(address);

    assert.equal(result.valid, true, address);
    assert.equal(result.isPublic, false, address);
  }
});

test("accepts a public IPv6 address", () => {
  const result = inspectIpAddress("2606:4700:4700::1111");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, true);
});

test("blocks IPv6 loopback addresses", () => {
  const result = inspectIpAddress("::1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
  assert.equal(result.range, "loopback");
});

test("blocks IPv6 unique-local addresses", () => {
  const result = inspectIpAddress("fc00::1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
});

test("blocks IPv6 link-local addresses", () => {
  const result = inspectIpAddress("fe80::1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
});

test("blocks IPv6 multicast addresses", () => {
  const result = inspectIpAddress("ff02::1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
});

test("blocks IPv4-mapped IPv6 addresses when the mapped IPv4 is private", () => {
  const result = inspectIpAddress("::ffff:192.168.1.1");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, false);
  assert.equal(result.normalizedAddress, "192.168.1.1");
});

test("accepts IPv4-mapped IPv6 addresses when the mapped IPv4 is public", () => {
  const result = inspectIpAddress("::ffff:8.8.8.8");

  assert.equal(result.valid, true);
  assert.equal(result.isPublic, true);
  assert.equal(result.normalizedAddress, "8.8.8.8");
});

test("rejects invalid IP addresses", () => {
  const result = inspectIpAddress("999.999.999.999");

  assert.equal(result.valid, false);
  assert.equal(result.isPublic, false);
  assert.equal(result.normalizedAddress, null);
});

test("rejects empty input", () => {
  const result = inspectIpAddress("");

  assert.equal(result.valid, false);
  assert.equal(result.isPublic, false);
});

test("rejects non-string input", () => {
  const result = inspectIpAddress(12345);

  assert.equal(result.valid, false);
  assert.equal(result.isPublic, false);
});

test("blocks unspecified and reserved IPv4 addresses", () => {
  const addresses = [
    "0.0.0.0",
    "0.1.2.3",
    "192.0.0.1",
    "192.88.99.1",
    "198.18.0.1",
    "240.0.0.1",
  ];

  for (const address of addresses) {
    const result = inspectIpAddress(address);

    assert.equal(result.valid, true, address);
    assert.equal(result.isPublic, false, address);
  }
});

test("blocks special-purpose IPv6 addresses", () => {
  const addresses = [
    "2001:db8::1",
    "2001:2::1",
    "100::1",
    "2001:10::1",
  ];

  for (const address of addresses) {
    const result = inspectIpAddress(address);

    assert.equal(result.valid, true, address);
    assert.equal(result.isPublic, false, address);
  }
});