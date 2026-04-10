import express from "express";
import { testAiConnection } from "../controllers/aiController.js";

const router = express.Router();

router.post("/test", testAiConnection);
router.get("/test", testAiConnection);

export default router;
