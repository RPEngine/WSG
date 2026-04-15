import express from "express";
import {
  getAreaChat,
  getDirectChat,
  getScenarioChat,
  postAreaChat,
  postDirectChat,
  postScenarioChat,
} from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { contentSafetyGate, requireObjectBody, sanitizeBody } from "../middleware/requestSecurity.js";

const router = express.Router();

const chatLimiter = createRateLimiter({ keyPrefix: "chat:send", limit: 35, windowMs: 60_000, message: "Message rate limit reached. Please slow down." });

router.get("/direct/:connectionId", requireAuth, getDirectChat);
router.post(
  "/direct/:connectionId",
  requireAuth,
  requireObjectBody,
  chatLimiter,
  sanitizeBody({ content: { required: true, maxLength: 2000 } }),
  contentSafetyGate({ fields: ["content"], category: "chat" }),
  postDirectChat,
);
router.get("/scenario", requireAuth, getScenarioChat);
router.post(
  "/scenario",
  requireAuth,
  requireObjectBody,
  chatLimiter,
  sanitizeBody({ content: { required: true, maxLength: 2000 }, scenarioId: { maxLength: 120 } }),
  contentSafetyGate({ fields: ["content"], category: "scenario" }),
  postScenarioChat,
);
router.get("/area", requireAuth, getAreaChat);
router.post(
  "/area",
  requireAuth,
  requireObjectBody,
  chatLimiter,
  sanitizeBody({ content: { required: true, maxLength: 2000 }, areaId: { maxLength: 120 } }),
  contentSafetyGate({ fields: ["content"], category: "roleplay" }),
  postAreaChat,
);

export default router;
