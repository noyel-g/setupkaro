-- RunStats Studio initial schema.
-- Apply with: npx wrangler d1 migrations apply runstats-studio-db --local

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'editorial',
  config_json TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templates_published
  ON templates(published, updated_at);

CREATE TABLE IF NOT EXISTS saved_designs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  activity_json TEXT NOT NULL,
  customization_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id)
);