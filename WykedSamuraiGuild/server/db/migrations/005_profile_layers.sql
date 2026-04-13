ALTER TABLE users
  ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive';

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
  UNIQUE(user_id, layer_key)
);

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
