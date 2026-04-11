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

export async function getMyProfile(req, res) {
  console.log("[profile] profile fetch request received", { userId: req.user.id, email: req.user.email });
  const profile = await getOwnProfile(req.user.id);
  console.log("[profile] profile fetch success", { userId: profile?.id, email: profile?.email });
  return res.json({ profile });
}

export async function updateMyProfile(req, res) {
  console.log("[profile] profile save request received", {
    userId: req.user.id,
    email: req.user.email,
    fields: Object.keys(req.body || {}),
  });
  try {
    const profile = await saveOwnProfile(req.user.id, req.body || {});
    console.log("[profile] profile save success", { userId: profile?.id, email: profile?.email });
    return res.json({ profile });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update profile." });
  }
}

export async function listMembers(req, res) {
  const members = await getMembers();
  return res.json({ items: members, count: members.length });
}

export async function getMember(req, res) {
  const member = await getMemberProfile(req.params.id);

  if (!member) {
    console.warn("[profile] profile fetch failure", { memberId: req.params.id, error: "Member not found." });
    return res.status(404).json({ error: "Member not found." });
  }

  return res.json({ profile: member });
}

export async function updateMyHubProfile(req, res) {
  console.log("[profile] profile save request received", {
    userId: req.user.id,
    email: req.user.email,
    fields: Object.keys(req.body || {}),
  });
  try {
    const profile = await saveOwnHubProfile(req.user.id, req.body || {});
    console.log("[profile] profile save success", {
      userId: profile?.id,
      email: profile?.email,
      legalName: profile?.legalName,
    });
    return res.json({ profile });
  } catch (error) {
    console.warn("[profile] profile save failure", {
      userId: req.user.id,
      error: error.message || "Unable to update profile hub data.",
    });
    return res.status(400).json({ error: error.message || "Unable to update profile hub data." });
  }
}

export async function listConnections(req, res) {
  const items = await listConnectionProfiles(req.user.id);
  return res.json({ items, count: items.length });
}

export async function searchConnections(req, res) {
  const query = req.query?.q || "";
  const items = await searchMembersForConnections(req.user.id, query);
  return res.json({ items, count: items.length, query: String(query || "") });
}

export async function createConnection(req, res) {
  try {
    const result = await addOwnConnection(req.user.id, req.params.connectionUserId);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to add connection." });
  }
}

export async function deleteConnection(req, res) {
  try {
    const result = await removeOwnConnection(req.user.id, req.params.connectionUserId);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to remove connection." });
  }
}

export async function getDirectChat(req, res) {
  try {
    const thread = await getDirectConversation(req.user.id, req.params.connectionUserId);
    return res.json({ thread });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Direct chat unavailable." });
  }
}

export async function postDirectChatMessage(req, res) {
  try {
    const message = await postDirectConversationMessage(req.user.id, req.params.connectionUserId, req.body?.content);
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
