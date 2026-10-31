BEGIN;
CREATE TABLE IF NOT EXISTS auth_request_limits (
  identity text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1 CHECK (count > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_request_limits_expiry ON auth_request_limits(expires_at);
ALTER TABLE auth_request_limits ENABLE ROW LEVEL SECURITY;
COMMIT;
