import test from "node:test";
import assert from "node:assert/strict";

import { resolvePublicHostname } from "./dnsResolver.js";

const createLookup = (records) => async () => records;

test("resolves a hostname with public IPv4 addresses", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "8.8.8.8", family: 4 },
      { address: "1.1.1.1", family: 4 },
    ]),
  });

  assert.equal(result.valid, true);
  assert.equal(result.hostname, "example.com");
  assert.equal(result.addresses.length, 2);
});

test("resolves a hostname with public IPv6 addresses", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "2606:4700:4700::1111", family: 6 },
    ]),
  });

  assert.equal(result.valid, true);
  assert.equal(result.addresses[0].family, 6);
});

test("rejects a hostname resolving to a private IPv4 address", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "192.168.1.10", family: 4 },
    ]),
  });

  assert.equal(result.valid, false);
  assert.equal(result.addresses.length, 0);
});

test("rejects a hostname resolving to a loopback address", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "127.0.0.1", family: 4 },
    ]),
  });

  assert.equal(result.valid, false);
});

test("rejects a hostname resolving to a private IPv6 address", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "fc00::1", family: 6 },
    ]),
  });

  assert.equal(result.valid, false);
});

test("rejects mixed public and private DNS answers", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "8.8.8.8", family: 4 },
      { address: "192.168.1.10", family: 4 },
    ]),
  });

  assert.equal(result.valid, false);
  assert.equal(result.addresses.length, 0);
});

test("rejects mixed public IPv4 and private IPv6 answers", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "8.8.8.8", family: 4 },
      { address: "fe80::1", family: 6 },
    ]),
  });

  assert.equal(result.valid, false);
});

test("rejects hostnames with no DNS answers", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([]),
  });

  assert.equal(result.valid, false);
  assert.equal(result.addresses.length, 0);
});

test("rejects DNS lookup failures", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: async () => {
      throw new Error("DNS lookup failed");
    },
  });

  assert.equal(result.valid, false);
  assert.equal(result.addresses.length, 0);
});

test("rejects malformed DNS records", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "not-an-ip-address", family: 4 },
    ]),
  });

  assert.equal(result.valid, false);
});

test("removes duplicate DNS addresses", async () => {
  const result = await resolvePublicHostname("example.com", {
    lookup: createLookup([
      { address: "8.8.8.8", family: 4 },
      { address: "8.8.8.8", family: 4 },
    ]),
  });

  assert.equal(result.valid, true);
  assert.equal(result.addresses.length, 1);
});

test("normalizes uppercase hostnames", async () => {
  const result = await resolvePublicHostname("EXAMPLE.COM", {
    lookup: createLookup([
      { address: "8.8.8.8", family: 4 },
    ]),
  });

  assert.equal(result.valid, true);
  assert.equal(result.hostname, "example.com");
});

test("accepts hostnames with a trailing DNS dot", async () => {
  const result = await resolvePublicHostname("example.com.", {
    lookup: createLookup([
      { address: "8.8.8.8", family: 4 },
    ]),
  });

  assert.equal(result.valid, true);
  assert.equal(result.hostname, "example.com");
});

test("blocks localhost and local hostname suffixes", async () => {
  const hostnames = [
    "localhost",
    "printer.local",
    "service.internal",
    "test.localhost",
    "example.test",
    "example.invalid",
    "service.home.arpa",
    "example.onion",
  ];

  for (const hostname of hostnames) {
    const result = await resolvePublicHostname(hostname, {
      lookup: createLookup([
        { address: "8.8.8.8", family: 4 },
      ]),
    });

    assert.equal(result.valid, false, hostname);
  }
});

test("rejects invalid hostname input", async () => {
  const result = await resolvePublicHostname("bad_host.example", {
    lookup: createLookup([
      { address: "8.8.8.8", family: 4 },
    ]),
  });

  assert.equal(result.valid, false);
});

test("rejects empty hostname input", async () => {
  const result = await resolvePublicHostname("");

  assert.equal(result.valid, false);
});

test("rejects single-label hostnames", async () => {
  const result = await resolvePublicHostname("intranet", {
    lookup: createLookup([
      { address: "8.8.8.8", family: 4 },
    ]),
  });

  assert.equal(result.valid, false);
});

test("accepts a public IP address without performing DNS lookup", async () => {
  let lookupCalled = false;

  const result = await resolvePublicHostname("8.8.8.8", {
    lookup: async () => {
      lookupCalled = true;
      return [];
    },
  });

  assert.equal(result.valid, true);
  assert.equal(result.addresses[0].address, "8.8.8.8");
  assert.equal(lookupCalled, false);
});

test("rejects a private IP address without performing DNS lookup", async () => {
  let lookupCalled = false;

  const result = await resolvePublicHostname("127.0.0.1", {
    lookup: async () => {
      lookupCalled = true;
      return [];
    },
  });

  assert.equal(result.valid, false);
  assert.equal(lookupCalled, false);
});