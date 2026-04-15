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
    const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
    const hfTokenPresent = Boolean(hfToken?.trim());
    const hfTokenEnvName = process.env.HUGGINGFACE_API_KEY?.trim()
      ? "HUGGINGFACE_API_KEY"
      : process.env.HUGGINGFACE_API_TOKEN?.trim()
        ? "HUGGINGFACE_API_TOKEN"
        : null;
    console.log("[startup] Hugging Face token configured:", {
      tokenPresent: hfTokenPresent,
      tokenEnvName: hfTokenEnvName,
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
