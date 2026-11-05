import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    originalUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },

    normalizedUrl: {
      type: String,
      default: null,
    },

    hostname: {
      type: String,
      default: null,
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    riskLevel: {
      type: String,
      enum: ["LOW", "MODERATE", "HIGH", "CRITICAL", null],
      default: null,
    },

    findings: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    status: {
      type: String,
      enum: ["COMPLETED", "INVALID", "FAILED"],
      default: "COMPLETED",
    },
  },
  {
    timestamps: true,
  }
);

const Scan = mongoose.model("Scan", scanSchema);

export default Scan;