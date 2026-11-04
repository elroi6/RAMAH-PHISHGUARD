import test from "node:test";
import assert from "node:assert/strict";

import { inspectHttpUrl } from "./safeHttpInspector.js";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

import { requestPinned } from "./httpTransport.js";
const createResponse = ({
  statusCode = 200,
  location,
  body = "OK",
} = {}) => ({
  statusCode,
  headers: location ? { location } : {},
  body: Buffer.from(body),
  bytesReceived: Buffer.byteLength(body),
});

const createMockRequest = (responses) => {
  const calls = [];

  const request = async (url, options) => {
    calls.push({ url, options });

    const response = responses.shift();

    if (!response) {
      throw new Error("Unexpected HTTP request.");
    }

    return response;
  };

  return {
    request,
    calls,
  };
};

test("returns a normal HTTP response", async () => {
  const mock = createMockRequest([
    createResponse({ body: "Website content" }),
  ]);

  const result = await inspectHttpUrl(
    "https://example.com/",
    { request: mock.request }
  );

  assert.equal(result.statusCode, 200);
  assert.equal(result.finalUrl, "https://example.com/");
  assert.equal(result.totalBytesReceived, 15);
  assert.equal(result.redirects.length, 0);
  assert.equal(mock.calls.length, 1);
});

test("follows a valid HTTPS redirect", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 301,
      location: "https://destination.example/",
    }),
    createResponse({ body: "Final page" }),
  ]);

  const result = await inspectHttpUrl(
    "https://example.com/",
    { request: mock.request }
  );

  assert.equal(result.statusCode, 200);
  assert.equal(
    result.finalUrl,
    "https://destination.example/"
  );
  assert.equal(result.redirects.length, 1);
  assert.equal(mock.calls.length, 2);
});

test("supports relative redirect locations", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "/login",
    }),
    createResponse(),
  ]);

  const result = await inspectHttpUrl(
    "https://example.com/start",
    { request: mock.request }
  );

  assert.equal(
    result.finalUrl,
    "https://example.com/login"
  );
  assert.equal(result.redirects.length, 1);
});

test("rejects redirects to private IPv4 addresses before requesting them", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "http://192.168.1.10/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /Unsafe redirect destination/
  );

  assert.equal(mock.calls.length, 1);
});

test("rejects redirects to localhost before requesting them", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "http://127.0.0.1/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /Unsafe redirect destination/
  );

  assert.equal(mock.calls.length, 1);
});

test("rejects redirects to unsupported protocols", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "file:///etc/passwd",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /Unsafe redirect destination/
  );

  assert.equal(mock.calls.length, 1);
});

test("rejects redirects to non-standard ports", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "https://destination.example:8443/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /Unsafe redirect destination/
  );

  assert.equal(mock.calls.length, 1);
});

test("detects redirect loops", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "https://example.com/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /redirect loop/
  );

  assert.equal(mock.calls.length, 1);
});

test("enforces the maximum redirect count", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "https://second.example/",
    }),
    createResponse({
      statusCode: 302,
      location: "https://third.example/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
      maxRedirects: 1,
    }),
    /maximum redirect count/
  );

  assert.equal(mock.calls.length, 2);
});

test("rejects malformed redirect locations", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "http://[invalid-ipv6/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /redirect location is malformed/
  );

  assert.equal(mock.calls.length, 1);
});

test("enforces the total response size limit", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "https://destination.example/",
      body: "123456",
    }),
    createResponse({
      body: "789012",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
      maxTotalResponseBytes: 10,
    }),
    /response size limit/
  );

  assert.equal(mock.calls.length, 2);
});

test("rejects invalid response byte counts", async () => {
  const mock = createMockRequest([
    {
      statusCode: 200,
      headers: {},
      body: Buffer.from("OK"),
      bytesReceived: -1,
    },
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /Invalid HTTP response size/
  );
});

test("rejects invalid redirect configuration", async () => {
  const mock = createMockRequest([]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
      maxRedirects: -1,
    }),
    /Invalid maximum redirect count/
  );
});

test("rejects invalid total response size configuration", async () => {
  const mock = createMockRequest([]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
      maxTotalResponseBytes: 0,
    }),
    /Invalid total response size limit/
  );
});
test("performs fresh DNS resolution and IP pinning for every redirect", async () => {
  const resolutions = [];
  const pinnedAddresses = [];

  const responses = [
    {
      statusCode: 302,
      location: "https://destination.example/",
      body: "",
    },
    {
      statusCode: 200,
      body: "Final page",
    },
  ];

  const resolveHostname = async (hostname) => {
    resolutions.push(hostname);

    const address =
      resolutions.length === 1 ? "8.8.8.8" : "1.1.1.1";

    return {
      valid: true,
      hostname,
      addresses: [
        {
          address,
          family: 4,
        },
      ],
      reason: null,
    };
  };

  const requestImpl = (options, callback) => {
    options.lookup(options.hostname, {}, (error, address) => {
      if (error) throw error;
      pinnedAddresses.push(address);
    });

    const request = new EventEmitter();

    request.setTimeout = () => {};

    request.end = () => {
      const config = responses.shift();

      if (!config) {
        throw new Error("Unexpected HTTP request.");
      }

      process.nextTick(() => {
        const response = Readable.from([
          Buffer.from(config.body),
        ]);

        response.statusCode = config.statusCode;
        response.headers = config.location
          ? { location: config.location }
          : {};

        callback(response);
      });
    };

    request.destroy = (error) => {
      if (error) request.emit("error", error);
    };

    return request;
  };

  const request = (url, options) =>
    requestPinned(url, {
      ...options,
      resolveHostname,
      requestImpl,
    });

  const result = await inspectHttpUrl(
    "https://example.com/",
    { request }
  );

  assert.equal(result.statusCode, 200);

  assert.deepEqual(resolutions, [
    "example.com",
    "destination.example",
  ]);

  assert.deepEqual(pinnedAddresses, [
    "8.8.8.8",
    "1.1.1.1",
  ]);

  assert.equal(result.redirects.length, 1);
});
test("rejects redirects to private IPv6 addresses", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "http://[::1]/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /Unsafe redirect destination/
  );

  assert.equal(mock.calls.length, 1);
});

