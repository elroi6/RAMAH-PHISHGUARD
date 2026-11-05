import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";
import env from "../config/env.js";

const optionalAuth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    // Allow public access when no token is provided.
    if (!authorization) {
      return next();
    }

    const [scheme, token, ...extra] = authorization.split(" ");

    if (
      scheme !== "Bearer" ||
      !token ||
      extra.length > 0
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header.",
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "ramah-phishguard",
      audience: "ramah-phishguard-users",
      algorithms: ["HS256"],
    });

    if (
      typeof decoded.sub !== "string" ||
      !mongoose.isValidObjectId(decoded.sub)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const user = await User.findById(decoded.sub)
      .select("_id name email role isActive");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account is unavailable.",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    return next(error);
  }
};

export default optionalAuth;