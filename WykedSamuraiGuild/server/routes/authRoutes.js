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
import { createRateLimiter } from "../middleware/rateLimit.js";
import { contentSafetyGate, requireObjectBody, sanitizeBody } from "../middleware/requestSecurity.js";

const router = express.Router();

const signupLimiter = createRateLimiter({ keyPrefix: "auth:signup", limit: 8, windowMs: 60_000, message: "Too many signup attempts." });
const loginLimiter = createRateLimiter({ keyPrefix: "auth:login", limit: 10, windowMs: 60_000, message: "Too many login attempts." });
const policyAcceptLimiter = createRateLimiter({ keyPrefix: "auth:policy", limit: 12, windowMs: 60_000, message: "Too many policy acceptance attempts." });

router.post("/register", requireObjectBody, signupLimiter, sanitizeBody({
  legalName: { required: true, maxLength: 120 },
  email: { required: true, maxLength: 200 },
  backupEmail: { maxLength: 200 },
  organizationName: { maxLength: 160 },
  role: { required: true, maxLength: 40 },
}), register);
router.post("/signup", requireObjectBody, signupLimiter, sanitizeBody({
  legalName: { required: true, maxLength: 120 },
  email: { required: true, maxLength: 200 },
  backupEmail: { maxLength: 200 },
  organizationName: { maxLength: 160 },
  role: { required: true, maxLength: 40 },
}), register);
router.post("/login", requireObjectBody, loginLimiter, sanitizeBody({
  identifier: { maxLength: 200 },
  email: { maxLength: 200 },
}), login);
router.post("/google", requireObjectBody, loginLimiter, googleAuth);
router.post("/mfa/verify", requireObjectBody, loginLimiter, verifyMfa);
router.post("/re-auth", requireObjectBody, loginLimiter, reauth);
router.post("/logout", logout);
router.get("/me", me);
router.post(
  "/policy/accept",
  requireSessionAuth,
  requireObjectBody,
  policyAcceptLimiter,
  contentSafetyGate({ fields: ["policyAgreement"], category: "policy" }),
  acceptPolicies,
);

export default router;
