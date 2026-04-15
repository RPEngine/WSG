import express from "express";
import {
  completeScenario,
  generateScenario,
  getScenarioById,
  listScenarioCatalog,
} from "../controllers/scenarioController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { contentSafetyGate, requireObjectBody, sanitizeBody } from "../middleware/requestSecurity.js";

const router = express.Router();
const scenarioCreateLimiter = createRateLimiter({ keyPrefix: "scenario:create", limit: 20, windowMs: 60_000, message: "Scenario action rate limit reached." });

router.post(
  "/generate",
  requireObjectBody,
  scenarioCreateLimiter,
  sanitizeBody({ prompt: { maxLength: 1500 }, genre: { maxLength: 120 }, tone: { maxLength: 120 }, constraints: { maxLength: 1200 } }),
  contentSafetyGate({ fields: ["prompt", "constraints"], category: "scenario" }),
  generateScenario,
);
router.post(
  "/:id/complete",
  requireAuth,
  requireObjectBody,
  scenarioCreateLimiter,
  sanitizeBody({ title: { maxLength: 200 }, mode: { maxLength: 80 } }),
  completeScenario,
);
router.get("/", listScenarioCatalog);
router.get("/:id", getScenarioById);

export default router;
