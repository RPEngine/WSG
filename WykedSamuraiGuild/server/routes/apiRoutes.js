import express from "express";
import { healthCheck } from "../controllers/healthController.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import scenarioRoutes from "./scenarioRoutes.js";

const router = express.Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/", profileRoutes);
router.use("/scenarios", scenarioRoutes);

export default router;
