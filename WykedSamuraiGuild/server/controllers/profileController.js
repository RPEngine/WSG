import {
  getMemberProfile,
  getMembers,
  getOwnProfile,
  saveOwnProfile,
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
