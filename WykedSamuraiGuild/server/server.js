import express from "express";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js";
import { healthCheck } from "./controllers/healthController.js";
import { PORT } from "./config/env.js";

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

app.get("/", (req, res) => {
  res.send("WSG backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
