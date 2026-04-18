import {
  activateOwnProfileLayer,
  addOwnConnection,
  createOwnCharacter,
  deleteOwnCharacter,
  getAreaChatStream,
  getDirectConversation,
  getMemberProfile,
  getMembers,
  getOwnProfessionalProfile,
  getOwnUnifiedProfile,
  getVisibleMembersForUser,
  getOwnProfileMe,
  getOwnProfileLayer,
  getScenarioChatStream,
  listConnectionProfiles,
  listOwnCharacters,
  listOwnProfileLayers,
  postAreaChatMessage,
  postDirectConversationMessage,
  postScenarioChatMessage,
  removeOwnConnection,
  saveOwnProfessionalProfile,
  saveOwnProfile,
  saveOwnUnifiedProfile,
  saveOwnHubProfile,
  updateOwnProfilePrivacy,
  requestMemberProfileAccess,
  listOwnProfileAccessRequests,
  decideOwnProfileAccessRequest,
  searchMembersForConnections,
  updateOwnCharacter,
  updateOwnProfileLayer,
} from "../services/profileService.js";

export async function getMyProfile(req, res) {
  console.log("[profile] profile fetch request received", { userId: req.user.id, email: req.user.email });
  try {
    const profile = await getOwnUnifiedProfile(req.user);
    console.log("[profile] profile fetch success", { userId: req.user.id, hasProfile: Boolean(profile), email: req.user.email });
    return res.json({
      profile: profile || null,
      hasProfile: Boolean(profile),
      noProfileYet: !profile,
    });
  } catch (error) {
    console.warn("[profile] profile fetch fallback", {
      userId: req.user.id,
      error: error.message || "Unable to fetch profile.",
    });
    return res.json({
      profile: null,
      hasProfile: false,
      noProfileYet: true,
      degraded: true,
    });
  }
}

export async function ensureMyProfile(req, res) {
  try {
    const existingProfile = await getOwnUnifiedProfile(req.user);
    const profile = await saveOwnUnifiedProfile(req.user, req.body || {});
    return res.status(existingProfile ? 200 : 201).json({
      profile,
      created: !existingProfile,
      hasProfile: true,
      noProfileYet: false,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to ensure profile." });
  }
}

export async function getMyProfileLayers(req, res) {
  const result = await listOwnProfileLayers(req.user.id);
  return res.json(result || { accessTier: "free", subscriptionStatus: "inactive", availableLayers: ["free"], lockedLayers: ["professional", "roleplay"], layers: {} });
}

export async function getMyProfileLayer(req, res) {
  try {
    const layer = await getOwnProfileLayer(req.user.id, String(req.params.layerKey || ""));
    return res.json({ layer });
  } catch (error) {
    return res.status(403).json({ error: error.message || "Unable to fetch profile layer." });
  }
}

export async function patchMyProfileLayer(req, res) {
  try {
    const profile = await updateOwnProfileLayer(req.user.id, String(req.params.layerKey || ""), req.body || {});
    return res.json({ profile });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update profile layer." });
  }
}

export async function activateMyProfileLayer(req, res) {
  try {
    const result = await activateOwnProfileLayer(req.user.id, String(req.params.layerKey || ""));
    return res.json(result);
  } catch (error) {
    return res.status(403).json({ error: error.message || "Unable to activate profile layer." });
  }
}

export async function updateMyProfile(req, res) {
  console.log("[profile] profile save request received", {
    userId: req.user.id,
    email: req.user.email,
    fields: Object.keys(req.body || {}),
  });
  try {
    const profile = await saveOwnUnifiedProfile(req.user, req.body || {});
    console.log("[profile] profile save success", { userId: profile?.id, email: profile?.email });
    return res.json({ profile });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update profile." });
  }
}

export async function getMyProfessionalProfile(req, res) {
  const profile = await getOwnProfessionalProfile(req.user.id);
  return res.json({ profile: profile || { userId: req.user.id, headline: "", summary: "", skills: [], resumeFilename: "", openToWork: false, recruiterVisible: false } });
}

export async function putMyProfessionalProfile(req, res) {
  try {
    const profile = await saveOwnProfessionalProfile(req.user.id, req.body || {});
    return res.json({ profile });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update professional profile." });
  }
}

export async function listMyCharacters(req, res) {
  const items = await listOwnCharacters(req.user.id);
  return res.json({ items, count: items.length });
}

export async function postMyCharacter(req, res) {
  try {
    const character = await createOwnCharacter(req.user.id, req.body || {});
    return res.status(201).json({ character });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to create character." });
  }
}

export async function patchMyCharacter(req, res) {
  try {
    const character = await updateOwnCharacter(req.user.id, req.params.characterId, req.body || {});
    return res.json({ character });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update character." });
  }
}

export async function removeMyCharacter(req, res) {
  try {
    const result = await deleteOwnCharacter(req.user.id, req.params.characterId);
    return res.json(result);
  } catch (error) {
    return res.status(404).json({ error: error.message || "Unable to delete character." });
  }
}

export async function listMembers(req, res) {
  const viewerId = req.user?.id;
  const members = viewerId ? await getVisibleMembersForUser(viewerId) : await getMembers();
  return res.json({ items: members, count: members.length });
}

export async function getMember(req, res) {
  const member = await getMemberProfile(req.params.id, req.user?.id);

  if (!member) {
    console.warn("[profile] profile fetch failure", { memberId: req.params.id, error: "Member not found." });
    return res.status(404).json({ error: "Member not found." });
  }

  return res.json({ profile: member });
}

export async function patchMyProfilePrivacy(req, res) {
  try {
    const profile = await updateOwnProfilePrivacy(req.user.id, req.body || {});
    return res.json({ profile });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update profile privacy settings." });
  }
}

export async function postProfileAccessRequest(req, res) {
  try {
    const request = await requestMemberProfileAccess(req.params.id, req.user.id);
    return res.status(201).json({ request });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to request profile access." });
  }
}

export async function getMyProfileAccessRequests(req, res) {
  const items = await listOwnProfileAccessRequests(req.user.id);
  return res.json({ items, count: items.length });
}

export async function postMyProfileAccessDecision(req, res) {
  try {
    const decision = String(req.body?.decision || "").trim().toLowerCase();
    const request = await decideOwnProfileAccessRequest(req.user.id, req.params.requestId, decision);
    return res.json({ request });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to update access request status." });
  }
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