test("rejects redirects to unique-local IPv6 addresses", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "http://[fc00::1]/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /Unsafe redirect destination/
  );

  assert.equal(mock.calls.length, 1);
});

test("rejects redirects containing embedded credentials", async () => {
  const mock = createMockRequest([
    createResponse({
      statusCode: 302,
      location: "https://admin:password@destination.example/",
    }),
  ]);

  await assert.rejects(
    inspectHttpUrl("https://example.com/", {
      request: mock.request,
    }),
    /Unsafe redirect destination/
  );

  assert.equal(mock.calls.length, 1);
});


test("passes a shared deadline and bounded timeouts to the transport", async () => {
  let receivedOptions;

  const request = async (url, options) => {
    receivedOptions = options;

    return createResponse();
  };

  const startedAt = Date.now();

  await inspectHttpUrl("https://example.com/", {
    request,
    totalTimeoutMs: 10000,
    requestOptions: {
      requestTimeoutMs: 8000,
      dnsTimeoutMs: 4000,
    },
  });

  assert.ok(Number.isSafeInteger(receivedOptions.deadlineAtMs));
  assert.ok(receivedOptions.deadlineAtMs > startedAt);

  assert.equal(receivedOptions.requestTimeoutMs, 8000);
  assert.equal(receivedOptions.dnsTimeoutMs, 4000);

  assert.ok(
    receivedOptions.requestTimeoutMs <=
      receivedOptions.deadlineAtMs - Date.now() + 100
  );
});

test("reuses the same deadline across redirect requests", async () => {
  const receivedOptions = [];

  const responses = [
    createResponse({
      statusCode: 302,
      location: "https://destination.example/",
    }),
    createResponse({ body: "Final page" }),
  ];

  const request = async (url, options) => {
    receivedOptions.push({
      url,
      deadlineAtMs: options.deadlineAtMs,
    });

    return responses.shift();
  };

  await inspectHttpUrl("https://example.com/", {
    request,
    totalTimeoutMs: 10000,
  });

  assert.equal(receivedOptions.length, 2);

  assert.equal(
    receivedOptions[0].deadlineAtMs,
    receivedOptions[1].deadlineAtMs
  );

  assert.equal(
    receivedOptions[0].deadlineAtMs,
    receivedOptions[0].deadlineAtMs
  );
});

test("rejects malformed HTTP responses", async (t) => {
  const invalidResponses = [
    {
      name: "null response",
      response: null,
    },
    {
      name: "missing status code",
      response: {
        headers: {},
        bytesReceived: 0,
      },
    },
    {
      name: "invalid status code",
      response: {
        statusCode: 700,
        headers: {},
        bytesReceived: 0,
      },
    },
    {
      name: "missing headers",
      response: {
        statusCode: 200,
        bytesReceived: 0,
      },
    },
    {
      name: "array headers",
      response: {
        statusCode: 200,
        headers: [],
        bytesReceived: 0,
      },
    },
  ];

  for (const item of invalidResponses) {
    await t.test(item.name, async () => {
      const request = async () => item.response;

      await assert.rejects(
        inspectHttpUrl("https://example.com/", {
          request,
        }),
        /HTTP response is invalid/
      );
    });
  }
});
test("rejects invalid HTTP request timeout options", async () => {
  const invalidValues = [
    0,
    -1,
    1.5,
    "5000",
    2_147_483_648,
  ];

  for (const value of invalidValues) {
    await assert.rejects(
      inspectHttpUrl("https://example.com", {
        requestOptions: {
          requestTimeoutMs: value,
        },
      }),
      {
        name: "TypeError",
        message: "Invalid HTTP request timeout.",
      }
    );
  }
});

test("rejects invalid DNS timeout options", async () => {
  const invalidValues = [
    0,
    -1,
    1.5,
    "3000",
    2_147_483_648,
  ];

  for (const value of invalidValues) {
    await assert.rejects(
      inspectHttpUrl("https://example.com", {
        requestOptions: {
          dnsTimeoutMs: value,
        },
      }),
      {
        name: "TypeError",
        message: "Invalid DNS resolution timeout.",
      }
    );
  }
});

test("rejects invalid HTTP response size options", async () => {
  const invalidValues = [
    0,
    -1,
    1.5,
    "1024",
    Infinity,
  ];

  for (const value of invalidValues) {
    await assert.rejects(
      inspectHttpUrl("https://example.com", {
        requestOptions: {
          maxResponseBytes: value,
        },
      }),
      {
        name: "TypeError",
        message: "Invalid HTTP response size limit.",
      }
    );
  }
});