import express from "express";
import {
  acceptPolicies,
  googleAuth,
  login,
  logout,
  me,
  reauth,
  register,
  verifyMfa,
} from "../controllers/authController.js";
import { requireSessionAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/signup", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/mfa/verify", verifyMfa);
router.post("/re-auth", reauth);
router.post("/logout", logout);
router.get("/me", me);
router.post("/policy/accept", requireSessionAuth, acceptPolicies);

export default router;
