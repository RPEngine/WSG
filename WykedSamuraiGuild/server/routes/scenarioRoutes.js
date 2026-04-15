import express from "express";
import {
  completeScenario,
  generateScenario,
  getScenarioById,
  listScenarioCatalog,
} from "../controllers/scenarioController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", generateScenario);
router.post("/:id/complete", requireAuth, completeScenario);
router.get("/", listScenarioCatalog);
router.get("/:id", getScenarioById);

export default router;
