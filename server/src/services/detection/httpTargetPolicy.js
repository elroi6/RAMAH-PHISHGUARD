const MAX_URL_LENGTH = 2048;

const ALLOWED_TARGETS = Object.freeze({
  "http:": "80",
  "https:": "443",
});

const createFailure = (reason) => ({
  valid: false,
  target: null,
  reason,
});

/**
 * Validate a URL before any outbound network request.
 *
 * Only HTTP port 80 and HTTPS port 443 are allowed.
 * This function performs no DNS lookup or network request.
 */
export const validateInspectionTarget = (input) => {
  if (typeof input !== "string" || !input.trim()) {
    return createFailure("A URL must be provided.");
  }

  const rawUrl = input.trim();

  if (rawUrl.length > MAX_URL_LENGTH) {
    return createFailure("The URL exceeds the maximum allowed length.");
  }

  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    return createFailure("The URL is malformed.");
  }

  if (!Object.hasOwn(ALLOWED_TARGETS, url.protocol)) {
    return createFailure("Only HTTP and HTTPS URLs are supported.");
  }

  if (url.username || url.password) {
    return createFailure("URLs containing embedded credentials are not allowed.");
  }

  const expectedPort = ALLOWED_TARGETS[url.protocol];
  const actualPort = url.port || expectedPort;

  if (actualPort !== expectedPort) {
    return createFailure(
      `Only port ${expectedPort} is allowed for ${url.protocol.slice(0, -1).toUpperCase()}.`
    );
  }

  if (!url.hostname) {
    return createFailure("The URL must contain a hostname.");
  }

  // URL.hostname includes brackets around IPv6 literals.
  const hostname = url.hostname.startsWith("[")
    ? url.hostname.slice(1, -1)
    : url.hostname;

  // Fragments are not sent in HTTP requests.
  url.hash = "";

  return {
    valid: true,
    target: {
      url: url.toString(),
      protocol: url.protocol,
      hostname: hostname.toLowerCase(),
      port: Number(expectedPort),
      requestPath: `${url.pathname}${url.search}`,
    },
    reason: null,
  };
};