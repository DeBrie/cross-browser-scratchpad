CREATE TABLE accounts (account_id TEXT PRIMARY KEY, salt TEXT NOT NULL, auth_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE notes (account_id TEXT NOT NULL, note_key TEXT NOT NULL, ciphertext TEXT NOT NULL, iv TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (account_id, note_key));
