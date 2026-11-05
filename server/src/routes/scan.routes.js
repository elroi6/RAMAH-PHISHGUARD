import express from "express";

import {
  createScan,
  getMyScans,
} from "../controllers/scan.controller.js";

import validateRequest from "../middleware/validateRequest.js";
import optionalAuth from "../middleware/optionalAuth.js";
import requireAuth from "../middleware/requireAuth.js";
import scanRateLimiter from "../middleware/scanRateLimiter.js";
import { scanUrlSchema } from "../validators/scan.validators.js";

const router = express.Router();

// Retrieve the authenticated user's scan history.
router.get("/mine", requireAuth, getMyScans);

// Submit a URL for scanning.
router.post(
  "/",
  scanRateLimiter,
  optionalAuth,
  validateRequest(scanUrlSchema),
  createScan
);

export default router;