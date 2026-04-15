import express from "express";
import {
  activateMyProfileLayer,
  createConnection,
  deleteConnection,
  getMember,
  getMyProfile,
  getMyProfileLayer,
  getMyProfileLayers,
  listMembers,
  patchMyProfileLayer,
  updateMyProfile,
  updateMyHubProfile,
} from "../controllers/profileController.js";
import { requireAuth, requireRecentReauth } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { contentSafetyGate, requireObjectBody, sanitizeBody } from "../middleware/requestSecurity.js";

const router = express.Router();
const connectionLimiter = createRateLimiter({ keyPrefix: "connections:create", limit: 20, windowMs: 60_000, message: "Too many connection actions." });

router.get("/profile/me", requireAuth, getMyProfile);
router.patch(
  "/profile/me",
  requireAuth,
  requireRecentReauth,
  requireObjectBody,
  sanitizeBody({ displayName: { required: true, maxLength: 60 }, avatarUrl: { maxLength: 500 }, bio: { maxLength: 280 } }),
  contentSafetyGate({ fields: ["displayName", "bio"], category: "profile" }),
  updateMyProfile,
);
router.patch(
  "/profile/hub",
  requireAuth,
  requireRecentReauth,
  requireObjectBody,
  sanitizeBody({ legalName: { required: true, maxLength: 120 }, email: { required: true, maxLength: 200 }, role: { required: true, maxLength: 40 }, organizationName: { maxLength: 160 } }),
  contentSafetyGate({ fields: ["legalName", "organizationName"], category: "profile" }),
  updateMyHubProfile,
);
router.get("/profile/layers", requireAuth, getMyProfileLayers);
router.get("/profile/layers/:layerKey", requireAuth, getMyProfileLayer);
router.patch(
  "/profile/layers/:layerKey",
  requireAuth,
  requireRecentReauth,
  requireObjectBody,
  sanitizeBody({ displayName: { required: true, maxLength: 60 }, headline: { maxLength: 120 }, bio: { maxLength: 800 }, skills: { maxLength: 500 } }),
  contentSafetyGate({ fields: ["displayName", "headline", "bio", "skills"], category: "profile" }),
  patchMyProfileLayer,
);
router.post("/profile/layers/:layerKey/activate", requireAuth, activateMyProfileLayer);
router.get("/members", listMembers);
router.get("/members/:id", getMember);
router.post("/connections/:connectionUserId", requireAuth, connectionLimiter, createConnection);
router.delete("/connections/:connectionUserId", requireAuth, requireRecentReauth, connectionLimiter, deleteConnection);

export default router;
