import test from "node:test";
import assert from "node:assert/strict";

import { requestPinned } from "./httpTransport.js";
import { EventEmitter } from "node:events";

const publicResolution = async () => ({
  valid: true,
  hostname: "example.com",
  addresses: [
    { address: "8.8.8.8", family: 4 },
  ],
  reason: null,
});

const createMockRequest = ({
  statusCode = 200,
  headers = {},
  chunks = ["OK"],
} = {}) => {
  let capturedOptions;

  const requestImpl = (options, callback) => {
    capturedOptions = options;

    const requestHandlers = {};
    const responseHandlers = {};

    const response = {
      statusCode,
      headers,

      on(event, handler) {
        responseHandlers[event] = handler;
        return this;
      },

      destroy(error) {
  if (error) {
    responseHandlers.error?.(error);
  }
},
    };

    const request = {
      on(event, handler) {
        requestHandlers[event] = handler;
        return this;
      },

      setTimeout() {
        return this;
      },

      end() {
        callback(response);

        for (const chunk of chunks) {
          responseHandlers.data?.(Buffer.from(chunk));
        }

        responseHandlers.end?.();
      },

      destroy(error) {
        requestHandlers.error?.(error);
      },
    };

    return request;
  };

  return {
    requestImpl,
    getOptions: () => capturedOptions,
  };
};

test("makes a pinned HTTPS request", async () => {
  const mock = createMockRequest({
    statusCode: 200,
    chunks: ["Hello", " world"],
  });

  const result = await requestPinned("https://example.com/", {
    resolveHostname: publicResolution,
    requestImpl: mock.requestImpl,
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.toString(), "Hello world");
  assert.equal(result.pinnedAddress, "8.8.8.8");

  const options = mock.getOptions();

  assert.equal(options.protocol, "https:");
  assert.equal(options.hostname, "example.com");
  assert.equal(options.port, 443);
  assert.equal(options.method, "GET");
  assert.equal(options.servername, "example.com");
  assert.equal(options.rejectUnauthorized, true);
  assert.equal(options.agent, false);
});

test("makes a pinned HTTP request", async () => {
  const mock = createMockRequest();

  await requestPinned("http://example.com/", {
    resolveHostname: publicResolution,
    requestImpl: mock.requestImpl,
  });

  const options = mock.getOptions();

  assert.equal(options.protocol, "http:");
  assert.equal(options.port, 80);
  assert.equal(options.method, "GET");
  assert.equal(options.agent, false);
});

test("uses the pinned IP through the lookup callback", async () => {
  const mock = createMockRequest();

  await requestPinned("https://example.com/", {
    resolveHostname: publicResolution,
    requestImpl: mock.requestImpl,
  });

  const options = mock.getOptions();

  const result = await new Promise((resolve, reject) => {
    options.lookup("example.com", {}, (error, address, family) => {
      if (error) return reject(error);
      resolve({ address, family });
    });
  });

  assert.deepEqual(result, {
    address: "8.8.8.8",
    family: 4,
  });
});

test("does not send the request when DNS validation fails", async () => {
  let requestCalled = false;

  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: async () => ({
        valid: false,
        addresses: [],
        reason: "Unsafe destination",
      }),
      requestImpl: () => {
        requestCalled = true;
      },
    }),
    /Unsafe destination/
  );

  assert.equal(requestCalled, false);
});

test("does not send the request when DNS resolution returns a private IP", async () => {
  let requestCalled = false;

  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: async () => ({
        valid: true,
        addresses: [
          { address: "192.168.1.10", family: 4 },
        ],
      }),
      requestImpl: () => {
        requestCalled = true;
      },
    })
  );

  assert.equal(requestCalled, false);
});

test("rejects unsupported URL protocols before requesting", async () => {
  let requestCalled = false;

  await assert.rejects(
    requestPinned("ftp://example.com/", {
      requestImpl: () => {
        requestCalled = true;
      },
    }),
    /Only HTTP and HTTPS/
  );

  assert.equal(requestCalled, false);
});

test("rejects non-standard ports before requesting", async () => {
  let requestCalled = false;

  await assert.rejects(
    requestPinned("https://example.com:8443/", {
      requestImpl: () => {
        requestCalled = true;
      },
    })
  );

  assert.equal(requestCalled, false);
});

test("rejects invalid transport limits", async () => {
  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: publicResolution,
      requestTimeoutMs: 0,
    }),
    /Invalid HTTP transport limits/
  );
});

test("rejects responses exceeding the content-length limit", async () => {
  const mock = createMockRequest({
    headers: {
      "content-length": "100",
    },
  });

  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: publicResolution,
      maxResponseBytes: 10,
      requestImpl: mock.requestImpl,
    }),
    /response exceeds the size limit/
  );
});

