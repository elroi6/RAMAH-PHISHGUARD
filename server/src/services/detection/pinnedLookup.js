import net from "node:net";

import { inspectIpAddress } from "./ipSafety.js";

const normalizeHostname = (hostname) => (
  hostname.toLowerCase().replace(/\.$/, "")
);

/**
 * Create a DNS lookup callback that can only return
 * one previously validated public IP address.
 *
 * This prevents Node's HTTP client from performing
 * an independent DNS resolution.
 */
export const createPinnedLookup = (expectedHostname, pinnedAddress) => {
  if (
    typeof expectedHostname !== "string" ||
    !expectedHostname.trim()
  ) {
    throw new TypeError("A valid hostname must be provided.");
  }

  if (typeof pinnedAddress !== "string" || !pinnedAddress.trim()) {
    throw new TypeError("A pinned IP address must be provided.");
  }

  const expected = normalizeHostname(expectedHostname.trim());
  const inspection = inspectIpAddress(pinnedAddress);

  if (!inspection.valid || !inspection.isPublic) {
    throw new Error("The pinned IP address is not publicly routable.");
  }

  const address = inspection.normalizedAddress;
  const family = net.isIP(address);

  if (!family) {
    throw new Error("The pinned IP address is invalid.");
  }

  return (hostname, options, callback) => {
    // Support Node's optional lookup options argument.
    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    if (typeof callback !== "function") {
      throw new TypeError("A DNS lookup callback is required.");
    }

    if (
      typeof hostname !== "string" ||
      normalizeHostname(hostname) !== expected
    ) {
      const error = new Error(
        "The requested hostname does not match the pinned hostname."
      );

      error.code = "ERR_DNS_PIN_MISMATCH";
      callback(error);
      return;
    }

    if (options?.family && options.family !== family) {
      const error = new Error(
        "The requested IP family does not match the pinned address."
      );

      error.code = "ERR_DNS_PIN_FAMILY_MISMATCH";
      callback(error);
      return;
    }

    const record = { address, family };

    if (options?.all) {
      callback(null, [record]);
      return;
    }

    callback(null, address, family);
  };
};