import {
  addConnection,
  findUserById,
  listUsers,
  removeConnection,
  toPublicUser,
  updateUserHubProfile,
  updateUserProfile,
} from "../models/userStore.js";
import {
  addChannelMessage,
  addDirectMessage,
  getChannelThread,
  getDirectThread,
} from "../models/chatStore.js";

const VALID_ROLES = new Set(["employee_member", "employer", "recruiter"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getOwnProfile(userId) {
  const user = findUserById(userId);
  return toPublicUser(user);
}

export function saveOwnProfile(userId, payload = {}) {
  const displayName = payload.displayName?.trim() || "";
  const avatarUrl = payload.avatarUrl?.trim() || "";
  const bio = payload.bio?.trim() || "";

  if (!displayName) {
    throw new Error("Display name is required.");
  }
  if (displayName.length > 60) {
    throw new Error("Display name must be 60 characters or less.");
  }
  if (bio.length > 280) {
    throw new Error("Bio must be 280 characters or less.");
  }

  if (avatarUrl) {
    try {
      const parsed = new URL(avatarUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("invalid");
      }
    } catch {
      throw new Error("Avatar URL must be a valid http/https URL.");
    }
  }

  const updatedUser = updateUserProfile(userId, { displayName, avatarUrl, bio });
  return updatedUser;
}

export function saveOwnHubProfile(userId, payload = {}) {
  const legalName = String(payload.legalName || "").trim();
  const displayName = String(payload.displayName || "").trim();
  const email = String(payload.email || "").trim();
  const role = String(payload.role || "").trim();
  const organizationName = String(payload.organizationName || "").trim();
  const bio = String(payload.bio || "").trim();
  const skillsInterests = String(payload.skillsInterests || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!legalName || legalName.length < 2) {
    throw new Error("Legal Name is required.");
  }
  if (!displayName || displayName.length < 2) {
    throw new Error("Display Name is required.");
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error("Email must be valid.");
  }
  if (!VALID_ROLES.has(role)) {
    throw new Error("Role must be one of employee_member, employer, or recruiter.");
  }
  if (bio.length > 500) {
    throw new Error("Bio must be 500 characters or less.");
  }

  const updated = updateUserHubProfile(userId, {
    legalName,
    displayName,
    email,
    role,
    organizationName,
    bio,
    skillsInterests,
  });
  return updated;
}

export function getMembers() {
  return listUsers();
}

export function getMemberProfile(memberId) {
  const user = findUserById(memberId);
  return toPublicUser(user);
}

export function listConnectionProfiles(userId) {
  const user = findUserById(userId);
  if (!user) {
    return [];
  }
  const connectionIds = Array.isArray(user.connections) ? user.connections : [];
  return connectionIds
    .map((id) => toPublicUser(findUserById(id)))
    .filter(Boolean);
}

export function searchMembersForConnections(userId, query = "") {
  const q = String(query || "").trim().toLowerCase();
  const currentUser = findUserById(userId);
  const connected = new Set(currentUser?.connections || []);

  return listUsers()
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

export function addOwnConnection(userId, connectionUserId) {
  if (userId === connectionUserId) {
    throw new Error("You cannot add yourself as a connection.");
  }
  const connection = findUserById(connectionUserId);
  if (!connection) {
    throw new Error("Connection target was not found.");
  }
  const updatedUser = addConnection(userId, connectionUserId);
  addConnection(connectionUserId, userId);
  return {
    me: updatedUser,
    connection: toPublicUser(connection),
  };
}

export function removeOwnConnection(userId, connectionUserId) {
  const connection = findUserById(connectionUserId);
  if (!connection) {
    throw new Error("Connection target was not found.");
  }
  const updatedUser = removeConnection(userId, connectionUserId);
  removeConnection(connectionUserId, userId);
  return {
    me: updatedUser,
    connection: toPublicUser(connection),
  };
}

export function getDirectConversation(userId, connectionUserId) {
  const me = findUserById(userId);
  const other = findUserById(connectionUserId);
  if (!me || !other) {
    throw new Error("Conversation participant not found.");
  }
  const isConnected = Array.isArray(me.connections) && me.connections.includes(connectionUserId);
  if (!isConnected) {
    throw new Error("Direct chat unavailable: add this user to your Connections first.");
  }
  return getDirectThread(userId, connectionUserId);
}

export function postDirectConversationMessage(userId, connectionUserId, content) {
  const trimmed = String(content || "").trim();
  if (!trimmed) {
    throw new Error("Message content is required.");
  }
  getDirectConversation(userId, connectionUserId);
  const message = addDirectMessage({ senderId: userId, recipientId: connectionUserId, content: trimmed });
  return message;
}

export function getScenarioChatStream(scenarioId = "starter-scenario") {
  return getChannelThread({ type: "scenario", id: scenarioId });
}

export function postScenarioChatMessage(userId, scenarioId, content) {
  const trimmed = String(content || "").trim();
  if (!trimmed) {
    throw new Error("Message content is required.");
  }
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
  if (!trimmed) {
    throw new Error("Message content is required.");
  }
  return addChannelMessage({
    type: "area",
    id: areaId || "guild-plaza",
    senderId: userId,
    content: trimmed,
  });
}
