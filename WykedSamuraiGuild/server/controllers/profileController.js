import {
  addOwnConnection,
  getAreaChatStream,
  getDirectConversation,
  getMemberProfile,
  getMembers,
  getOwnProfile,
  getScenarioChatStream,
  listConnectionProfiles,
  postAreaChatMessage,
  postDirectConversationMessage,
  postScenarioChatMessage,
  removeOwnConnection,
  saveOwnProfile,
  saveOwnHubProfile,
  searchMembersForConnections,
} from "../services/profileService.js";

export function getMyProfile(req, res) {
  console.log("[profile] profile fetch request received", { userId: req.user.id, email: req.user.email });
  const profile = getOwnProfile(req.user.id);
  console.log("[profile] profile fetch success", { userId: profile?.id, email: profile?.email });
  return res.json({ profile });
}

export function updateMyProfile(req, res) {
  try {
    const profile = saveOwnProfile(req.user.id, req.body || {});
    return res.json({ profile });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update profile." });
  }
}

export function listMembers(req, res) {
  const members = getMembers();
  return res.json({ items: members, count: members.length });
}

export function getMember(req, res) {
  const member = getMemberProfile(req.params.id);

  if (!member) {
    console.warn("[profile] profile fetch failure", { memberId: req.params.id, error: "Member not found." });
    return res.status(404).json({ error: "Member not found." });
  }

  return res.json({ profile: member });
}

export function updateMyHubProfile(req, res) {
  try {
    const profile = saveOwnHubProfile(req.user.id, req.body || {});
    return res.json({ profile });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update profile hub data." });
  }
}

export function listConnections(req, res) {
  const items = listConnectionProfiles(req.user.id);
  return res.json({ items, count: items.length });
}

export function searchConnections(req, res) {
  const query = req.query?.q || "";
  const items = searchMembersForConnections(req.user.id, query);
  return res.json({ items, count: items.length, query: String(query || "") });
}

export function createConnection(req, res) {
  try {
    const result = addOwnConnection(req.user.id, req.params.connectionUserId);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to add connection." });
  }
}

export function deleteConnection(req, res) {
  try {
    const result = removeOwnConnection(req.user.id, req.params.connectionUserId);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to remove connection." });
  }
}

export function getDirectChat(req, res) {
  try {
    const thread = getDirectConversation(req.user.id, req.params.connectionUserId);
    return res.json({ thread });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Direct chat unavailable." });
  }
}

export function postDirectChatMessage(req, res) {
  try {
    const message = postDirectConversationMessage(req.user.id, req.params.connectionUserId, req.body?.content);
    return res.status(201).json({ message });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to send direct chat message." });
  }
}

export function getScenarioChat(req, res) {
  const scenarioId = req.query?.scenarioId || "starter-scenario";
  const thread = getScenarioChatStream(scenarioId);
  return res.json({ thread, type: "scenario" });
}

export function postScenarioChat(req, res) {
  try {
    const result = postScenarioChatMessage(req.user.id, req.body?.scenarioId, req.body?.content);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to send scenario chat message." });
  }
}

export function getAreaChat(req, res) {
  const areaId = req.query?.areaId || "guild-plaza";
  const thread = getAreaChatStream(areaId);
  return res.json({ thread, type: "area" });
}

export function postAreaChat(req, res) {
  try {
    const result = postAreaChatMessage(req.user.id, req.body?.areaId, req.body?.content);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to send area chat message." });
  }
}
