import express from "express";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js";
import { healthCheck } from "./controllers/healthController.js";
import { aiChat, generateAiScenario } from "./controllers/aiController.js";
import { PORT } from "./config/env.js";
import { connectDatabase, initializeDatabase } from "./config/db.js";

const app = express();

const configuredOrigins = (process.env.WSG_FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  "https://wyked-samurai-frontend.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(cors({
  origin(origin, callback) {
    const isRenderFrontend = Boolean(origin && /^https:\/\/(?:.*-)?(?:frontend|wsg)-[a-z0-9-]+\.onrender\.com$/i.test(origin));
    if (!origin || allowedOrigins.includes(origin) || isRenderFrontend) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
app.use(express.json());

app.get("/health", healthCheck);
app.use("/api", apiRoutes);
app.post("/chat", aiChat);
app.post("/scenario", generateAiScenario);

app.get("/", (req, res) => {
  res.send("WSG backend is running");
});

async function startServer() {
  try {
    const friendliToken = typeof process.env.FRIENDLI_API_TOKEN === "string"
      ? process.env.FRIENDLI_API_TOKEN.trim()
      : "";
    const friendliEndpointId = typeof process.env.FRIENDLI_ENDPOINT_ID === "string"
      ? process.env.FRIENDLI_ENDPOINT_ID.trim()
      : "";
    const friendliBaseUrl = (process.env.FRIENDLI_API_BASE_URL || "https://api.friendli.ai/dedicated/v1").trim();
    const friendliDeployedModelName = (process.env.FRIENDLI_MODEL || "mistralai/Mistral-7B-Instruct-v0.3").trim();

    if (!friendliToken) {
      throw new Error("Missing required startup config: FRIENDLI_API_TOKEN.");
    }
    if (!friendliEndpointId) {
      throw new Error("Missing required startup config: FRIENDLI_ENDPOINT_ID.");
    }

    console.log("[startup] AI provider diagnostics:", {
      provider: "friendli",
      baseUrl: friendliBaseUrl,
      endpointId: friendliEndpointId,
      deployedModelName: friendliDeployedModelName,
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
