const REDACTED_VALUE = "[REDACTED]";

/**
 * Redacts query parameter values and URL fragments.
 * Preserves parameter names for security analysis.
 */
export const redactUrl = (input) => {
  if (typeof input !== "string" || !input.trim()) {
    return "[INVALID URL]";
  }

  try {
    const url = new URL(input.trim());

    // Remove embedded credentials.
    url.username = "";
    url.password = "";

    // Redact every query parameter value.
    for (const key of new Set(url.searchParams.keys())) {
      url.searchParams.set(key, REDACTED_VALUE);
    }

    // Fragments can contain private information.
    url.hash = "";

    return url.href;
  } catch {
    return "[INVALID URL]";
  }
};