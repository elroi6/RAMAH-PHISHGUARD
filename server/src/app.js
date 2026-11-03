import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import env from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({origin: env.CLIENT_URL,
  })
);

app.use(express.json({ limit: "10kb" }));

if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}
// API routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);

// Handle unknown routes
app.use(notFound);

// Central error handler
app.use(errorHandler);

export default app;
