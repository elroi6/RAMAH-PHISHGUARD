
import net from "node:net";

import { inspectIpAddress } from "./ipSafety.js";
import { requestPinned } from "./httpTransport.js";
import { validateInspectionTarget } from "./httpTargetPolicy.js";

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_TOTAL_RESPONSE_BYTES = 1024 * 1024;
const DEFAULT_TOTAL_TIMEOUT_MS = 15000;
const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
const DEFAULT_DNS_TIMEOUT_MS = 3000;

// Node.js timers cannot reliably handle delays above this limit.
const MAX_TIMEOUT_MS = 2_147_483_647;

const REDIRECT_STATUS_CODES = new Set([
  301,
  302,
  303,
  307,
  308,
]);

const isValidTimeout = (value) =>
  Number.isSafeInteger(value) &&
  value >= 1 &&
  value <= MAX_TIMEOUT_MS;

export const inspectHttpUrl = async (
  input,
  {
    request = requestPinned,
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    maxTotalResponseBytes = DEFAULT_MAX_TOTAL_RESPONSE_BYTES,
    totalTimeoutMs = DEFAULT_TOTAL_TIMEOUT_MS,
    requestOptions = {},
  } = {}
) => {
  if (
    !Number.isSafeInteger(maxRedirects) ||
    maxRedirects < 0
  ) {
    throw new TypeError("Invalid maximum redirect count.");
  }

  if (
    !Number.isSafeInteger(maxTotalResponseBytes) ||
    maxTotalResponseBytes < 1
  ) {
    throw new TypeError("Invalid total response size limit.");
  }

  if (!isValidTimeout(totalTimeoutMs)) {
    throw new TypeError("Invalid total inspection timeout.");
  }

  if (typeof request !== "function") {
    throw new TypeError("A valid HTTP request function is required.");
  }

  if (
    !requestOptions ||
    typeof requestOptions !== "object" ||
    Array.isArray(requestOptions)
  ) {
    throw new TypeError("Invalid HTTP request options.");
  }

  const configuredRequestTimeout =
    requestOptions.requestTimeoutMs === undefined
      ? DEFAULT_REQUEST_TIMEOUT_MS
      : requestOptions.requestTimeoutMs;

  const configuredDnsTimeout =
    requestOptions.dnsTimeoutMs === undefined
      ? DEFAULT_DNS_TIMEOUT_MS
      : requestOptions.dnsTimeoutMs;

  const configuredResponseLimit =
    requestOptions.maxResponseBytes;

  if (!isValidTimeout(configuredRequestTimeout)) {
    throw new TypeError("Invalid HTTP request timeout.");
  }

  if (!isValidTimeout(configuredDnsTimeout)) {
    throw new TypeError("Invalid DNS resolution timeout.");
  }

  if (
    configuredResponseLimit !== undefined &&
    (!Number.isSafeInteger(configuredResponseLimit) ||
      configuredResponseLimit < 1)
  ) {
    throw new TypeError("Invalid HTTP response size limit.");
  }

  const deadline = Date.now() + totalTimeoutMs;

  if (!Number.isSafeInteger(deadline)) {
    throw new TypeError("Invalid total inspection deadline.");
  }

  let currentUrl = input;
  let totalBytesReceived = 0;

  const visitedUrls = new Set();
  const redirects = [];

  for (let hop = 0; ; hop += 1) {
    const remainingTime = deadline - Date.now();

    if (remainingTime <= 0) {
      throw new Error("The total inspection timeout was exceeded.");
    }

    const policy = validateInspectionTarget(currentUrl);

    if (!policy.valid) {
      throw new Error(
        `Unsafe redirect destination: ${policy.reason}`
      );
    }

    const hostname = policy.target.hostname;

    if (net.isIP(hostname)) {
      const inspection = inspectIpAddress(hostname);

      if (!inspection.valid || !inspection.isPublic) {
        throw new Error(
          "Unsafe redirect destination: IP address is not publicly routable."
        );
      }
    }

    const normalizedUrl = policy.target.url;

    if (visitedUrls.has(normalizedUrl)) {
      throw new Error("A redirect loop was detected.");
    }

    visitedUrls.add(normalizedUrl);

    const remainingBytes =
      maxTotalResponseBytes - totalBytesReceived;

    if (remainingBytes < 1) {
      throw new Error("The total response size limit was exceeded.");
    }

    const requestTimeoutMs = Math.min(
      configuredRequestTimeout,
      remainingTime
    );

    const dnsTimeoutMs = Math.min(
      configuredDnsTimeout,
      remainingTime
    );

    const maxResponseBytes =
      configuredResponseLimit === undefined
        ? remainingBytes
        : Math.min(configuredResponseLimit, remainingBytes);

    const response = await request(normalizedUrl, {
      ...requestOptions,
      requestTimeoutMs,
      dnsTimeoutMs,
      maxResponseBytes,
      deadlineAtMs: deadline,
    });

    if (
      !response ||
      !Number.isInteger(response.statusCode) ||
      response.statusCode < 100 ||
      response.statusCode > 599 ||
      !response.headers ||
      typeof response.headers !== "object" ||
      Array.isArray(response.headers)
    ) {
      throw new Error("The HTTP response is invalid.");
    }

    const bytesReceived = response.bytesReceived;

    if (
      !Number.isSafeInteger(bytesReceived) ||
      bytesReceived < 0
    ) {
      throw new Error("Invalid HTTP response size.");
    }

    if (bytesReceived > remainingBytes) {
      throw new Error("The total response size limit was exceeded.");
    }

    totalBytesReceived += bytesReceived;

    const location = response.headers.location;

    if (
      !REDIRECT_STATUS_CODES.has(response.statusCode) ||
      location === undefined
    ) {
      return {
        ...response,
        finalUrl: normalizedUrl,
        redirects,
        totalBytesReceived,
      };
    }

    if (hop >= maxRedirects) {
      throw new Error("The maximum redirect count was exceeded.");
    }

    if (
      typeof location !== "string" ||
      !location.trim() ||
      location.length > 2048
    ) {
      throw new Error("The redirect location is invalid.");
    }

    let destination;

    try {
      destination = new URL(location, normalizedUrl).toString();
    } catch {
      throw new Error("The redirect location is malformed.");
    }

    const destinationPolicy =
      validateInspectionTarget(destination);

    if (!destinationPolicy.valid) {
      throw new Error(
        `Unsafe redirect destination: ${destinationPolicy.reason}`
      );
    }

    redirects.push({
      statusCode: response.statusCode,
      from: normalizedUrl,
      to: destinationPolicy.target.url,
    });

    currentUrl = destinationPolicy.target.url;
  }
};
