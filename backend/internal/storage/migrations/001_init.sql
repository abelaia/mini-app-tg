CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    first_name    TEXT    NOT NULL DEFAULT '',
    last_name     TEXT    NOT NULL DEFAULT '',
    username      TEXT    NOT NULL DEFAULT '',
    language_code TEXT    NOT NULL DEFAULT '',
    allows_write  INTEGER NOT NULL DEFAULT 0,
    is_blocked    INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
);

CREATE TABLE reminders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    show_id      TEXT    NOT NULL,
    kind         TEXT    NOT NULL,
    created_at   INTEGER NOT NULL,
    last_sent_at INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, show_id, kind)
);

CREATE INDEX reminders_event_idx ON reminders (show_id, kind);
