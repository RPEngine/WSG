import {
  getMemberProfile,
  getMembers,
  getOwnProfile,
  saveOwnProfile,
} from "../services/profileService.js";

export function getMyProfile(req, res) {
  const profile = getOwnProfile(req.user.id);
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
    return res.status(404).json({ error: "Member not found." });
  }

  return res.json({ profile: member });
}
