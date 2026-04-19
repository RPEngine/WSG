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
const CORS_RUNTIME_VERSION = "2026-04-19-runtime-fingerprint-v3";
const APP_REACHABILITY_HEADER = "X-WSG-App-Reached";
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
const ENABLE_CORS_GUARD_LOGGING = String(process.env.WSG_ENABLE_CORS_GUARD_LOGGING || "true").toLowerCase() !== "false";
const ENABLE_CORS_RESPONSE_DIAGNOSTICS = String(process.env.WSG_ENABLE_CORS_RESPONSE_DIAGNOSTICS || "true").toLowerCase() !== "false";
const ALLOWED_RENDER_FRONTEND_ORIGIN_PATTERN = /^https:\/\/wsg-web(?:-[a-z0-9-]+)?\.onrender\.com$/i;
const CORS_MAX_AGE_SECONDS = 60 * 60 * 6;
const CORS_TRACE_PATHS = ["/api/profile/me", "/api/connections"];

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
  credentials: true,
  maxAge: CORS_MAX_AGE_SECONDS,
  // Reflect preflight-requested headers instead of pinning to a fixed list.
  // This avoids runtime CORS failures when browsers include extra non-simple headers.
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

function applyCorsResponseHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  const allowed = isAllowedOrigin(requestOrigin);
  if (!requestOrigin || !allowed) {
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", normalizeOrigin(requestOrigin));
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS.join(","));
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] || "Authorization,Content-Type",
  );
  res.setHeader("Access-Control-Max-Age", String(CORS_MAX_AGE_SECONDS));
  return true;
}

console.log("[startup] backend runtime", {
  corsRuntimeVersion: CORS_RUNTIME_VERSION,
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
app.use((req, res, next) => {
  res.setHeader("X-WSG-CORS-Runtime", CORS_RUNTIME_VERSION);
  res.setHeader(APP_REACHABILITY_HEADER, "true");
  const requestOrigin = req.headers.origin;
  if (requestOrigin) {
    const normalizedOrigin = normalizeOrigin(requestOrigin);
    const originAllowed = isAllowedOrigin(requestOrigin);
    res.setHeader("X-WSG-CORS-Origin-Received", normalizedOrigin);
    res.setHeader("X-WSG-CORS-Origin-Allowed", String(originAllowed));
  }
  return next();
});

// Set CORS response headers as early as possible so they are present
// even when downstream middleware/handlers fail.
app.use((req, res, next) => {
  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = (...args) => {
    applyCorsResponseHeaders(req, res);
    return originalWriteHead(...args);
  };

  const requestOrigin = req.headers.origin;
  const allowed = applyCorsResponseHeaders(req, res);

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
  const shouldTrace = CORS_TRACE_PATHS.includes(req.path);
  if (!shouldTrace) {
    return next();
  }

  const requestOrigin = req.headers.origin || null;
  const normalizedOrigin = normalizeOrigin(requestOrigin);
  const originAllowed = isAllowedOrigin(requestOrigin);
  const preflightMethod = req.headers["access-control-request-method"] || null;
  const preflightHeaders = req.headers["access-control-request-headers"] || null;

  if (ENABLE_CORS_RESPONSE_DIAGNOSTICS) {
    res.setHeader("X-WSG-CORS-Path-Trace", "true");
    res.setHeader("X-WSG-CORS-Origin-Allowed", String(originAllowed));
    if (requestOrigin) {
      res.setHeader("X-WSG-CORS-Origin-Received", normalizedOrigin);
    }
  }

  res.on("finish", () => {
    const allowOrigin = res.getHeader("access-control-allow-origin") || null;
    const allowMethods = res.getHeader("access-control-allow-methods") || null;
    const allowHeaders = res.getHeader("access-control-allow-headers") || null;
    const payload = {
      method: req.method,
      path: req.path,
      host: req.headers.host || null,
      forwardedHost: req.headers["x-forwarded-host"] || null,
      requestId: req.headers["x-request-id"] || null,
      requestOrigin,
      normalizedOrigin: requestOrigin ? normalizedOrigin : null,
      originAllowed,
      preflightMethod,
      preflightHeaders,
      statusCode: res.statusCode,
      allowOrigin,
      allowMethods,
      allowHeaders,
    };

    if (ENABLE_CORS_DIAGNOSTICS) {
      console.log("[cors:trace]", payload);
    }

    if (ENABLE_CORS_GUARD_LOGGING && requestOrigin && !allowOrigin) {
      console.warn("[cors:missing-allow-origin]", {
        ...payload,
        diagnosticsEnabled: ENABLE_CORS_DIAGNOSTICS,
        effectiveAllowedOrigins: EFFECTIVE_ALLOWED_ORIGINS,
        allowlistedRenderOriginPattern: ALLOWED_RENDER_FRONTEND_ORIGIN_PATTERN.toString(),
      });
    }
  });

  return next();
});

app.get("/api/debug/cors-runtime", (req, res) => {
  const requestOrigin = req.headers.origin || null;
  const normalizedOrigin = normalizeOrigin(requestOrigin);
  res.json({
    corsRuntimeVersion: CORS_RUNTIME_VERSION,
    diagnosticsEnabled: ENABLE_CORS_DIAGNOSTICS,
    corsGuardLoggingEnabled: ENABLE_CORS_GUARD_LOGGING,
    corsResponseDiagnosticsEnabled: ENABLE_CORS_RESPONSE_DIAGNOSTICS,
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
      normalizedOrigin: requestOrigin ? normalizedOrigin : null,
      host: req.headers.host || null,
      forwardedHost: req.headers["x-forwarded-host"] || null,
      accessControlRequestMethod: req.headers["access-control-request-method"] || null,
      accessControlRequestHeaders: req.headers["access-control-request-headers"] || null,
    },
    originAllowed: isAllowedOrigin(requestOrigin),
  });
});

app.all("/api/debug/cors-probe", (req, res) => {
  const requestOrigin = req.headers.origin || null;
  const normalizedOrigin = normalizeOrigin(requestOrigin);
  const originAllowed = isAllowedOrigin(requestOrigin);

  res.json({
    timestamp: new Date().toISOString(),
    corsRuntimeVersion: CORS_RUNTIME_VERSION,
    appReachabilityHeader: APP_REACHABILITY_HEADER,
    request: {
      method: req.method,
      path: req.path,
      host: req.headers.host || null,
      forwardedHost: req.headers["x-forwarded-host"] || null,
      origin: requestOrigin,
      normalizedOrigin: requestOrigin ? normalizedOrigin : null,
      accessControlRequestMethod: req.headers["access-control-request-method"] || null,
      accessControlRequestHeaders: req.headers["access-control-request-headers"] || null,
    },
    computed: {
      originAllowed,
      effectiveAllowedOrigins: EFFECTIVE_ALLOWED_ORIGINS,
      allowlistedRenderOriginPattern: ALLOWED_RENDER_FRONTEND_ORIGIN_PATTERN.toString(),
    },
    responseHeaders: {
      allowOrigin: res.getHeader("access-control-allow-origin") || null,
      allowMethods: res.getHeader("access-control-allow-methods") || null,
      allowHeaders: res.getHeader("access-control-allow-headers") || null,
      appReached: res.getHeader(APP_REACHABILITY_HEADER) || null,
      corsRuntime: res.getHeader("X-WSG-CORS-Runtime") || null,
    },
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
  // Ensure CORS headers are present on error responses as well.
  applyCorsResponseHeaders(req, res);

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
