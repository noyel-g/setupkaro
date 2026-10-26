-- Dayletter's shared one-in / one-out note pool.
-- Delivered notes are retained briefly for abuse reporting, then deleted by the Worker.

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 8 AND 600),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('pending', 'available', 'delivered')),
  is_seed INTEGER NOT NULL DEFAULT 0 CHECK (is_seed IN (0, 1)),
  is_flagged INTEGER NOT NULL DEFAULT 0 CHECK (is_flagged IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_available
  ON notes(status, is_flagged, created_at);

CREATE INDEX IF NOT EXISTS idx_notes_delivered
  ON notes(status, delivered_at);

CREATE TABLE IF NOT EXISTS note_reports (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'personal', 'harassment', 'spam')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_reports_note
  ON note_reports(note_id, created_at);

-- These are openly identified as first-pile notes in the interface, not represented as visitor submissions.
INSERT OR IGNORE INTO notes (id, body, status, is_seed) VALUES
('seed-00000000000000000000000000000001', 'If today felt ordinary, that does not mean it was wasted. You were here for it. That counts.', 'available', 1),
('seed-00000000000000000000000000000002', 'A gentle reminder from a stranger: you are allowed to begin again in the middle of the week, the middle of the day, or the middle of a thought.', 'available', 1),
('seed-00000000000000000000000000000003', 'The person you are becoming does not need you to have everything figured out. Just keep showing up as honestly as you can.', 'available', 1),
('seed-00000000000000000000000000000004', 'I hope something small makes you smile today. A warm cup, a patch of sunlight, a song you forgot you loved.', 'available', 1),
('seed-00000000000000000000000000000005', 'You will never know all the lives you made a little easier just by being kind. Keep doing the quiet good things.', 'available', 1),
('seed-00000000000000000000000000000006', 'Somewhere, someone is also trying to work out what comes next. Maybe that makes us a little less alone.', 'available', 1),
('seed-00000000000000000000000000000007', 'You do not have to turn every difficult season into a lesson right away. Sometimes getting through it is enough.', 'available', 1),
('seed-00000000000000000000000000000008', 'I hope you give yourself the patience you would offer a friend who was figuring it all out for the first time.', 'available', 1),
('seed-00000000000000000000000000000009', 'There is no prize for carrying everything quietly. Let someone help if they offer. Ask, even if it feels awkward.', 'available', 1),
('seed-00000000000000000000000000000010', 'A small thing I want you to know: you have made it through every day you once thought would be too much.', 'available', 1),
('seed-00000000000000000000000000000011', 'Maybe this is your sign to take the longer way home, call someone you miss, or rest without trying to earn it.', 'available', 1),
('seed-00000000000000000000000000000012', 'We are all strangers until we are not. Thank you for leaving a little kindness here for someone you will never meet.', 'available', 1);
