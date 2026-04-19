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
const ALLOWED_ORIGINS = ["https://wsg-web.onrender.com"];
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = ["Content-Type", "Authorization"];

const corsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

console.log("[startup] backend runtime", {
  NODE_ENV,
  allowedOrigins: ALLOWED_ORIGINS,
  globalCorsEnabled: true,
});

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(applySecurityHeaders);

// Global CORS must execute before all route handling.
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
