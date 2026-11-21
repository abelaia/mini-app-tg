PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    username TEXT NOT NULL DEFAULT '',
    language_code TEXT NOT NULL DEFAULT '',
    allows_write INTEGER NOT NULL DEFAULT 0,
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('repeat', 'premiere')),
    created_at INTEGER NOT NULL,
    last_sent_at INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, show_id, kind)
);

CREATE INDEX reminders_event_idx ON reminders(show_id, kind, id);

CREATE TABLE app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL CHECK (json_valid(value)),
    updated_at INTEGER NOT NULL
);

CREATE TABLE media (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- D1 rows are limited to 2 MB. Chunks preserve existing uploads up to 8 MB.
CREATE TABLE media_chunks (
    media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    part INTEGER NOT NULL,
    data BLOB NOT NULL,
    PRIMARY KEY (media_id, part)
);

-- Durable delivery state will be populated by the reminder dispatcher.
CREATE TABLE deliveries (
    reminder_id INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    fire_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at INTEGER NOT NULL,
    lease_until INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (reminder_id, fire_at)
);

CREATE INDEX deliveries_due_idx ON deliveries(status, available_at, lease_until);
