import express from "express";
import { healthCheck } from "../controllers/healthController.js";
import scenarioRoutes from "./scenarioRoutes.js";

const router = express.Router();

router.get("/health", healthCheck);
router.use("/scenarios", scenarioRoutes);

export default router;
