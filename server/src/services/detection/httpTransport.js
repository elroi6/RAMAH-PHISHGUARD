
import http from "node:http";
import https from "node:https";
import net from "node:net";

import { resolvePublicHostname } from "./dnsResolver.js";
import { createPinnedLookup } from "./pinnedLookup.js";
import { validateInspectionTarget } from "./httpTargetPolicy.js";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_DNS_TIMEOUT_MS = 3000;
const DEFAULT_MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_HEADER_SIZE = 16 * 1024;

const withTimeout = (promise, timeoutMs, message) => {
  let timer;

  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      error.code = "ETIMEDOUT";
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
};

const getRemainingTime = (deadlineAtMs) => {
  if (deadlineAtMs === undefined) {
    return null;
  }

  return deadlineAtMs - Date.now();
};

/**
 * Make one HTTP request using a previously validated public IP.
 *
 * Redirects are deliberately not followed.
 * Each redirect must be validated and resolved separately.
 *
 * An optional absolute deadline can be shared across DNS
 * resolution and the HTTP request.
 */
export const requestPinned = async (
  input,
  {
    resolveHostname = resolvePublicHostname,
    requestTimeoutMs = DEFAULT_TIMEOUT_MS,
    dnsTimeoutMs = DEFAULT_DNS_TIMEOUT_MS,
    maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES,
    deadlineAtMs,
    requestImpl,
  } = {}
) => {
  const policy = validateInspectionTarget(input);

  if (!policy.valid) {
    throw new Error(policy.reason);
  }

  if (
    !Number.isSafeInteger(requestTimeoutMs) ||
    requestTimeoutMs < 1 ||
    !Number.isSafeInteger(dnsTimeoutMs) ||
    dnsTimeoutMs < 1 ||
    !Number.isSafeInteger(maxResponseBytes) ||
    maxResponseBytes < 1
  ) {
    throw new TypeError("Invalid HTTP transport limits.");
  }

  if (
    deadlineAtMs !== undefined &&
    (!Number.isSafeInteger(deadlineAtMs) || deadlineAtMs < 1)
  ) {
    throw new TypeError("Invalid HTTP request deadline.");
  }

  const target = policy.target;

  // Apply the shared deadline to DNS resolution.
  const remainingBeforeDns = getRemainingTime(deadlineAtMs);

  if (
    remainingBeforeDns !== null &&
    remainingBeforeDns <= 0
  ) {
    throw new Error("The total inspection timeout was exceeded.");
  }

  const effectiveDnsTimeout =
    remainingBeforeDns === null
      ? dnsTimeoutMs
      : Math.min(dnsTimeoutMs, remainingBeforeDns);

  const resolution = await withTimeout(
    resolveHostname(target.hostname),
    effectiveDnsTimeout,
    "DNS resolution timed out."
  );

  if (
    !resolution?.valid ||
    !Array.isArray(resolution.addresses) ||
    resolution.addresses.length === 0
  ) {
    throw new Error(
      resolution?.reason ||
        "The destination hostname could not be validated."
    );
  }

  // DNS may have completed after the shared deadline.
  const remainingBeforeRequest = getRemainingTime(deadlineAtMs);

  if (
    remainingBeforeRequest !== null &&
    remainingBeforeRequest <= 0
  ) {
    throw new Error("The total inspection timeout was exceeded.");
  }

  // The resolver has already validated every returned address.
  // This request is pinned to exactly one of those addresses.
  const pinnedAddress = resolution.addresses[0].address;

  const lookup = createPinnedLookup(
    target.hostname,
    pinnedAddress
  );

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port,
    path: target.requestPath,
    method: "GET",
    agent: false,
    lookup,
    maxHeaderSize: MAX_HEADER_SIZE,
    headers: {
      "User-Agent": "RAMAH-PHISHGUARD/1.0",
      Accept: "*/*",
      Connection: "close",
    },
  };

  let transport;

  if (target.protocol === "https:") {
    transport = https.request;

    options.rejectUnauthorized = true;

    // Preserve hostname-based TLS verification and SNI.
    // IP literals must not be sent as DNS SNI names.
    if (net.isIP(target.hostname) === 0) {
      options.servername = target.hostname;
    }
  } else {
    transport = http.request;
  }

  const makeRequest = requestImpl || transport;

  const effectiveRequestTimeout =
    remainingBeforeRequest === null
      ? requestTimeoutMs
      : Math.min(requestTimeoutMs, remainingBeforeRequest);

  return new Promise((resolve, reject) => {
    let settled = false;
    let request;
    let deadlineTimer;

    const clearDeadline = () => {
      if (deadlineTimer) {
        clearTimeout(deadlineTimer);
        deadlineTimer = undefined;
      }
    };

    const fail = (error) => {
      if (settled) return;

      settled = true;
      clearDeadline();
      reject(error);
    };

    const timeoutRequest = () => {
      const error = new Error(
        deadlineAtMs !== undefined
          ? "The total inspection timeout was exceeded."
          : "The HTTP request timed out."
      );

      error.code = "ETIMEDOUT";

      if (request) {
        request.destroy(error);
      }

      fail(error);
    };

    try {
      request = makeRequest(options, (response) => {
        if (settled) {
          response.destroy();
          return;
        }

        const chunks = [];
        let totalBytes = 0;

        const contentLength =
          response.headers?.["content-length"];

        // Reject malformed or unsafe Content-Length values.
        if (contentLength !== undefined) {
          if (
            typeof contentLength !== "string" ||
            !/^\d+$/.test(contentLength) ||
            !Number.isSafeInteger(Number(contentLength))
          ) {
            const error = new Error(
              "The response has an invalid Content-Length."
            );
            error.code = "ERR_INVALID_CONTENT_LENGTH";

            response.destroy(error);
            request.destroy(error);
            fail(error);
            return;
          }

          if (Number(contentLength) > maxResponseBytes) {
            const error = new Error(
              "The response exceeds the size limit."
            );
            error.code = "ERR_RESPONSE_TOO_LARGE";

            response.destroy(error);
            request.destroy(error);
            fail(error);
            return;
          }
        }

        response.on("data", (chunk) => {
          if (settled) return;

          const buffer = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk);

          totalBytes += buffer.length;

          if (totalBytes > maxResponseBytes) {
            const error = new Error(
              "The response exceeds the size limit."
            );
            error.code = "ERR_RESPONSE_TOO_LARGE";

            response.destroy(error);
            request.destroy(error);
            fail(error);
            return;
          }

          chunks.push(buffer);
        });

        response.on("aborted", () => {
          const error = new Error(
            "The HTTP response was interrupted."
          );
          error.code = "ECONNRESET";
          fail(error);
        });

        response.on("close", () => {
          if (settled) return;

          const error = new Error(
            "The HTTP response closed before completion."
          );
          error.code = "ECONNRESET";
          fail(error);
        });

        response.on("error", fail);

        response.on("end", () => {
          if (settled) return;

          settled = true;
          clearDeadline();

          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks),
            bytesReceived: totalBytes,
            requestedUrl: target.url,
            pinnedAddress,
          });
        });
      });

      // Handle request-level errors.
      request.on("error", fail);

      // Enforce the effective deadline for the HTTP request.
      deadlineTimer = setTimeout(
        timeoutRequest,
        effectiveRequestTimeout
      );

      // Also detect socket inactivity.
      request.setTimeout(
        effectiveRequestTimeout,
        timeoutRequest
      );

      request.end();
    } catch (error) {
      fail(error);
    }
  });
};
