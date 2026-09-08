const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const marketRoutes = require("./routes/marketRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Trust proxy (required for correct client IPs behind Render/Vercel/etc.)
app.set("trust proxy", 1);

// CORS
// ALLOWED_ORIGINS is a comma-separated list in .env, e.g.
// ALLOWED_ORIGINS=https://marketpulse.vercel.app,http://localhost:5173
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server) with no Origin header.
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50kb" }));

// Rate limiting
// General limiter for all API routes, plus a tighter limiter specifically
// for the AI chat endpoint since each request costs a Gemini API call.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
  },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "AI_RATE_LIMITED",
    message: "Too many AI requests. Please wait a moment before trying again.",
  },
});

app.use("/api", generalLimiter);
app.use("/api/ai", aiLimiter);

// API routes
app.use("/api/market", marketRoutes); // Market APIs
app.use("/api/ai", aiRoutes); // AI APIs

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MarketPulse API is running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
// Catches anything that doesn't get caught by a route's own try/catch
// (e.g. malformed JSON bodies, CORS rejections, thrown middleware errors)
// and returns a safe, generic JSON response instead of Express's default
// HTML error page, which leaks stack traces and server file paths.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      code: "CORS_NOT_ALLOWED",
      message: "This origin is not allowed to access the API.",
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      code: "INVALID_JSON",
      message: "Request body must be valid JSON.",
    });
  }

  const isProduction = process.env.NODE_ENV === "production";

  res.status(err.statusCode || 500).json({
    success: false,
    code: err.code || "INTERNAL_ERROR",
    message: isProduction ? "Something went wrong." : err.message,
  });
});

// Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`MarketPulse server running on port ${PORT}`);
      console.log(`Market routes: http://localhost:${PORT}/api/market`);
      console.log(`AI routes: http://localhost:${PORT}/api/ai`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();