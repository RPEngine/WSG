import express from "express";
import {
  generateScenario,
  getScenarioById,
  listScenarioCatalog,
} from "../controllers/scenarioController.js";

const router = express.Router();

router.post("/generate", generateScenario);
router.get("/", listScenarioCatalog);
router.get("/:id", getScenarioById);

export default router;
