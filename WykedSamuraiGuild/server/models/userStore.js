import crypto from "crypto";
import pool from "../config/db.js";
import { createVerificationPlaceholder } from "../config/policy.js";

const PROFILE_LAYER_KEYS = ["free", "professional", "roleplay"];

function getUnlockedLayers(accessTier = "free") {
  switch (accessTier) {
    case "guild":
      return [...PROFILE_LAYER_KEYS];
    case "professional":
      return ["free", "professional"];
    case "roleplay":
      return ["free", "roleplay"];
    case "free":
    default:
      return ["free"];
  }
}

function mapLayerRow(row) {
  return {
    id: row.id,
    layerKey: row.layer_key,
    displayName: row.display_name || "",
    headline: row.headline || "",
    bio: row.bio || "",
    skills: Array.isArray(row.skills) ? row.skills : [],
    themeMode: row.theme_mode || "",
    isPublic: row.is_public === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapScenarioHistoryRow(row) {
  return {
    scenarioId: row.scenario_id,
    title: row.title,
    mode: row.mode,
    completedAt: row.completed_at,
    summary: row.summary,
    memoryTags: Array.isArray(row.memory_tags) ? row.memory_tags : [],
  };
}

async function getProfileLayersByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM profile_layers
     WHERE user_id = $1
     ORDER BY CASE layer_key WHEN 'free' THEN 0 WHEN 'professional' THEN 1 WHEN 'roleplay' THEN 2 ELSE 9 END, created_at ASC`,
    [userId],
  );
  return rows.map(mapLayerRow);
}

function publicUser(row, layers = [], connections = [], scenarioHistory = []) {
  if (!row) return null;

  const email = row.email || "";
  const username = String(email).split("@")[0] || "member";
  const unlockedSet = new Set(getUnlockedLayers(row.access_tier));
  const availableLayers = PROFILE_LAYER_KEYS.filter((key) => unlockedSet.has(key));
  const lockedLayers = PROFILE_LAYER_KEYS.filter((key) => !unlockedSet.has(key));

  const layerMap = layers.reduce((acc, layer) => {
    acc[layer.layerKey] = layer;
    return acc;
  }, {});
  const freeLayer = layerMap.free || {
    layerKey: "free",
    displayName: row.legal_name,
    headline: "",
    bio: "",
    skills: [],
    themeMode: "",
    isPublic: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return {
    id: row.id,
    username,
    displayName: freeLayer.displayName || row.legal_name,
    legalName: row.legal_name,
    email,
    emailVerified: false,
    role: row.role,
    mfaEnabled: row.mfa_enabled === true,
    organizationName: row.organization_name || "",
    backupEmail: row.backup_email || "",
    backupEmailVerified: false,
    avatarUrl: "",
    bio: freeLayer.bio || "",
    skillsInterests: Array.isArray(freeLayer.skills) ? freeLayer.skills : [],
    accessTier: row.access_tier || "free",
    subscriptionStatus: row.subscription_status || "inactive",
    motivation: row.motivation || "",
    primaryArchetype: row.primary_archetype || "",
    secondaryArchetype: row.secondary_archetype || "",
    reflectionProfile: row.reflection_profile && typeof row.reflection_profile === "object" ? row.reflection_profile : {},
    derivedArchetypeProfile: row.derived_archetype_profile && typeof row.derived_archetype_profile === "object" ? row.derived_archetype_profile : {},
    policyAcceptance: row.policy_acceptance && typeof row.policy_acceptance === "object" ? row.policy_acceptance : {},
    verification: row.verification && typeof row.verification === "object" ? row.verification : createVerificationPlaceholder(),
    availableLayers,
    lockedLayers,
    layers: layerMap,
    scenarioHistory,
    connections,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActiveAt: row.updated_at,
    trialCount: 0,
  };
}

async function getConnectionIds(userId) {
  const { rows } = await pool.query(
    `SELECT connection_user_id FROM connections WHERE user_id = $1`,
    [userId],
  );
  return rows.map((row) => row.connection_user_id);
}

async function getScenarioHistoryByUserId(userId, limit = 6) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(20, Number(limit))) : 6;
  const { rows } = await pool.query(
    `SELECT *
     FROM user_scenario_memories
     WHERE user_id = $1
     ORDER BY completed_at DESC, created_at DESC
     LIMIT $2`,
    [userId, safeLimit],
  );
  return rows.map(mapScenarioHistoryRow);
}

export async function createUser({
  displayName,
  legalName,
  email = "",
  role,
  organizationName = "",
  backupEmail = "",
  passwordHash = null,
  authProvider = "local",
  providerSubject = "",
  mfaEnabled = false,
  policyAcceptance = {},
  verification = createVerificationPlaceholder(),
}) {
  const userId = crypto.randomUUID();
  const freeLayerId = crypto.randomUUID();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userInsert = await client.query(
      `INSERT INTO users (id, legal_name, email, password_hash, role, organization_name, backup_email, auth_provider, provider_subject, mfa_enabled, policy_acceptance, verification)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::JSONB, $12::JSONB)
       RETURNING *`,
      [userId, legalName.trim(), email.trim().toLowerCase(), passwordHash, role, organizationName.trim(), backupEmail.trim(), authProvider, providerSubject, mfaEnabled === true, JSON.stringify(policyAcceptance || {}), JSON.stringify(verification || createVerificationPlaceholder())],
    );

    await client.query(
      `INSERT INTO profile_layers (id, user_id, layer_key, display_name, bio, skills)
       VALUES ($1, $2, 'free', $3, '', ARRAY[]::TEXT[])`,
      [freeLayerId, userId, (displayName || legalName).trim()],
    );

    await client.query("COMMIT");
    return publicUser(userInsert.rows[0], [{
      id: freeLayerId,
      layerKey: "free",
      displayName: (displayName || legalName).trim(),
      headline: "",
      bio: "",
      skills: [],
      themeMode: "",
      isPublic: false,
      createdAt: userInsert.rows[0].created_at,
      updatedAt: userInsert.rows[0].updated_at,
    }], []);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserPolicyAcceptance(userId, policyAcceptance) {
  await pool.query(
    `UPDATE users
     SET policy_acceptance = $2::JSONB,
         updated_at = NOW()
     WHERE id = $1`,
    [userId, JSON.stringify(policyAcceptance || {})],
  );

  return findUserById(userId);
}

export async function findUserByIdentifier(identifier) {
  const { rows } = await pool.query(
    `SELECT u.*
     FROM users u
     WHERE LOWER(u.email) = LOWER($1)
     LIMIT 1`,
    [String(identifier || "").trim()],
  );
  return rows[0] || null;
}

export async function findUserById(userId) {
  const { rows } = await pool.query(
    `SELECT u.*
     FROM users u
     WHERE u.id = $1
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

export async function listUsers() {
  const { rows } = await pool.query(
    `SELECT u.*
     FROM users u
     ORDER BY u.legal_name ASC`,
  );

  const users = [];
  for (const row of rows) {
    const [connections, layers, scenarioHistory] = await Promise.all([
      getConnectionIds(row.id),
      getProfileLayersByUserId(row.id),
      getScenarioHistoryByUserId(row.id),
    ]);
    users.push(publicUser(row, layers, connections, scenarioHistory));
  }
  return users;
}

export async function updateUserProfile(userId, { displayName, bio }) {
  const { rows } = await pool.query(
    `UPDATE profile_layers
     SET display_name = $2, bio = $3, updated_at = NOW()
     WHERE user_id = $1 AND layer_key = 'free'
     RETURNING *`,
    [userId, String(displayName || "").trim(), String(bio || "").trim()],
  );

  const user = await findUserById(userId);
  if (!user) return null;
  const [connections, layers, scenarioHistory] = await Promise.all([
    getConnectionIds(userId),
    getProfileLayersByUserId(userId),
    getScenarioHistoryByUserId(userId),
  ]);
  return publicUser(user, layers, connections, scenarioHistory);
}

export async function updateUserHubProfile(userId, { legalName, email, role, organizationName }) {
  await pool.query(
    `UPDATE users
     SET legal_name = $2,
         email = $3,
         role = $4,
         organization_name = $5,
         updated_at = NOW()
     WHERE id = $1`,
    [userId, legalName.trim(), email.trim(), role.trim(), organizationName.trim()],
  );

  const user = await findUserById(userId);
  if (!user) return null;
  const [connections, layers, scenarioHistory] = await Promise.all([
    getConnectionIds(userId),
    getProfileLayersByUserId(userId),
    getScenarioHistoryByUserId(userId),
  ]);
  return publicUser(user, layers, connections, scenarioHistory);
}

export async function getProfileLayer(userId, layerKey) {
  const { rows } = await pool.query(
    `SELECT * FROM profile_layers WHERE user_id = $1 AND layer_key = $2 LIMIT 1`,
    [userId, layerKey],
  );
  return rows[0] ? mapLayerRow(rows[0]) : null;
}

export async function upsertProfileLayer(userId, layerKey, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO profile_layers (id, user_id, layer_key, display_name, headline, bio, skills, theme_mode, is_public)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, layer_key)
     DO UPDATE SET
       display_name = EXCLUDED.display_name,
       headline = EXCLUDED.headline,
       bio = EXCLUDED.bio,
       skills = EXCLUDED.skills,
       theme_mode = EXCLUDED.theme_mode,
       is_public = EXCLUDED.is_public,
       updated_at = NOW()
     RETURNING *`,
    [
      crypto.randomUUID(),
      userId,
      layerKey,
      String(payload.displayName || "").trim(),
      String(payload.headline || "").trim(),
      String(payload.bio || "").trim(),
      Array.isArray(payload.skills) ? payload.skills : [],
      String(payload.themeMode || "").trim(),
      payload.isPublic === true,
    ],
  );

  return mapLayerRow(rows[0]);
}

export async function addConnection(userId, connectionUserId) {
  await pool.query(
    `INSERT INTO connections (id, user_id, connection_user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, connection_user_id) DO NOTHING`,
    [crypto.randomUUID(), userId, connectionUserId],
  );

  const user = await findUserById(userId);
  const [connections, layers, scenarioHistory] = await Promise.all([
    getConnectionIds(userId),
    getProfileLayersByUserId(userId),
    getScenarioHistoryByUserId(userId),
  ]);
  return publicUser(user, layers, connections, scenarioHistory);
}

export async function removeConnection(userId, connectionUserId) {
  await pool.query(
    `DELETE FROM connections WHERE user_id = $1 AND connection_user_id = $2`,
    [userId, connectionUserId],
  );
  const user = await findUserById(userId);
  const [connections, layers, scenarioHistory] = await Promise.all([
    getConnectionIds(userId),
    getProfileLayersByUserId(userId),
    getScenarioHistoryByUserId(userId),
  ]);
  return publicUser(user, layers, connections, scenarioHistory);
}

export async function touchLastActiveAt(userId) {
  await pool.query(`UPDATE users SET updated_at = NOW() WHERE id = $1`, [userId]);
  const user = await findUserById(userId);
  const [connections, layers] = await Promise.all([
    getConnectionIds(userId),
    getProfileLayersByUserId(userId),
  ]);
  return publicUser(user, layers, connections);
}

export async function createSession(userId, options = {}) {
  const replaceToken = String(options.replaceToken || "").trim();
  const mfaConfirmed = options.mfaConfirmed === true;
  const sessionToken = crypto.randomBytes(24).toString("hex");
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)).toISOString();

  if (replaceToken) {
    await deleteSession(replaceToken);
  }

  await pool.query(
    `INSERT INTO sessions (id, user_id, token, authenticated_at, mfa_confirmed_at, expires_at)
     VALUES ($1, $2, $3, NOW(), $4, $5)`,
    [sessionId, userId, sessionToken, mfaConfirmed ? new Date().toISOString() : null, expiresAt],
  );

  return sessionToken;
}

export async function getSession(sessionToken) {
  const { rows } = await pool.query(
    `SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW() LIMIT 1`,
    [sessionToken],
  );
  return rows[0] || null;
}

export async function deleteSession(sessionToken) {
  await pool.query(`DELETE FROM sessions WHERE token = $1`, [sessionToken]);
}

export async function createAuthChallenge(userId, purpose = "login_mfa") {
  const challengeId = crypto.randomUUID();
  const challengeToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + (1000 * 60 * 10)).toISOString();

  await pool.query(
    `INSERT INTO auth_challenges (id, user_id, challenge_token, purpose, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [challengeId, userId, challengeToken, purpose, expiresAt],
  );

  return challengeToken;
}

