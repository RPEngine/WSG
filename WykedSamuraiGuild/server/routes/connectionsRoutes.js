import express from "express";
import { listConnections, searchConnections } from "../controllers/connectionsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, listConnections);
router.get("/search", requireAuth, searchConnections);

export default router;
