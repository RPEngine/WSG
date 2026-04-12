import express from "express";
import {
  createConnection,
  deleteConnection,
  getAreaChat,
  getDirectChat,
  getMember,
  getMyProfile,
  getScenarioChat,
  listMembers,
  listConnections,
  postAreaChat,
  postDirectChatMessage,
  postScenarioChat,
  searchConnections,
  updateMyProfile,
  updateMyHubProfile,
} from "../controllers/profileController.js";
import { requireAuth, requireRecentReauth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile/me", requireAuth, getMyProfile);
router.patch("/profile/me", requireAuth, requireRecentReauth, updateMyProfile);
router.patch("/profile/hub", requireAuth, requireRecentReauth, updateMyHubProfile);
router.get("/members", listMembers);
router.get("/members/:id", getMember);
router.get("/connections", requireAuth, listConnections);
router.get("/connections/search", requireAuth, searchConnections);
router.post("/connections/:connectionUserId", requireAuth, createConnection);
router.delete("/connections/:connectionUserId", requireAuth, requireRecentReauth, deleteConnection);
router.get("/chats/direct/:connectionUserId", requireAuth, getDirectChat);
router.post("/chats/direct/:connectionUserId/messages", requireAuth, postDirectChatMessage);
router.get("/chats/scenario", requireAuth, getScenarioChat);
router.post("/chats/scenario/messages", requireAuth, postScenarioChat);
router.get("/chats/area", requireAuth, getAreaChat);
router.post("/chats/area/messages", requireAuth, postAreaChat);

export default router;
