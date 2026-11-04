
import dns from "node:dns/promises";
import net from "node:net";

import { inspectIpAddress } from "./ipSafety.js";

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
  ".test",
  ".invalid",
  ".onion",
];

const isValidHostname = (hostname) => {
  if (!hostname || hostname.length > 253) {
    return false;
  }

  const labels = hostname.split(".");

  return labels.every((label) => (
    label.length >= 1 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  ));
};

const createFailure = (reason) => ({
  valid: false,
  hostname: null,
  addresses: [],
  reason,
});

/**
 * Resolve a hostname and reject any non-public IP address.
 *
 * Every returned address must be publicly routable.
 * No HTTP requests are made by this service.
 */
export const resolvePublicHostname = async (
  input,
  { lookup = dns.lookup } = {}
) => {
  if (typeof input !== "string" || !input.trim()) {
    return createFailure("A hostname must be provided.");
  }

  const hostname = input.trim().toLowerCase().replace(/\.$/, "");

  // Handle IP addresses directly without DNS resolution.
  if (net.isIP(hostname)) {
    const inspection = inspectIpAddress(hostname);

    if (!inspection.valid || !inspection.isPublic) {
      return createFailure(
        "The destination IP address is not publicly routable."
      );
    }

    return {
      valid: true,
      hostname,
      addresses: [
        {
          address: inspection.normalizedAddress,
          family: net.isIP(inspection.normalizedAddress),
        },
      ],
      reason: null,
    };
  }

  if (!isValidHostname(hostname) || !hostname.includes(".")) {
    return createFailure(
      "The hostname is not a valid fully qualified domain name."
    );
  }

  if (
    BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    hostname === "localhost"
  ) {
    return createFailure(
      "Local and reserved hostnames are not allowed."
    );
  }

  if (typeof lookup !== "function") {
    return createFailure("The DNS lookup function is invalid.");
  }

  let records;

  try {
    // The trailing dot makes the DNS lookup absolute.
    records = await lookup(`${hostname}.`, {
      all: true,
      verbatim: true,
    });
  } catch {
    return createFailure("The hostname could not be resolved.");
  }

  if (!Array.isArray(records) || records.length === 0) {
    return createFailure("The hostname has no DNS addresses.");
  }

  const validatedAddresses = [];

  for (const record of records) {
    if (
      !record ||
      typeof record.address !== "string" ||
      !Number.isInteger(record.family) ||
      ![4, 6].includes(record.family)
    ) {
      return createFailure(
        "The DNS response contains an invalid address."
      );
    }

    const actualFamily = net.isIP(record.address);

    if (!actualFamily || actualFamily !== record.family) {
      return createFailure(
        "The DNS response contains an invalid IP family."
      );
    }

    const inspection = inspectIpAddress(record.address);

    if (!inspection.valid || !inspection.isPublic) {
      return createFailure(
        "The hostname resolves to a non-public or unsafe IP address."
      );
    }

    const family = net.isIP(inspection.normalizedAddress);

    if (!family || family !== record.family) {
      return createFailure(
        "The DNS response contains an invalid IP address."
      );
    }

    validatedAddresses.push({
      address: inspection.normalizedAddress,
      family,
    });
  }

  const uniqueAddresses = [
    ...new Map(
      validatedAddresses.map((item) => [item.address, item])
    ).values(),
  ];

  return {
    valid: true,
    hostname,
    addresses: uniqueAddresses,
    reason: null,
  };
};
