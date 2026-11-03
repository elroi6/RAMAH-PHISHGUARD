import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.create({
      name,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    // Handle duplicate email, including simultaneous registrations.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    return next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find the account and explicitly retrieve its password hash.
    const user = await User.findOne({ email }).select("+password");

    // Use the same response for unknown emails and incorrect passwords.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive",
      });
    }

    // Update the account's last login time.
    user.lastLoginAt = new Date();
    await user.save();

    // Generate the authentication token.
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
      },
      env.JWT_SECRET,
      {
        expiresIn: "1h",
        issuer: "ramah-phishguard",
        audience: "ramah-phishguard-users",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};