import express from "express";
import { healthCheck } from "../controllers/healthController.js";
import { debugFriendliTest } from "../controllers/aiController.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import scenarioRoutes from "./scenarioRoutes.js";
import aiRoutes from "./aiRoutes.js";
import connectionsRoutes from "./connectionsRoutes.js";
import chatRoutes from "./chatRoutes.js";

const router = express.Router();

router.get("/health", healthCheck);
router.get("/debug/friendli-test", debugFriendliTest);
router.use("/auth", authRoutes);
router.use("/", profileRoutes);
router.use("/scenarios", scenarioRoutes);
router.use("/connections", connectionsRoutes);
router.use("/chats", chatRoutes);
router.use("/ai", aiRoutes);

export default router;
