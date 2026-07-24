CREATE TABLE note_revisions (
  account_id TEXT NOT NULL,
  note_key TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER NOT NULL
);
CREATE INDEX note_revisions_by_note ON note_revisions(account_id, note_key, archived_at DESC);
