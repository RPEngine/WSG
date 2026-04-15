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
import { requireObjectBody, sanitizeBody } from "../middleware/requestSecurity.js";

const router = express.Router();

const signupLimiter = createRateLimiter({ keyPrefix: "auth:signup", limit: 5, windowMs: 60_000, message: "Too many signup attempts." });
const loginLimiter = createRateLimiter({ keyPrefix: "auth:login", limit: 6, windowMs: 60_000, message: "Too many login attempts." });
const policyAcceptLimiter = createRateLimiter({ keyPrefix: "auth:policy", limit: 6, windowMs: 60_000, message: "Too many policy acceptance attempts." });

router.post("/register", requireObjectBody, signupLimiter, sanitizeBody({
  legalName: { required: true, maxLength: 120 },
  email: { required: true, maxLength: 200 },
  backupEmail: { maxLength: 200 },
  organizationName: { maxLength: 160 },
  role: { required: true, maxLength: 40, allowedValues: ["employee_member", "employer", "recruiter"] },
  password: { required: true, maxLength: 200 },
  policyAgreement: { required: true, type: "boolean" },
}), register);
router.post("/signup", requireObjectBody, signupLimiter, sanitizeBody({
  legalName: { required: true, maxLength: 120 },
  email: { required: true, maxLength: 200 },
  backupEmail: { maxLength: 200 },
  organizationName: { maxLength: 160 },
  role: { required: true, maxLength: 40, allowedValues: ["employee_member", "employer", "recruiter"] },
  password: { required: true, maxLength: 200 },
  policyAgreement: { required: true, type: "boolean" },
}), register);
router.post("/login", requireObjectBody, loginLimiter, sanitizeBody({
  identifier: { required: true, maxLength: 200 },
  password: { required: true, maxLength: 200 },
}), login);
router.post("/google", requireObjectBody, loginLimiter, sanitizeBody({ idToken: { maxLength: 4096 }, credential: { maxLength: 4096 }, policyAgreement: { type: "boolean" } }, { strict: false }), googleAuth);
router.post("/mfa/verify", requireObjectBody, loginLimiter, sanitizeBody({ mfa_challenge_token: { required: true, maxLength: 500 }, code: { required: true, maxLength: 20 } }), verifyMfa);
router.post("/re-auth", requireObjectBody, loginLimiter, sanitizeBody({ password: { maxLength: 200 }, code: { maxLength: 20 }, idToken: { maxLength: 4096 }, credential: { maxLength: 4096 } }, { strict: false }), reauth);
router.post("/logout", logout);
router.get("/me", me);
router.post(
  "/policy/accept",
  requireSessionAuth,
  requireObjectBody,
  policyAcceptLimiter,
  sanitizeBody({ policyAgreement: { required: true, type: "boolean" } }),
  acceptPolicies,
);

export default router;