export async function consumeAuthChallenge(challengeToken, purpose = "login_mfa") {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT * FROM auth_challenges
       WHERE challenge_token = $1
         AND purpose = $2
         AND expires_at > NOW()
       LIMIT 1`,
      [challengeToken, purpose],
    );

    const challenge = rows[0] || null;
    if (!challenge) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(`DELETE FROM auth_challenges WHERE id = $1`, [challenge.id]);
    await client.query("COMMIT");
    return challenge;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getSessionWithUser(sessionToken) {
  const { rows } = await pool.query(
    `SELECT s.*, u.email, u.mfa_enabled, u.password_hash, u.auth_provider, u.provider_subject
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
    [sessionToken],
  );
  return rows[0] || null;
}

export async function markSessionReauthenticated(sessionToken, { mfaConfirmed = false } = {}) {
  const { rows } = await pool.query(
    `UPDATE sessions
     SET authenticated_at = NOW(),
         mfa_confirmed_at = CASE WHEN $2::BOOLEAN THEN NOW() ELSE mfa_confirmed_at END
     WHERE token = $1
     RETURNING *`,
    [sessionToken, mfaConfirmed === true],
  );
  return rows[0] || null;
}

export async function toPublicUser(user) {
  if (!user) return null;
  const [connections, layers, scenarioHistory] = await Promise.all([
    getConnectionIds(user.id),
    getProfileLayersByUserId(user.id),
    getScenarioHistoryByUserId(user.id),
  ]);
  return publicUser(user, layers, connections, scenarioHistory);
}

