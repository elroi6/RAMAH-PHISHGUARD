import test from "node:test";
import assert from "node:assert/strict";

import { createPinnedLookup } from "./pinnedLookup.js";

test("returns the pinned IPv4 address", async () => {
  const lookup = createPinnedLookup("example.com", "8.8.8.8");

  const result = await new Promise((resolve, reject) => {
    lookup("example.com", {}, (error, address, family) => {
      if (error) return reject(error);
      resolve({ address, family });
    });
  });

  assert.deepEqual(result, {
    address: "8.8.8.8",
    family: 4,
  });
});

test("returns the pinned IPv6 address", async () => {
  const lookup = createPinnedLookup(
    "example.com",
    "2606:4700:4700::1111"
  );

  const result = await new Promise((resolve, reject) => {
    lookup("example.com", {}, (error, address, family) => {
      if (error) return reject(error);
      resolve({ address, family });
    });
  });

  assert.equal(result.address, "2606:4700:4700::1111");
  assert.equal(result.family, 6);
});

test("supports Node lookup all option", async () => {
  const lookup = createPinnedLookup("example.com", "8.8.8.8");

  const records = await new Promise((resolve, reject) => {
    lookup("example.com", { all: true }, (error, addresses) => {
      if (error) return reject(error);
      resolve(addresses);
    });
  });

  assert.deepEqual(records, [
    { address: "8.8.8.8", family: 4 },
  ]);
});

test("accepts hostname case differences", async () => {
  const lookup = createPinnedLookup("example.com", "8.8.8.8");

  const result = await new Promise((resolve, reject) => {
    lookup("EXAMPLE.COM", {}, (error, address, family) => {
      if (error) return reject(error);
      resolve({ address, family });
    });
  });

  assert.equal(result.address, "8.8.8.8");
});

test("accepts a trailing DNS dot", async () => {
  const lookup = createPinnedLookup("example.com", "8.8.8.8");

  const result = await new Promise((resolve, reject) => {
    lookup("example.com.", {}, (error, address, family) => {
      if (error) return reject(error);
      resolve({ address, family });
    });
  });

  assert.equal(result.address, "8.8.8.8");
});

test("rejects a different hostname", async () => {
  const lookup = createPinnedLookup("example.com", "8.8.8.8");

  const error = await new Promise((resolve) => {
    lookup("attacker.example", {}, (err) => resolve(err));
  });

  assert.equal(error.code, "ERR_DNS_PIN_MISMATCH");
});

test("rejects a mismatched IP family", async () => {
  const lookup = createPinnedLookup("example.com", "8.8.8.8");

  const error = await new Promise((resolve) => {
    lookup(
      "example.com",
      { family: 6 },
      (err) => resolve(err)
    );
  });

  assert.equal(error.code, "ERR_DNS_PIN_FAMILY_MISMATCH");
});

test("rejects private pinned addresses", () => {
  assert.throws(
    () => createPinnedLookup("example.com", "192.168.1.10"),
    /not publicly routable/
  );
});

test("rejects loopback pinned addresses", () => {
  assert.throws(
    () => createPinnedLookup("example.com", "127.0.0.1"),
    /not publicly routable/
  );
});

test("rejects invalid pinned addresses", () => {
  assert.throws(
    () => createPinnedLookup("example.com", "not-an-ip"),
    /not publicly routable/
  );
});

test("rejects an empty hostname", () => {
  assert.throws(
    () => createPinnedLookup("", "8.8.8.8"),
    /hostname must be provided/
  );
});

test("rejects an empty pinned address", () => {
  assert.throws(
    () => createPinnedLookup("example.com", ""),
    /pinned IP address must be provided/
  );
});

test("supports the lookup callback without options", async () => {
  const lookup = createPinnedLookup("example.com", "8.8.8.8");

  const result = await new Promise((resolve, reject) => {
    lookup("example.com", (error, address, family) => {
      if (error) return reject(error);
      resolve({ address, family });
    });
  });

  assert.deepEqual(result, {
    address: "8.8.8.8",
    family: 4,
  });
});