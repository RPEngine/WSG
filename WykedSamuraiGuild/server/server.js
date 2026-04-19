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
const NODE_ENV = process.env.NODE_ENV || "undefined";
const DEFAULT_ALLOWED_ORIGINS = ["https://wsg-web.onrender.com"];
const RAW_ALLOWED_ORIGINS = [
  ...String(process.env.WSG_FRONTEND_ORIGIN || "").split(","),
  ...String(process.env.WSG_FRONTEND_ORIGINS || "").split(","),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

function normalizeOrigin(value) {
  const origin = String(value || "").trim();
  if (!origin) {
    return "";
  }

  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/+$/, "");
  }
}

const ALLOWED_ORIGINS = RAW_ALLOWED_ORIGINS.map((origin) => normalizeOrigin(origin)).filter(Boolean);
const EFFECTIVE_ALLOWED_ORIGINS = ALLOWED_ORIGINS.length > 0
  ? ALLOWED_ORIGINS
  : DEFAULT_ALLOWED_ORIGINS.map((origin) => normalizeOrigin(origin));
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ENABLE_CORS_DIAGNOSTICS = String(process.env.WSG_ENABLE_CORS_DIAGNOSTICS || "").toLowerCase() === "true";
const ALLOWED_RENDER_FRONTEND_ORIGIN_PATTERN = /^https:\/\/wsg-web(?:-[a-z0-9-]+)?\.onrender\.com$/i;

function isAllowedRenderFrontendOrigin(origin) {
  if (!origin) {
    return false;
  }
  const normalizedOrigin = normalizeOrigin(origin);
  return ALLOWED_RENDER_FRONTEND_ORIGIN_PATTERN.test(normalizedOrigin);
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }
  const normalizedOrigin = normalizeOrigin(origin);
  if (EFFECTIVE_ALLOWED_ORIGINS.includes(normalizedOrigin)) {
    return true;
  }

  return isAllowedRenderFrontendOrigin(normalizedOrigin);
}

const corsOptions = {
  origin(origin, callback) {
    const allowed = isAllowedOrigin(origin);

    if (ENABLE_CORS_DIAGNOSTICS) {
      console.log("[cors:origin-check]", {
        origin: origin || null,
        allowed,
        effectiveAllowedOrigins: EFFECTIVE_ALLOWED_ORIGINS,
      });
    }

    if (allowed) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin denied: ${origin || "unknown-origin"}`));
  },
  methods: ALLOWED_METHODS,
  // Reflect preflight-requested headers instead of pinning to a fixed list.
  // This avoids runtime CORS failures when browsers include extra non-simple headers.
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

console.log("[startup] backend runtime", {
  NODE_ENV,
  renderServiceName: process.env.RENDER_SERVICE_NAME || null,
  renderGitCommit: process.env.RENDER_GIT_COMMIT || null,
  frontendOriginEnv: process.env.WSG_FRONTEND_ORIGIN || null,
  frontendOriginsEnv: process.env.WSG_FRONTEND_ORIGINS || null,
  allowedOriginsFromEnvRaw: RAW_ALLOWED_ORIGINS,
  allowedOriginsFromEnvNormalized: ALLOWED_ORIGINS,
  effectiveAllowedOrigins: EFFECTIVE_ALLOWED_ORIGINS,
  allowlistedRenderOriginPattern: ALLOWED_RENDER_FRONTEND_ORIGIN_PATTERN.toString(),
  globalCorsEnabled: true,
  diagnosticsEnabled: ENABLE_CORS_DIAGNOSTICS,
});

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(applySecurityHeaders);

// Set CORS response headers as early as possible so they are present
// even when downstream middleware/handlers fail.
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowed = isAllowedOrigin(requestOrigin);

  if (requestOrigin && allowed) {
    res.setHeader("Access-Control-Allow-Origin", normalizeOrigin(requestOrigin));
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS.join(","));
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] || "Authorization,Content-Type",
    );
  }

  if (req.method === "OPTIONS") {
    if (requestOrigin && allowed) {
      return res.status(204).end();
    }
    return res.status(403).json({ error: `CORS origin denied: ${requestOrigin || "unknown-origin"}` });
  }

  return next();
});

// Keep standard CORS middleware for compatibility with existing behavior.
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "100kb" }));

app.use((req, res, next) => {
  if (!ENABLE_CORS_DIAGNOSTICS) {
    return next();
  }

  const shouldTrace = ["/api/profile/me", "/api/connections"].includes(req.path);
  if (!shouldTrace) {
    return next();
  }

  const requestOrigin = req.headers.origin || null;
  const preflightMethod = req.headers["access-control-request-method"] || null;
  const preflightHeaders = req.headers["access-control-request-headers"] || null;

  res.on("finish", () => {
    console.log("[cors:trace]", {
      method: req.method,
      path: req.path,
      requestOrigin,
      preflightMethod,
      preflightHeaders,
      statusCode: res.statusCode,
      allowOrigin: res.getHeader("access-control-allow-origin") || null,
      allowMethods: res.getHeader("access-control-allow-methods") || null,
      allowHeaders: res.getHeader("access-control-allow-headers") || null,
    });
  });

  return next();
});

app.get("/api/debug/cors-runtime", (req, res) => {
  const requestOrigin = req.headers.origin || null;
  res.json({
    diagnosticsEnabled: ENABLE_CORS_DIAGNOSTICS,
    nodeEnv: NODE_ENV,
    renderServiceName: process.env.RENDER_SERVICE_NAME || null,
    renderGitCommit: process.env.RENDER_GIT_COMMIT || null,
    allowedOriginsFromEnvRaw: RAW_ALLOWED_ORIGINS,
    allowedOriginsFromEnvNormalized: ALLOWED_ORIGINS,
    effectiveAllowedOrigins: EFFECTIVE_ALLOWED_ORIGINS,
    request: {
      method: req.method,
      path: req.path,
      origin: requestOrigin,
      accessControlRequestMethod: req.headers["access-control-request-method"] || null,
      accessControlRequestHeaders: req.headers["access-control-request-headers"] || null,
    },
    originAllowed: isAllowedOrigin(requestOrigin),
  });
});

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
