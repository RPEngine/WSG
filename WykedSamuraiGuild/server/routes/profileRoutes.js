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

const router = express.Router();

router.get("/profile/me", requireAuth, getMyProfile);
router.patch("/profile/me", requireAuth, requireRecentReauth, updateMyProfile);
router.patch("/profile/hub", requireAuth, requireRecentReauth, updateMyHubProfile);
router.get("/profile/layers", requireAuth, getMyProfileLayers);
router.get("/profile/layers/:layerKey", requireAuth, getMyProfileLayer);
router.patch("/profile/layers/:layerKey", requireAuth, requireRecentReauth, patchMyProfileLayer);
router.post("/profile/layers/:layerKey/activate", requireAuth, activateMyProfileLayer);
router.get("/members", listMembers);
router.get("/members/:id", getMember);
router.post("/connections/:connectionUserId", requireAuth, createConnection);
router.delete("/connections/:connectionUserId", requireAuth, requireRecentReauth, deleteConnection);

export default router;
