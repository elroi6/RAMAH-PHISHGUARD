import express from "express";

import {
  register,
  login,
} from "../controllers/auth.controller.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validators.js";

import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

// Registration
router.post(
  "/register",
  validateRequest(registerSchema),
  register
);

// Login
router.post(
  "/login",
  validateRequest(loginSchema),
  login
);

export default router;