import express from "express";
import { aiChat, generateAiScenario, testAiConnection } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { contentSafetyGate, requireObjectBody, sanitizeBody } from "../middleware/requestSecurity.js";

const router = express.Router();
const aiLimiter = createRateLimiter({ keyPrefix: "ai:chat", limit: 20, windowMs: 60_000, message: "AI request limit reached." });

router.post("/test", testAiConnection);
router.get("/test", testAiConnection);
router.post(
  "/chat",
  requireAuth,
  requireObjectBody,
  aiLimiter,
  sanitizeBody({ prompt: { required: true, maxLength: 2000 }, genre: { maxLength: 120 }, tone: { maxLength: 120 }, constraints: { maxLength: 1000 } }),
  contentSafetyGate({ fields: ["prompt", "constraints"], category: "scenario" }),
  aiChat,
);
router.post(
  "/scenario",
  requireAuth,
  requireObjectBody,
  aiLimiter,
  sanitizeBody({ prompt: { maxLength: 1500 }, genre: { maxLength: 120 }, tone: { maxLength: 120 }, constraints: { maxLength: 1000 } }),
  contentSafetyGate({ fields: ["prompt", "constraints"], category: "recruiter" }),
  generateAiScenario,
);

export default router;
