import crypto from "crypto";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByIdentifier,
  findUserById,
  getSession,
  toPublicUser,
  touchLastActiveAt,
} from "../models/userStore.js";

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

export function registerUser(payload = {}) {
  const username = payload.username?.trim() || "";
  const displayName = payload.displayName?.trim() || username;
  const email = payload.email?.trim() || "";
  const password = payload.password || "";

  if (!username || username.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }
  if (!validatePassword(password)) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (findUserByIdentifier(username)) {
    throw new Error("That username is already in use.");
  }
  if (email && findUserByIdentifier(email)) {
    throw new Error("That email is already in use.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const user = createUser({ username, displayName, email, passwordHash, passwordSalt: salt });
  const sessionToken = createSession(user.id);

  return { user, sessionToken };
}

export function loginUser(payload = {}) {
  const identifier = payload.identifier?.trim() || "";
  const password = payload.password || "";

  if (!identifier || !password) {
    throw new Error("Identifier and password are required.");
  }

  const user = findUserByIdentifier(identifier);
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const attemptedHash = hashPassword(password, user.passwordSalt);
  if (attemptedHash !== user.passwordHash) {
    throw new Error("Invalid credentials.");
  }

  touchLastActiveAt(user.id);
  const sessionToken = createSession(user.id);
  return { user: toPublicUser(user), sessionToken };
}

export function logoutUser(sessionToken) {
  if (sessionToken) {
    deleteSession(sessionToken);
  }
}

export function getUserFromSessionToken(sessionToken) {
  if (!sessionToken) {
    return null;
  }

  const session = getSession(sessionToken);
  if (!session) {
    return null;
  }

  const user = findUserById(session.userId);
  if (!user) {
    return null;
  }

  touchLastActiveAt(user.id);
  return toPublicUser(user);
}
