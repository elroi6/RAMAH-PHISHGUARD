import ipaddr from "ipaddr.js";

/**
 * Inspect an IP address before allowing outbound connections.
 *
 * Only addresses classified as globally routable unicast
 * are accepted. Special-purpose and non-public ranges are rejected.
 *
 * This function does not perform DNS resolution or network requests.
 */
export const inspectIpAddress = (address) => {
  if (typeof address !== "string" || !address.trim()) {
    return {
      valid: false,
      isPublic: false,
      normalizedAddress: null,
      range: null,
      reason: "A valid IP address must be provided.",
    };
  }

  const input = address.trim();

  if (!ipaddr.isValid(input)) {
    return {
      valid: false,
      isPublic: false,
      normalizedAddress: null,
      range: null,
      reason: "The provided IP address is invalid.",
    };
  }

  try {
    // Converts IPv4-mapped IPv6 addresses into their IPv4 form.
    const parsedAddress = ipaddr.process(input);
    const range = parsedAddress.range();
    const isPublic = range === "unicast";

    return {
      valid: true,
      isPublic,
      normalizedAddress: parsedAddress.toString(),
      range,
      reason: isPublic
        ? null
        : "The IP address belongs to a non-public or special-purpose range.",
    };
  } catch {
    return {
      valid: false,
      isPublic: false,
      normalizedAddress: null,
      range: null,
      reason: "The IP address could not be safely inspected.",
    };
  }
};