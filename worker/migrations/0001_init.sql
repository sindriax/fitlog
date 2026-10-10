CREATE TABLE users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL
);

CREATE TABLE login_tokens (
	token_hash TEXT PRIMARY KEY,
	email TEXT NOT NULL,
	expires_at INTEGER NOT NULL
);

CREATE TABLE sessions (
	token_hash TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id),
	created_at INTEGER NOT NULL,
	last_seen INTEGER NOT NULL
);

-- One row per synced item: a workout, routine, body weight entry, machine setting or the preferences.
CREATE TABLE records (
	user_id TEXT NOT NULL REFERENCES users(id),
	kind TEXT NOT NULL,
	id TEXT NOT NULL,
	data TEXT,
	updated_at INTEGER NOT NULL,
	deleted INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (user_id, kind, id)
);

CREATE INDEX records_by_update ON records (user_id, updated_at);
