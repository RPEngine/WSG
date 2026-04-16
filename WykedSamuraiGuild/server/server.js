import express from "express";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js";
import { healthCheck } from "./controllers/healthController.js";
import { aiChat, generateAiScenario } from "./controllers/aiController.js";
import { PORT } from "./config/env.js";
import { connectDatabase, initializeDatabase } from "./config/db.js";
import { getAiProviderConfig, requireFriendliConfig } from "./config/ai.js";
import { applySecurityHeaders } from "./middleware/securityHeaders.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

function parseOrigins(value) {
  return String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const configuredOrigins = parseOrigins(process.env.WSG_FRONTEND_ORIGIN || process.env.WSG_FRONTEND_ORIGINS);
const localDevOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

const allowedOrigins = Array.from(new Set(isProduction
  ? [...configuredOrigins]
  : [...configuredOrigins, ...localDevOrigins]));

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(applySecurityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(Object.assign(new Error("CORS blocked for origin."), { status: 403 }));
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "100kb" }));

app.get("/health", healthCheck);
app.get("/api/connections", (_req, res) => {
  res.json({ items: [], connections: [], count: 0 });
});
app.use("/api", apiRoutes);
app.post("/chat", aiChat);
app.post("/scenario", generateAiScenario);

app.get("/", (req, res) => {
  res.send("WSG backend is running");
});

app.use((err, req, res, next) => {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  console.error("[server] unhandled error", {
    message: err?.message || "Unknown error",
    path: req?.path,
    method: req?.method,
    status,
  });

  if (res.headersSent) {
    return next(err);
  }

  if (status >= 500) {
    return res.status(status).json({ error: "Something went wrong. Please try again." });
  }

  return res.status(status).json({ error: err?.message || "We could not process your request." });
});

async function startServer() {
  try {
    requireFriendliConfig();
    const aiConfig = getAiProviderConfig();

    console.log("[startup] AI provider diagnostics:", {
      provider: aiConfig.provider,
      baseUrl: aiConfig.baseUrl,
      endpointId: aiConfig.endpointId,
      deployedModelName: aiConfig.deployedModelName,
      tokenPresent: aiConfig.tokenPresent,
    });

    await connectDatabase();
    console.log("[db] database connection established");
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[db] database connection failed", { error: error.message });
    process.exit(1);
  }
}

startServer();
