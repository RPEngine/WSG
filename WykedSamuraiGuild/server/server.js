import express from "express";
import apiRoutes from "./routes/apiRoutes.js";
import { healthCheck } from "./controllers/healthController.js";
import { aiChat, generateAiScenario } from "./controllers/aiController.js";
import { PORT } from "./config/env.js";
import { connectDatabase, initializeDatabase } from "./config/db.js";
import { getAiProviderConfig, requireFriendliConfig } from "./config/ai.js";
import { applySecurityHeaders } from "./middleware/securityHeaders.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const RENDER_WEB_ORIGIN = "https://wsg-web.onrender.com";
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = ["Content-Type", "Authorization"];

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

function parseOrigins(value) {
  return String(value || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

const configuredOrigins = parseOrigins(process.env.WSG_FRONTEND_ORIGIN || process.env.WSG_FRONTEND_ORIGINS);
const localDevOrigins = ["http://localhost:5173", "http://localhost:3000"].map((origin) => normalizeOrigin(origin));
const productionOrigins = [...configuredOrigins, normalizeOrigin(RENDER_WEB_ORIGIN)];

const allowedOrigins = Array.from(
  new Set(isProduction ? productionOrigins : [...productionOrigins, ...localDevOrigins]),
);

function applyApiCorsHeaders(req, res) {
  const requestOrigin = normalizeOrigin(req.headers.origin);
  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS.join(","));

  const requestedHeaders = String(req.headers["access-control-request-headers"] || "")
    .split(",")
    .map((header) => header.trim())
    .filter(Boolean);
  const mergedHeaders = Array.from(new Set([...ALLOWED_HEADERS, ...requestedHeaders]));
  res.setHeader("Access-Control-Allow-Headers", mergedHeaders.join(","));
  res.setHeader("Access-Control-Max-Age", "86400");

  return true;
}

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(applySecurityHeaders);
app.use("/api", (req, res, next) => {
  const hasCorsHeaders = applyApiCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    if (!hasCorsHeaders) {
      return res.status(403).json({ error: "CORS blocked for origin." });
    }
    return res.status(204).send();
  }
  return next();
});
app.use(express.json({ limit: "100kb" }));

app.get("/health", healthCheck);
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
