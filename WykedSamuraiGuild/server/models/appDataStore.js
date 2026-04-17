import crypto from "crypto";
import pool from "../config/db.js";

function mapProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name || "",
    username: row.username || "",
    avatarUrl: row.avatar_url || "",
    tagline: row.tagline || "",
    roleTitle: row.role_title || "",
    organization: row.organization || "",
    samuraiStatus: row.samurai_status || "",
    profileType: row.profile_type || "person",
    visibility: row.visibility === "private" ? "private" : "public",
    about: row.about || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCharacterRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name || "",
    avatarUrl: row.avatar_url || "",
    world: row.world || "",
    summary: row.summary || "",
    visibility: row.visibility === "private" ? "private" : "public",
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfessionalProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    headline: row.headline || "",
    summary: row.summary || "",
    skills: Array.isArray(row.skills) ? row.skills : [],
    resumeFilename: row.resume_filename || "",
    openToWork: row.open_to_work === true,
    recruiterVisible: row.recruiter_visible === true,
    updatedAt: row.updated_at,
  };
}

export async function ensureAppUser({ userId, authProviderId = "", email = "" }) {
  const safeEmail = String(email || "").trim().toLowerCase();
  const safeProviderId = String(authProviderId || "").trim();

  await pool.query(
    `UPDATE users
     SET auth_provider_id = COALESCE(NULLIF($2, ''), auth_provider_id),
         email = COALESCE(NULLIF($3, ''), email),
         updated_at = NOW()
     WHERE id = $1`,
    [userId, safeProviderId, safeEmail],
  );

  const { rows } = await pool.query(
    `SELECT id, auth_provider_id, email, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

export async function getProfileByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM profiles
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );
  return rows[0] ? mapProfileRow(rows[0]) : null;
}

export async function upsertProfileByUserId(userId, payload = {}) {
  const recordId = String(payload.id || crypto.randomUUID());
  const { rows } = await pool.query(
    `INSERT INTO profiles (
      id, user_id, display_name, username, avatar_url, tagline,
      role_title, organization, samurai_status, profile_type, visibility, about
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (user_id)
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      username = EXCLUDED.username,
      avatar_url = EXCLUDED.avatar_url,
      tagline = EXCLUDED.tagline,
      role_title = EXCLUDED.role_title,
      organization = EXCLUDED.organization,
      samurai_status = EXCLUDED.samurai_status,
      profile_type = EXCLUDED.profile_type,
      visibility = EXCLUDED.visibility,
      about = EXCLUDED.about,
      updated_at = NOW()
    RETURNING *`,
    [
      recordId,
      userId,
      String(payload.displayName || "").trim(),
      String(payload.username || "").trim(),
      String(payload.avatarUrl || "").trim(),
      String(payload.tagline || "").trim(),
      String(payload.roleTitle || "").trim(),
      String(payload.organization || "").trim(),
      String(payload.samuraiStatus || "").trim(),
      String(payload.profileType || "person").trim() || "person",
      String(payload.visibility || "public").trim().toLowerCase() === "private" ? "private" : "public",
      String(payload.about || "").trim(),
    ],
  );

  return rows[0] ? mapProfileRow(rows[0]) : null;
}

export async function listCharactersByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM characters
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
  );

  return rows.map(mapCharacterRow);
}

export async function createCharacterByUserId(userId, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO characters (
      id, user_id, name, avatar_url, world, summary, visibility, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      crypto.randomUUID(),
      userId,
      String(payload.name || "").trim(),
      String(payload.avatarUrl || "").trim(),
      String(payload.world || "").trim(),
      String(payload.summary || "").trim(),
      String(payload.visibility || "public").trim().toLowerCase() === "private" ? "private" : "public",
      String(payload.status || "active").trim() || "active",
    ],
  );
  return rows[0] ? mapCharacterRow(rows[0]) : null;
}

export async function updateCharacterByUserId(userId, characterId, payload = {}) {
  const { rows } = await pool.query(
    `UPDATE characters
     SET name = $3,
         avatar_url = $4,
         world = $5,
         summary = $6,
         visibility = $7,
         status = $8,
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      characterId,
      userId,
      String(payload.name || "").trim(),
      String(payload.avatarUrl || "").trim(),
      String(payload.world || "").trim(),
      String(payload.summary || "").trim(),
      String(payload.visibility || "public").trim().toLowerCase() === "private" ? "private" : "public",
      String(payload.status || "active").trim() || "active",
    ],
  );
  return rows[0] ? mapCharacterRow(rows[0]) : null;
}

export async function deleteCharacterByUserId(userId, characterId) {
  const { rowCount } = await pool.query(
    `DELETE FROM characters WHERE id = $1 AND user_id = $2`,
    [characterId, userId],
  );
  return rowCount > 0;
}

export async function getProfessionalProfileByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM professional_profiles WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  return rows[0] ? mapProfessionalProfileRow(rows[0]) : null;
}

export async function upsertProfessionalProfileByUserId(userId, payload = {}) {
  const skills = Array.isArray(payload.skills)
    ? payload.skills.map((item) => String(item || "").trim()).filter(Boolean)
    : String(payload.skills || "").split(",").map((item) => item.trim()).filter(Boolean);

  const { rows } = await pool.query(
    `INSERT INTO professional_profiles (
      id, user_id, headline, summary, skills, resume_filename, open_to_work, recruiter_visible
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (user_id)
    DO UPDATE SET
      headline = EXCLUDED.headline,
      summary = EXCLUDED.summary,
      skills = EXCLUDED.skills,
      resume_filename = EXCLUDED.resume_filename,
      open_to_work = EXCLUDED.open_to_work,
      recruiter_visible = EXCLUDED.recruiter_visible,
      updated_at = NOW()
    RETURNING *`,
    [
      crypto.randomUUID(),
      userId,
      String(payload.headline || "").trim(),
      String(payload.summary || "").trim(),
      skills,
      String(payload.resumeFilename || "").trim(),
      payload.openToWork === true,
      payload.recruiterVisible === true,
    ],
  );

  return rows[0] ? mapProfessionalProfileRow(rows[0]) : null;
}
