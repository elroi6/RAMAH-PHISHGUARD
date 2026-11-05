
import Scan from "../models/scan.js";
import { detectUrl } from "../services/detection/urlDetectionService.js";
import { inspectHttpUrl } from "../services/detection/safeHttpInspector.js";
import { redactUrl } from "../utils/urlPrivacy.js";

export const createScan = async (req, res, next) => {
  try {
    const { url } = req.body;

    // Analyze the original URL.
    const detection = detectUrl(url);

    const inspection = {
      status: "NOT_ATTEMPTED",
      httpStatusCode: null,
      finalUrl: null,
      redirects: [],
    };

    // Inspect the original destination only when valid.
    if (detection.valid) {
      try {
        const result = await inspectHttpUrl(
          detection.normalizedUrl
        );

        inspection.status = "COMPLETED";
        inspection.httpStatusCode = result.statusCode;
        inspection.finalUrl = result.finalUrl
          ? redactUrl(result.finalUrl)
          : null;

        inspection.redirects = result.redirects.map((redirect) => ({
          ...redirect,
          from: redactUrl(redirect.from),
          to: redactUrl(redirect.to),
        }));
      } catch {
        inspection.status = "UNAVAILABLE";
      }
    }

    // Redact URLs before saving them.
    const scan = await Scan.create({
      user: req.user?._id ?? null,
      originalUrl: redactUrl(url),
      normalizedUrl: detection.normalizedUrl
        ? redactUrl(detection.normalizedUrl)
        : null,
      hostname: detection.hostname ?? null,
      riskScore: detection.risk?.score ?? null,
      riskLevel: detection.risk?.level ?? null,
      findings: detection.findings ?? [],
      status: detection.valid ? "COMPLETED" : "INVALID",
    });

    return res.status(detection.valid ? 201 : 400).json({
      success: detection.valid,
      message: detection.valid
        ? "URL scan completed."
        : "The submitted URL is invalid.",
      data: {
        scanId: scan._id,
        url: detection.normalizedUrl
          ? redactUrl(detection.normalizedUrl)
          : redactUrl(url),
        valid: detection.valid,
        risk: detection.risk,
        findings: detection.findings,
        inspection,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyScans = async (req, res, next) => {
  try {
    const rawPage = req.query.page ?? "1";
    const rawLimit = req.query.limit ?? "10";

    const parsedPage = Number(rawPage);
    const parsedLimit = Number(rawLimit);

    if (
      !/^\d+$/.test(String(rawPage)) ||
      !Number.isSafeInteger(parsedPage) ||
      parsedPage < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive safe integer.",
      });
    }

    if (
      !/^\d+$/.test(String(rawLimit)) ||
      !Number.isSafeInteger(parsedLimit) ||
      parsedLimit < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive integer.",
      });
    }

    const page = parsedPage;
    const limit = Math.min(50, parsedLimit);
    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      return res.status(400).json({
        success: false,
        message: "Page number is too large.",
      });
    }

    const [scans, total] = await Promise.all([
      Scan.find({ user: req.user._id })
        .select(
          "originalUrl normalizedUrl hostname riskScore riskLevel findings status createdAt"
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Scan.countDocuments({ user: req.user._id }),
    ]);

    // Also sanitize older records that may contain raw query values.
    const sanitizedScans = scans.map((scan) => ({
      ...scan,
      originalUrl: redactUrl(scan.originalUrl),
      normalizedUrl: scan.normalizedUrl
        ? redactUrl(scan.normalizedUrl)
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Scan history retrieved successfully.",
      data: {
        scans: sanitizedScans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
