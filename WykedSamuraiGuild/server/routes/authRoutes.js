import express from "express";
import {
  googleAuth,
  login,
  logout,
  me,
  reauth,
  register,
  verifyMfa,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/signup", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/mfa/verify", verifyMfa);
router.post("/re-auth", reauth);
router.post("/logout", logout);
router.get("/me", me);

export default router;