export async function saveScenarioMemory(userId, payload) {
  const recordId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO user_scenario_memories (
      id,
      user_id,
      scenario_id,
      title,
      mode,
      completed_at,
      summary,
      memory_tags,
      profile_snapshot,
      scenario_results,
      payload
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::JSONB,$10::JSONB,$11::JSONB)`,
    [
      recordId,
      userId,
      payload.scenarioId,
      payload.title,
      payload.mode,
      payload.completedAt,
      payload.summary,
      Array.isArray(payload.memoryTags) ? payload.memoryTags : [],
      JSON.stringify(payload.profileSnapshot || {}),
      JSON.stringify(payload.scenarioResults || {}),
      JSON.stringify(payload || {}),
    ],
  );
}

export async function updateUserArchetypeContext(userId, profileSnapshot = {}, scenarioResults = {}) {
  const reflectionProfile = profileSnapshot?.reflectionProfile
    && typeof profileSnapshot.reflectionProfile === "object"
    ? profileSnapshot.reflectionProfile
    : {};
  const derivedArchetypeProfile = scenarioResults?.derivedArchetypeProfile
    && typeof scenarioResults.derivedArchetypeProfile === "object"
    ? scenarioResults.derivedArchetypeProfile
    : {};

  await pool.query(
    `UPDATE users
     SET motivation = COALESCE(NULLIF($2, ''), motivation),
         primary_archetype = COALESCE(NULLIF($3, ''), primary_archetype),
         secondary_archetype = COALESCE(NULLIF($4, ''), secondary_archetype),
         reflection_profile = CASE
           WHEN jsonb_typeof($5::JSONB) = 'object' THEN $5::JSONB
           ELSE reflection_profile
         END,
         derived_archetype_profile = CASE
           WHEN jsonb_typeof($6::JSONB) = 'object' THEN $6::JSONB
           ELSE derived_archetype_profile
         END,
         updated_at = NOW()
     WHERE id = $1`,
    [
      userId,
      String(profileSnapshot?.motivation || "").trim(),
      String(profileSnapshot?.primaryArchetype || "").trim(),
      String(profileSnapshot?.secondaryArchetype || "").trim(),
      JSON.stringify(reflectionProfile),
      JSON.stringify(derivedArchetypeProfile),
    ],
  );
}

export async function getRecentScenarioMemory(userId, limit = 3) {
  return getScenarioHistoryByUserId(userId, limit);
}
