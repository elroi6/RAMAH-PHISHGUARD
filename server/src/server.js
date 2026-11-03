import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json({ limit: "10kb" }));

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RAMAH-PHISHGUARD API is running",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`RAMAH-PHISHGUARD API running on port ${PORT}`);
});