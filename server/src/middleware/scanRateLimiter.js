import rateLimit from "express-rate-limit";

const scanRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many scan requests. Please try again later.",
  },
});

export default scanRateLimiter;