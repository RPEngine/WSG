ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'public';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS allow_shareable_link BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS allow_access_requests BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS allow_recruiter_access_requests BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS show_in_member_search BOOLEAN NOT NULL DEFAULT TRUE;

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
