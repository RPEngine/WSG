import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const pool = new Pool({ connectionString });

export async function connectDatabase() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL connected successfully");
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      legal_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL,
      organization_name TEXT NOT NULL DEFAULT '',
      backup_email TEXT NOT NULL DEFAULT '',
      auth_provider TEXT NOT NULL DEFAULT 'local',
      provider_subject TEXT NOT NULL DEFAULT '',
      mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      access_tier TEXT NOT NULL DEFAULT 'free',
      subscription_status TEXT NOT NULL DEFAULT 'inactive',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'local';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS provider_subject TEXT NOT NULL DEFAULT '';
  `);
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_provider_id TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'free';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS motivation TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS primary_archetype TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS secondary_archetype TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS reflection_profile JSONB NOT NULL DEFAULT '{}'::JSONB;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS derived_archetype_profile JSONB NOT NULL DEFAULT '{}'::JSONB;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS policy_acceptance JSONB NOT NULL DEFAULT '{}'::JSONB;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification JSONB NOT NULL DEFAULT '{"identityStatus":"none","provider":null,"verifiedAt":null}'::JSONB;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'public';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS allow_shareable_link BOOLEAN NOT NULL DEFAULT TRUE;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS allow_access_requests BOOLEAN NOT NULL DEFAULT TRUE;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS allow_recruiter_access_requests BOOLEAN NOT NULL DEFAULT TRUE;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS show_in_member_search BOOLEAN NOT NULL DEFAULT TRUE;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_profile_visibility_check'
      ) THEN
        ALTER TABLE users
          ADD CONSTRAINT users_profile_visibility_check
          CHECK (profile_visibility IN ('public', 'private'));
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_title TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS samurai_status TEXT NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type TEXT NOT NULL DEFAULT 'person';`);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';`);
  await pool.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about TEXT NOT NULL DEFAULT '';`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS characters (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      avatar_url TEXT NOT NULL DEFAULT '',
      world TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      visibility TEXT NOT NULL DEFAULT 'public',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS professional_profiles (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      headline TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      resume_filename TEXT NOT NULL DEFAULT '',
      open_to_work BOOLEAN NOT NULL DEFAULT FALSE,
      recruiter_visible BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      privacy_level TEXT NOT NULL DEFAULT 'public',
      notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS profile_layers (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      layer_key TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      headline TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      theme_mode TEXT NOT NULL DEFAULT '',
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT profile_layers_layer_key_check CHECK (layer_key IN ('free', 'professional', 'roleplay')),
      UNIQUE(user_id, layer_key)
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profile_layers_layer_key_check'
      ) THEN
        ALTER TABLE profile_layers
          ADD CONSTRAINT profile_layers_layer_key_check
          CHECK (layer_key IN ('free', 'professional', 'roleplay'));
      END IF;
    END $$;
  `);

  await pool.query(`
    INSERT INTO profile_layers (id, user_id, layer_key, display_name, headline, bio, skills, theme_mode, is_public)
    SELECT COALESCE(p.id, u.id), u.id, 'free', COALESCE(p.display_name, u.legal_name, ''), '', COALESCE(p.bio, ''), COALESCE(p.skills, ARRAY[]::TEXT[]), '', FALSE
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ON CONFLICT (user_id, layer_key)
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      bio = EXCLUDED.bio,
      skills = EXCLUDED.skills,
      updated_at = NOW();
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS connections (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      connection_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, connection_user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS profile_access_requests (
      id UUID PRIMARY KEY,
      owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      responded_at TIMESTAMPTZ,
      CONSTRAINT profile_access_requests_status_check CHECK (status IN ('pending', 'approved', 'denied')),
      UNIQUE(owner_user_id, requester_user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      authenticated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      mfa_confirmed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS authenticated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS mfa_confirmed_at TIMESTAMPTZ;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_challenges (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      challenge_token TEXT UNIQUE NOT NULL,
      purpose TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_scenario_memories (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scenario_id TEXT NOT NULL,
      title TEXT NOT NULL,
      mode TEXT NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL,
      summary TEXT NOT NULL,
      memory_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      profile_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
      scenario_results JSONB NOT NULL DEFAULT '{}'::JSONB,
      payload JSONB NOT NULL DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS user_scenario_memories_user_completed_idx
      ON user_scenario_memories (user_id, completed_at DESC);
  `);
}

export default pool;
