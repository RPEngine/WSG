import express from "express";
import { aiChat, generateAiScenario, testAiConnection } from "../controllers/aiController.js";

const router = express.Router();

router.post("/test", testAiConnection);
router.get("/test", testAiConnection);
router.post("/chat", aiChat);
router.post("/scenario", generateAiScenario);

export default router;
