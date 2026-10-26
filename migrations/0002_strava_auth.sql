-- Private Strava tokens and server-side login sessions.
-- Apply after configuring the runstats-studio-db D1 database.

CREATE TABLE IF NOT EXISTS strava_connections (
  athlete_id INTEGER PRIMARY KEY,
  firstname TEXT,
  lastname TEXT,
  profile TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_sessions (
  session_id TEXT PRIMARY KEY,
  athlete_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (athlete_id) REFERENCES strava_connections(athlete_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_app_sessions_expiry ON app_sessions(expires_at);
