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

const router = express.Router();

router.get("/direct/:connectionId", requireAuth, getDirectChat);
router.post("/direct/:connectionId", requireAuth, postDirectChat);
router.get("/scenario", requireAuth, getScenarioChat);
router.post("/scenario", requireAuth, postScenarioChat);
router.get("/area", requireAuth, getAreaChat);
router.post("/area", requireAuth, postAreaChat);

export default router;
