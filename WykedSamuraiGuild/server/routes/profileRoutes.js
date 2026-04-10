import express from "express";
import {
  getMember,
  getMyProfile,
  listMembers,
  updateMyProfile,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile/me", requireAuth, getMyProfile);
router.patch("/profile/me", requireAuth, updateMyProfile);
router.get("/members", listMembers);
router.get("/members/:id", getMember);

export default router;
