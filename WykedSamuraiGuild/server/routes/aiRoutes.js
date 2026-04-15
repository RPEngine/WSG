import express from "express";
import { aiChat, generateAiScenario, testAiConnection } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/test", testAiConnection);
router.get("/test", testAiConnection);
router.post("/chat", requireAuth, aiChat);
router.post("/scenario", generateAiScenario);

export default router;
