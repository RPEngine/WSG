import express from "express";
import {
  activateMyProfileLayer,
  createConnection,
  deleteConnection,
  getMember,
  getMyProfessionalProfile,
  getMyProfileAccessRequests,
  getMyProfile,
  ensureMyProfile,
  listMyCharacters,
  getMyProfileLayer,
  getMyProfileLayers,
  listMembers,
  patchMyProfilePrivacy,
  patchMyProfileLayer,
  patchMyCharacter,
  postMyProfileAccessDecision,
  postMyCharacter,
  postProfileAccessRequest,
  putMyProfessionalProfile,
  removeMyCharacter,
  updateMyProfile,
  updateMyHubProfile,
} from "../controllers/profileController.js";
import { requireAuth, requireRecentReauth } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { contentSafetyGate, requireObjectBody, sanitizeBody } from "../middleware/requestSecurity.js";

const router = express.Router();
const connectionLimiter = createRateLimiter({ keyPrefix: "connections:create", limit: 20, windowMs: 60_000, message: "Too many connection actions." });

router.get("/profile/me", requireAuth, getMyProfile);
router.post("/profile/me", requireAuth, requireObjectBody, ensureMyProfile);
router.patch(
  "/profile/me",
  requireAuth,
  requireRecentReauth,
  requireObjectBody,
  sanitizeBody({ displayName: { required: true, maxLength: 60 }, avatarUrl: { maxLength: 500 }, bio: { maxLength: 280 } }),
  contentSafetyGate({ fields: ["displayName", "bio"], category: "profile" }),
  updateMyProfile,
);
router.get("/profile/professional", requireAuth, getMyProfessionalProfile);
router.put("/profile/professional", requireAuth, requireObjectBody, putMyProfessionalProfile);
router.patch(
  "/profile/hub",
  requireAuth,
  requireRecentReauth,
  requireObjectBody,
  sanitizeBody({ legalName: { required: true, maxLength: 120 }, email: { required: true, maxLength: 200 }, role: { required: true, maxLength: 40 }, organizationName: { maxLength: 160 } }),
  contentSafetyGate({ fields: ["legalName", "organizationName"], category: "profile" }),
  updateMyHubProfile,
);
router.patch(
  "/profile/privacy",
  requireAuth,
  requireRecentReauth,
  requireObjectBody,
  patchMyProfilePrivacy,
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
router.get("/members", requireAuth, listMembers);
router.get("/members/:id", requireAuth, getMember);
router.post("/members/:id/access-requests", requireAuth, postProfileAccessRequest);
router.get("/profile/access-requests", requireAuth, getMyProfileAccessRequests);
router.post("/profile/access-requests/:requestId/decision", requireAuth, requireObjectBody, postMyProfileAccessDecision);
router.get("/characters", requireAuth, listMyCharacters);
router.post("/characters", requireAuth, requireObjectBody, postMyCharacter);
router.patch("/characters/:characterId", requireAuth, requireObjectBody, patchMyCharacter);
router.delete("/characters/:characterId", requireAuth, removeMyCharacter);
router.post("/connections/:connectionUserId", requireAuth, connectionLimiter, createConnection);
router.delete("/connections/:connectionUserId", requireAuth, requireRecentReauth, connectionLimiter, deleteConnection);

export default router;