test("rejects responses exceeding the streamed size limit", async () => {
  const mock = createMockRequest({
    chunks: ["123456", "789012"],
  });

  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: publicResolution,
      maxResponseBytes: 10,
      requestImpl: mock.requestImpl,
    }),
    /response exceeds the size limit/
  );
});

test("does not automatically follow redirects", async () => {
  const mock = createMockRequest({
    statusCode: 302,
    headers: {
      location: "https://attacker.example/",
    },
  });

  const result = await requestPinned("https://example.com/", {
    resolveHostname: publicResolution,
    requestImpl: mock.requestImpl,
  });

  assert.equal(result.statusCode, 302);
  assert.equal(
    result.headers.location,
    "https://attacker.example/"
  );
});

test("sends a controlled User-Agent header", async () => {
  const mock = createMockRequest();

  await requestPinned("https://example.com/", {
    resolveHostname: publicResolution,
    requestImpl: mock.requestImpl,
  });

  assert.equal(
    mock.getOptions().headers["User-Agent"],
    "RAMAH-PHISHGUARD/1.0"
  );
});
test("enforces an absolute deadline when the server never responds", async () => {
  const requestImpl = () => {
    const request = new EventEmitter();

    request.setTimeout = () => {};

    request.end = () => {
      // Simulate a server that never responds.
    };

    request.destroy = (error) => {
      if (error) {
        request.emit("error", error);
      }
    };

    return request;
  };

  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: publicResolution,
      requestTimeoutMs: 30,
      requestImpl,
    }),
    { code: "ETIMEDOUT" }
  );
});

test("rejects malformed Content-Length headers", async () => {
  const mock = createMockRequest({
    headers: {
      "content-length": "not-a-number",
    },
  });

  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: publicResolution,
      requestImpl: mock.requestImpl,
    }),
    { code: "ERR_INVALID_CONTENT_LENGTH" }
  );
});

test("rejects unsafe Content-Length values", async () => {
  const mock = createMockRequest({
    headers: {
      "content-length": "999999999999999999999999",
    },
  });

  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: publicResolution,
      requestImpl: mock.requestImpl,
    }),
    { code: "ERR_INVALID_CONTENT_LENGTH" }
  );
});

test("rejects a response that closes before completion", async () => {
  const requestImpl = (options, callback) => {
    const request = new EventEmitter();

    request.setTimeout = () => {};
    request.end = () => {
      const response = new EventEmitter();
      response.headers = {};
      response.statusCode = 200;
      response.destroy = () => {};

      callback(response);

      process.nextTick(() => {
        response.emit("close");
      });
    };

    request.destroy = (error) => {
      if (error) request.emit("error", error);
    };

    return request;
  };

  await assert.rejects(
    requestPinned("https://example.com/", {
      resolveHostname: publicResolution,
      requestImpl,
    }),
    { code: "ECONNRESET" }
  );
});


test("rejects an invalid shared deadline before DNS resolution", async () => {
  let dnsCalled = false;
  let requestCalled = false;

  await assert.rejects(
    requestPinned("https://example.com/", {
      deadlineAtMs: 0,
      resolveHostname: async () => {
        dnsCalled = true;
        return publicResolution();
      },
      requestImpl: () => {
        requestCalled = true;
      },
    }),
    /Invalid HTTP request deadline/
  );

  assert.equal(dnsCalled, false);
  assert.equal(requestCalled, false);
});

test("enforces the shared deadline during DNS resolution", async () => {
  let requestCalled = false;

  const deadlineAtMs = Date.now() + 30;

  await assert.rejects(
    requestPinned("https://example.com/", {
      deadlineAtMs,
      dnsTimeoutMs: 1000,
      resolveHostname: () => new Promise(() => {}),
      requestImpl: () => {
        requestCalled = true;
      },
    }),
    {
      code: "ETIMEDOUT",
      message: "DNS resolution timed out.",
    }
  );

  assert.equal(requestCalled, false);
});

test("does not start an HTTP request after the shared deadline expires during DNS", async () => {
  let requestCalled = false;

  const deadlineAtMs = Date.now() + 30;

  await assert.rejects(
    requestPinned("https://example.com/", {
      deadlineAtMs,
      dnsTimeoutMs: 1000,
      resolveHostname: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return publicResolution();
      },
      requestImpl: () => {
        requestCalled = true;
      },
    }),
    {
      code: "ETIMEDOUT",
      message: "DNS resolution timed out.",
    }
  );

  assert.equal(requestCalled, false);
});
