
import net from "node:net";

const MAX_URL_LENGTH = 2048;

const SUSPICIOUS_PORTS = new Set([
  21, 22, 23, 25, 110, 143, 445, 3389,
]);

const SUSPICIOUS_PATH_PATTERN =
  /(^|[^a-z0-9])(login|signin|verify|account|secure|update|password)(?=$|[^a-z0-9])/i;

const SUSPICIOUS_QUERY_PARAMETERS = new Set([
  "redirect",
  "return_url",
  "next",
  "continue",
  "token",
]);

const isValidDnsHostname = (hostname) => {
  const normalizedHostname = hostname.endsWith(".")
    ? hostname.slice(0, -1)
    : hostname;

  if (!normalizedHostname || normalizedHostname.length > 253) {
    return false;
  }

  const labels = normalizedHostname.split(".");

  return labels.every((label) => (
    label.length >= 1 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  ));
};

export const analyzeUrl = (input) => {
  const findings = [];

  if (typeof input !== "string" || !input.trim()) {
    return {
      valid: false,
      normalizedUrl: null,
      hostname: null,
      findings,
      error: "A URL must be provided as a non-empty string.",
    };
  }

  const trimmedInput = input.trim();

  if (trimmedInput.length > MAX_URL_LENGTH) {
    return {
      valid: false,
      normalizedUrl: null,
      hostname: null,
      findings,
      error: `URL cannot exceed ${MAX_URL_LENGTH} characters.`,
    };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(trimmedInput);
  } catch {
    return {
      valid: false,
      normalizedUrl: null,
      hostname: null,
      findings,
      error: "The provided URL is not valid.",
    };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return {
      valid: false,
      normalizedUrl: null,
      hostname: null,
      findings,
      error: "Only HTTP and HTTPS URLs are supported.",
    };
  }

  if (!parsedUrl.hostname) {
    return {
      valid: false,
      normalizedUrl: null,
      hostname: null,
      findings,
      error: "The URL must contain a hostname.",
    };
  }

  if (parsedUrl.username || parsedUrl.password) {
    return {
      valid: false,
      normalizedUrl: null,
      hostname: null,
      findings,
      error: "URLs containing embedded credentials are not accepted.",
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const ipAddressValue = hostname.replace(/^\[|\]$/g, "");
  const isIpAddress = net.isIP(ipAddressValue) !== 0;

  if (!isIpAddress && !isValidDnsHostname(hostname)) {
  return {
    valid: false,
    normalizedUrl: null,
    hostname: null,
    findings,
    error: "The URL contains an invalid hostname.",
  };
}

  if (isIpAddress) {
    findings.push({
      code: "IP_ADDRESS_HOST",
      severity: "medium",
      message: "The URL uses an IP address instead of a domain name.",
    });
  }

  if (parsedUrl.protocol === "http:") {
    findings.push({
      code: "UNENCRYPTED_HTTP",
      severity: "low",
      message: "The URL uses HTTP instead of HTTPS.",
    });
  }

  if (parsedUrl.port && SUSPICIOUS_PORTS.has(Number(parsedUrl.port))) {
    findings.push({
      code: "UNUSUAL_PORT",
      severity: "medium",
      message: "The URL uses a port commonly associated with other network services.",
    });
  }

  const hostnameParts = hostname.replace(/\.$/, "").split(".");

  if (!isIpAddress && hostnameParts.length > 4) {
    findings.push({
      code: "EXCESSIVE_SUBDOMAINS",
      severity: "medium",
      message: "The hostname contains an unusually large number of subdomains.",
    });
  }

  if (hostname.includes("xn--")) {
    findings.push({
      code: "PUNYCODE_HOSTNAME",
      severity: "medium",
      message: "The hostname contains an internationalized domain label encoded using Punycode.",
    });
  }

  if (parsedUrl.href.length > 200) {
    findings.push({
      code: "LONG_URL",
      severity: "low",
      message: "The URL is unusually long.",
    });
  }

  if (SUSPICIOUS_PATH_PATTERN.test(parsedUrl.pathname)) {
    findings.push({
      code: "SUSPICIOUS_PATH_KEYWORD",
      severity: "low",
      message: "The URL path contains a keyword commonly used in account-related pages.",
    });
  }

  const queryParameterNames = [
    ...parsedUrl.searchParams.keys(),
  ];

  if (
    queryParameterNames.some((name) =>
      SUSPICIOUS_QUERY_PARAMETERS.has(name.toLowerCase())
    )
  ) {
    findings.push({
      code: "SUSPICIOUS_QUERY_PARAMETER",
      severity: "low",
      message: "The URL contains a parameter commonly used in redirects or authentication flows.",
    });
  }

  return {
    valid: true,
    normalizedUrl: parsedUrl.href,
    hostname,
    isIpAddress,
    findings,
  };
};
