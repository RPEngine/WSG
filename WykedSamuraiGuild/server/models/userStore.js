import crypto from "crypto";
import pool from "../config/db.js";

function publicUser(row, connections = []) {
  if (!row) return null;

  const email = row.email || "";
  const username = String(email).split("@")[0] || "member";

  return {
    id: row.id,
    username,
    displayName: row.display_name || row.legal_name,
    legalName: row.legal_name,
    email,
    emailVerified: false,
    role: row.role,
    organizationName: row.organization_name || "",
    backupEmail: row.backup_email || "",
    backupEmailVerified: false,
    avatarUrl: "",
    bio: row.bio || "",
    skillsInterests: Array.isArray(row.skills) ? row.skills : [],
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

export async function createUser({
  displayName,
  legalName,
  email = "",
  role,
  organizationName = "",
  backupEmail = "",
  passwordHash,
}) {
  const userId = crypto.randomUUID();
  const profileId = crypto.randomUUID();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userInsert = await client.query(
      `INSERT INTO users (id, legal_name, email, password_hash, role, organization_name, backup_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, legalName.trim(), email.trim(), passwordHash, role, organizationName.trim(), backupEmail.trim()],
    );

    await client.query(
      `INSERT INTO profiles (id, user_id, display_name, bio, skills)
       VALUES ($1, $2, $3, '', ARRAY[]::TEXT[])`,
      [profileId, userId, (displayName || legalName).trim()],
    );

    await client.query("COMMIT");
    return publicUser({ ...userInsert.rows[0], display_name: (displayName || legalName).trim(), bio: "", skills: [] }, []);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findUserByIdentifier(identifier) {
  const { rows } = await pool.query(
    `SELECT u.*, p.display_name, p.bio, p.skills
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE LOWER(u.email) = LOWER($1)
     LIMIT 1`,
    [String(identifier || "").trim()],
  );
  return rows[0] || null;
}

export async function findUserById(userId) {
  const { rows } = await pool.query(
    `SELECT u.*, p.display_name, p.bio, p.skills
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

export async function listUsers() {
  const { rows } = await pool.query(
    `SELECT u.*, p.display_name, p.bio, p.skills
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     ORDER BY COALESCE(p.display_name, u.legal_name) ASC`,
  );

  const users = [];
  for (const row of rows) {
    const connections = await getConnectionIds(row.id);
    users.push(publicUser(row, connections));
  }
  return users;
}

export async function updateUserProfile(userId, { displayName, bio }) {
  const { rows } = await pool.query(
    `UPDATE profiles
     SET display_name = $2, bio = $3, updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId, String(displayName || "").trim(), String(bio || "").trim()],
  );

  const user = await findUserById(userId);
  if (!user) return null;
  const connections = await getConnectionIds(userId);
  return publicUser({ ...user, ...rows[0], updated_at: rows[0]?.updated_at || user.updated_at }, connections);
}

export async function updateUserHubProfile(userId, { legalName, displayName, email, role, organizationName, bio, skillsInterests }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE users
       SET legal_name = $2,
           email = $3,
           role = $4,
           organization_name = $5,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, legalName.trim(), email.trim(), role.trim(), organizationName.trim()],
    );

    await client.query(
      `UPDATE profiles
       SET display_name = $2,
           bio = $3,
           skills = $4,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, displayName.trim(), bio.trim(), skillsInterests],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const user = await findUserById(userId);
  if (!user) return null;
  const connections = await getConnectionIds(userId);
  return publicUser(user, connections);
}

export async function addConnection(userId, connectionUserId) {
  await pool.query(
    `INSERT INTO connections (id, user_id, connection_user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, connection_user_id) DO NOTHING`,
    [crypto.randomUUID(), userId, connectionUserId],
  );

  const user = await findUserById(userId);
  const connections = await getConnectionIds(userId);
  return publicUser(user, connections);
}

export async function removeConnection(userId, connectionUserId) {
  await pool.query(
    `DELETE FROM connections WHERE user_id = $1 AND connection_user_id = $2`,
    [userId, connectionUserId],
  );
  const user = await findUserById(userId);
  const connections = await getConnectionIds(userId);
  return publicUser(user, connections);
}

export async function touchLastActiveAt(userId) {
  await pool.query(`UPDATE users SET updated_at = NOW() WHERE id = $1`, [userId]);
  const user = await findUserById(userId);
  const connections = await getConnectionIds(userId);
  return publicUser(user, connections);
}

export async function createSession(userId) {
  const sessionToken = crypto.randomBytes(24).toString("hex");
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)).toISOString();

  await pool.query(
    `INSERT INTO sessions (id, user_id, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [sessionId, userId, sessionToken, expiresAt],
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

export async function toPublicUser(user) {
  if (!user) return null;
  const connections = await getConnectionIds(user.id);
  return publicUser(user, connections);
}
