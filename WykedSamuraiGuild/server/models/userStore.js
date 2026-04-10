import crypto from "crypto";

const usersById = new Map();
const usersByHandle = new Map();
const sessions = new Map();

function normalizeHandle(value = "") {
  return value.trim().toLowerCase();
}

function publicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastActiveAt: user.lastActiveAt,
    trialCount: user.trialCount,
  };
}

export function createUser({ username, displayName, email = "", passwordHash, passwordSalt }) {
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    username: username.trim(),
    displayName: (displayName || username).trim(),
    email: email.trim(),
    avatarUrl: "",
    bio: "",
    passwordHash,
    passwordSalt,
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
    trialCount: 0,
  };

  usersById.set(user.id, user);
  usersByHandle.set(normalizeHandle(user.username), user.id);
  if (user.email) {
    usersByHandle.set(normalizeHandle(user.email), user.id);
  }

  return publicUser(user);
}

export function findUserByIdentifier(identifier) {
  const userId = usersByHandle.get(normalizeHandle(identifier));
  return userId ? usersById.get(userId) : null;
}

export function findUserById(userId) {
  return usersById.get(userId) || null;
}

export function listUsers() {
  return Array.from(usersById.values())
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(publicUser);
}

export function updateUserProfile(userId, { displayName, avatarUrl, bio }) {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  if (typeof displayName === "string") {
    user.displayName = displayName.trim();
  }
  if (typeof avatarUrl === "string") {
    user.avatarUrl = avatarUrl.trim();
  }
  if (typeof bio === "string") {
    user.bio = bio.trim();
  }

  user.updatedAt = new Date().toISOString();

  return publicUser(user);
}

export function touchLastActiveAt(userId) {
  const user = findUserById(userId);
  if (!user) {
    return null;
  }

  user.lastActiveAt = new Date().toISOString();
  user.updatedAt = user.lastActiveAt;

  return publicUser(user);
}

export function createSession(userId) {
  const sessionToken = crypto.randomBytes(24).toString("hex");
  sessions.set(sessionToken, { userId, createdAt: new Date().toISOString() });
  return sessionToken;
}

export function getSession(sessionToken) {
  return sessions.get(sessionToken) || null;
}

export function deleteSession(sessionToken) {
  sessions.delete(sessionToken);
}

export function toPublicUser(user) {
  return publicUser(user);
}
