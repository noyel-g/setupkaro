-- SetupKaro Tasks Bot schema (Cloudflare D1). Paste into D1 Console > Execute.
CREATE TABLE IF NOT EXISTS workers (
  tg_id INTEGER PRIMARY KEY,
  tg_username TEXT,
  reddit_user TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_id INTEGER,
  tg_username TEXT,
  reddit_user TEXT,
  proof_type TEXT DEFAULT 'none',
  proof_file_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at INTEGER,
  decided_at INTEGER
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  client TEXT,
  subreddit TEXT,
  content TEXT,
  instructions TEXT,
  amount INTEGER,
  needed INTEGER,
  deadline TEXT,
  status TEXT DEFAULT 'open',
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  tg_id INTEGER,
  tg_username TEXT,
  status TEXT DEFAULT 'accepted',
  post_link TEXT,
  submitted_at INTEGER,
  verified_at INTEGER,
  reject_reason TEXT,
  created_at INTEGER,
  UNIQUE(task_id, tg_id)
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER,
  task_id INTEGER,
  tg_id INTEGER,
  amount INTEGER,
  status TEXT DEFAULT 'pending',
  created_at INTEGER,
  paid_at INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (
  tg_id INTEGER PRIMARY KEY,
  state TEXT,
  data TEXT
);
-- Single source of truth: any application decision auto-syncs the worker row.
-- Works whether the decision comes from the bot button or manual SQL.
CREATE TRIGGER IF NOT EXISTS app_decision
AFTER UPDATE OF status ON applications
WHEN NEW.status IN ('approved', 'rejected')
BEGIN
  UPDATE workers SET status = NEW.status WHERE tg_id = NEW.tg_id;
END;
