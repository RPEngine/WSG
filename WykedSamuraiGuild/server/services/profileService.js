import {
  findUserById,
  listUsers,
  toPublicUser,
  updateUserProfile,
} from "../models/userStore.js";

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

export function getMembers() {
  return listUsers();
}

export function getMemberProfile(memberId) {
  const user = findUserById(memberId);
  return toPublicUser(user);
}
