import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    message: "RAMAH-PHISHGUARD API is running",
    services: {
      api: "operational",
      database: databaseConnected ? "connected" : "disconnected",
    },
    timestamp: new Date().toISOString(),
  });
});

router.get("/ready", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  if (!databaseConnected) {
    return res.status(503).json({
      success: false,
      message: "Service is not ready",
      database: "disconnected",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Service is ready",
    database: "connected",
  });
});

export default router;