import {
  addConnection,
  findUserById,
  getProfileLayer,
  getProfileAccessRequest,
  listProfileAccessRequestsForOwner,
  listUsersVisibleTo,
  listUsers,
  removeConnection,
  resolveProfileAccessRequest,
  toPublicUser,
  createOrUpdateProfileAccessRequest,
  updateUserHubProfile,
  updateUserPrivacySettings,
  updateUserProfile,
  upsertProfileLayer,
} from "../models/userStore.js";
import {
  addChannelMessage,
  addDirectMessage,
  getChannelThread,
  getDirectThread,
} from "../models/chatStore.js";

const VALID_ROLES = new Set(["employee_member", "employer", "recruiter"]);
const VALID_LAYER_KEYS = new Set(["free", "professional", "roleplay"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getUnlockedLayers(accessTier = "free") {
  switch (accessTier) {
    case "guild":
      return ["free", "professional", "roleplay"];
    case "professional":
      return ["free", "professional"];
    case "roleplay":
      return ["free", "roleplay"];
    case "free":
    default:
      return ["free"];
  }
}

function assertLayerAccess(user, layerKey) {
  if (!VALID_LAYER_KEYS.has(layerKey)) {
    throw new Error("Invalid profile layer.");
  }
  const unlocked = new Set(getUnlockedLayers(user?.accessTier || "free"));
  if (!unlocked.has(layerKey)) {
    throw new Error("This profile layer is locked for your current tier.");
  }
}

function toProfileMeResponse(user) {
  if (!user) return null;
  const {
    availableLayers = [],
    lockedLayers = [],
    layers = {},
    ...userInfo
  } = user;
  return {
    user: userInfo,
    availableLayers,
    lockedLayers,
    layers,
  };
}

export async function getOwnProfile(userId) {
  const user = await findUserById(userId);
  return toPublicUser(user);
}

export async function getOwnProfileMe(userId) {
  return toProfileMeResponse(await getOwnProfile(userId));
}

export async function listOwnProfileLayers(userId) {
  const user = await getOwnProfile(userId);
  if (!user) return null;
  return {
    accessTier: user.accessTier,
    subscriptionStatus: user.subscriptionStatus,
    availableLayers: user.availableLayers,
    lockedLayers: user.lockedLayers,
    layers: user.layers,
  };
}

export async function getOwnProfileLayer(userId, layerKey) {
  const user = await getOwnProfile(userId);
  if (!user) return null;
  assertLayerAccess(user, layerKey);
  return user.layers?.[layerKey] || null;
}

export async function updateOwnProfileLayer(userId, layerKey, payload = {}) {
  const user = await getOwnProfile(userId);
  if (!user) return null;
  assertLayerAccess(user, layerKey);

  const displayName = String(payload.displayName || "").trim();
  const headline = String(payload.headline || "").trim();
  const bio = String(payload.bio || "").trim();
  const skills = String(payload.skills || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!displayName) throw new Error("Display name is required.");
  if (displayName.length > 60) throw new Error("Display name must be 60 characters or less.");
  if (headline.length > 120) throw new Error("Headline must be 120 characters or less.");
  if (bio.length > 800) throw new Error("Bio must be 800 characters or less.");

  await upsertProfileLayer(userId, layerKey, {
    displayName,
    headline,
    bio,
    skills,
    themeMode: String(payload.themeMode || "").trim(),
    isPublic: payload.isPublic === true,
  });

  return getOwnProfile(userId);
}

export async function activateOwnProfileLayer(userId, layerKey) {
  const user = await getOwnProfile(userId);
  if (!user) return null;
  assertLayerAccess(user, layerKey);
  const layer = await getProfileLayer(userId, layerKey);
  if (!layer) {
    throw new Error("Layer is available but no profile data exists yet.");
  }
  return { activeLayer: layerKey, layer };
}

export async function saveOwnProfile(userId, payload = {}) {
  const displayName = payload.displayName?.trim() || "";
  const avatarUrl = payload.avatarUrl?.trim() || "";
  const bio = payload.bio?.trim() || "";

  if (!displayName) throw new Error("Display name is required.");
  if (displayName.length > 60) throw new Error("Display name must be 60 characters or less.");
  if (bio.length > 280) throw new Error("Bio must be 280 characters or less.");

  if (avatarUrl) {
    try {
      const parsed = new URL(avatarUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("invalid");
    } catch {
      throw new Error("Avatar URL must be a valid http/https URL.");
    }
  }

  return updateUserProfile(userId, { displayName, bio });
}

export async function saveOwnHubProfile(userId, payload = {}) {
  const legalName = String(payload.legalName || "").trim();
  const email = String(payload.email || "").trim();
  const role = String(payload.role || "").trim();
  const organizationName = String(payload.organizationName || "").trim();

  if (!legalName || legalName.length < 2) throw new Error("Legal Name is required.");
  if (!email || !EMAIL_REGEX.test(email)) throw new Error("Email must be valid.");
  if (!VALID_ROLES.has(role)) throw new Error("Role must be one of employee_member, employer, or recruiter.");

  return updateUserHubProfile(userId, {
    legalName,
    email,
    role,
    organizationName,
  });
}

export async function getMembers() {
  return listUsers();
}

function canRequestProfileAccess(ownerProfile, requesterProfile) {
  if (!ownerProfile || !requesterProfile) return false;
  const isRecruiter = requesterProfile.role === "recruiter";
  if (isRecruiter) {
    return ownerProfile.allowRecruiterAccessRequests === true;
  }
  return ownerProfile.allowAccessRequests === true;
}

function canViewerSeeProfile(ownerProfile, viewerProfile, existingRequest = null) {
  if (!ownerProfile || !viewerProfile) return false;
  if (ownerProfile.id === viewerProfile.id) return true;
  if (ownerProfile.profileVisibility !== "private") return true;
  return existingRequest?.status === "approved";
}

function toLockedProfile(ownerProfile, viewerProfile, existingRequest = null) {
  const canRequest = canRequestProfileAccess(ownerProfile, viewerProfile);
  return {
    id: ownerProfile.id,
    username: ownerProfile.username,
    displayName: ownerProfile.displayName,
    avatarUrl: ownerProfile.avatarUrl,
    role: ownerProfile.role,
    organizationName: ownerProfile.organizationName,
    profileVisibility: ownerProfile.profileVisibility,
    locked: true,
    access: {
      canViewFull: false,
      canRequestAccess: canRequest,
      requestStatus: existingRequest?.status || null,
    },
  };
}

export async function getMemberProfile(memberId, viewerId) {
  const user = await findUserById(memberId);
  const memberProfile = await toPublicUser(user);
  if (!memberProfile) return null;

  const viewer = viewerId ? await toPublicUser(await findUserById(viewerId)) : null;
  if (!viewer) {
    return memberProfile.profileVisibility === "public" ? { ...memberProfile, access: { canViewFull: true } } : null;
  }

  const existingRequest = viewer.id === memberProfile.id ? null : await getProfileAccessRequest(memberProfile.id, viewer.id);
  const canView = canViewerSeeProfile(memberProfile, viewer, existingRequest);
  if (canView) {
    return {
      ...memberProfile,
      locked: false,
      access: {
        canViewFull: true,
        requestStatus: existingRequest?.status || null,
      },
    };
  }

  if (memberProfile.allowShareableLink !== true) {
    return null;
  }

  return toLockedProfile(memberProfile, viewer, existingRequest);
}

export async function listConnectionProfiles(userId) {
  const user = await toPublicUser(await findUserById(userId));
  if (!user) return [];

  return (await Promise.all(
    (Array.isArray(user.connections) ? user.connections : []).map(async (id) => toPublicUser(await findUserById(id))),
  )).filter(Boolean);
}

export async function searchMembersForConnections(userId, query = "") {
  const q = String(query || "").trim().toLowerCase();
  const currentUser = await toPublicUser(await findUserById(userId));
  const connected = new Set(currentUser?.connections || []);

  return (await listUsersVisibleTo(userId))
    .filter((member) => member.id !== userId)
    .filter((member) => (q
      ? [member.displayName, member.legalName, member.username, member.organizationName, member.role]
        .join(" ")
        .toLowerCase()
        .includes(q)
      : true))
    .map((member) => ({ ...member, isConnected: connected.has(member.id) }))
    .slice(0, 50);
}

export async function getVisibleMembersForUser(userId) {
  return listUsersVisibleTo(userId);
}

export async function updateOwnProfilePrivacy(userId, payload = {}) {
  return updateUserPrivacySettings(userId, payload);
}

export async function requestMemberProfileAccess(ownerId, requesterId) {
  if (!ownerId || !requesterId) throw new Error("Invalid profile access request.");
  if (ownerId === requesterId) throw new Error("You already have access to your own profile.");

  const ownerProfile = await toPublicUser(await findUserById(ownerId));
  const requesterProfile = await toPublicUser(await findUserById(requesterId));
  if (!ownerProfile || !requesterProfile) throw new Error("Profile access request target not found.");
  if (ownerProfile.profileVisibility !== "private") throw new Error("This profile is already public.");

  const existing = await getProfileAccessRequest(ownerId, requesterId);
  if (existing?.status === "approved") throw new Error("You already have approved access to this private profile.");
  if (!canRequestProfileAccess(ownerProfile, requesterProfile)) {
    throw new Error("This profile is not accepting access requests for your account type.");
  }

  return createOrUpdateProfileAccessRequest(ownerId, requesterId);
}

export async function listOwnProfileAccessRequests(ownerId) {
  const requests = await listProfileAccessRequestsForOwner(ownerId);
  return Promise.all(requests.map(async (entry) => {
    const requester = await toPublicUser(await findUserById(entry.requesterUserId));
    return {
      ...entry,
      requester: requester
        ? { id: requester.id, displayName: requester.displayName, username: requester.username, role: requester.role }
        : null,
    };
  }));
}

export async function decideOwnProfileAccessRequest(ownerId, requestId, decision) {
  if (!["approve", "deny"].includes(decision)) throw new Error("Decision must be approve or deny.");
  const result = await resolveProfileAccessRequest(ownerId, requestId, decision);
  if (!result) throw new Error("Access request was not found.");
  return result;
}

export async function addOwnConnection(userId, connectionUserId) {
  if (userId === connectionUserId) throw new Error("You cannot add yourself as a connection.");

  const connection = await findUserById(connectionUserId);
  if (!connection) throw new Error("Connection target was not found.");

  const updatedUser = await addConnection(userId, connectionUserId);
  await addConnection(connectionUserId, userId);
  return {
    me: updatedUser,
    connection: await toPublicUser(connection),
  };
}

export async function removeOwnConnection(userId, connectionUserId) {
  const connection = await findUserById(connectionUserId);
  if (!connection) throw new Error("Connection target was not found.");

  const updatedUser = await removeConnection(userId, connectionUserId);
  await removeConnection(connectionUserId, userId);
  return {
    me: updatedUser,
    connection: await toPublicUser(connection),
  };
}

export async function getDirectConversation(userId, connectionUserId) {
  const me = await toPublicUser(await findUserById(userId));
  const other = await findUserById(connectionUserId);
  if (!me || !other) throw new Error("Conversation participant not found.");

  const isConnected = Array.isArray(me.connections) && me.connections.includes(connectionUserId);
  if (!isConnected) throw new Error("Direct chat unavailable: add this user to your Connections first.");

  return getDirectThread(userId, connectionUserId);
}

export async function postDirectConversationMessage(userId, connectionUserId, content) {
  const trimmed = String(content || "").trim();
  if (!trimmed) throw new Error("Message content is required.");

  await getDirectConversation(userId, connectionUserId);
  return addDirectMessage({ senderId: userId, recipientId: connectionUserId, content: trimmed });
}

export function getScenarioChatStream(scenarioId = "starter-scenario") {
  return getChannelThread({ type: "scenario", id: scenarioId });
}

export function postScenarioChatMessage(userId, scenarioId, content) {
  const trimmed = String(content || "").trim();
  if (!trimmed) throw new Error("Message content is required.");

  return addChannelMessage({
    type: "scenario",
    id: scenarioId || "starter-scenario",
    senderId: userId,
    content: trimmed,
  });
}

export function getAreaChatStream(areaId = "guild-plaza") {
  return getChannelThread({ type: "area", id: areaId });
}

export function postAreaChatMessage(userId, areaId, content) {
  const trimmed = String(content || "").trim();
  if (!trimmed) throw new Error("Message content is required.");

  return addChannelMessage({
    type: "area",
    id: areaId || "guild-plaza",
    senderId: userId,
    content: trimmed,
  });
}
