import express from "express";
import { healthCheck } from "../controllers/healthController.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import scenarioRoutes from "./scenarioRoutes.js";
import aiRoutes from "./aiRoutes.js";

const router = express.Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/", profileRoutes);
router.use("/scenarios", scenarioRoutes);
router.use("/ai", aiRoutes);

export default router;
