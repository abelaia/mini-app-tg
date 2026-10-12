CREATE TABLE users (
    id            BIGINT  PRIMARY KEY,
    first_name    TEXT    NOT NULL DEFAULT '',
    last_name     TEXT    NOT NULL DEFAULT '',
    username      TEXT    NOT NULL DEFAULT '',
    language_code TEXT    NOT NULL DEFAULT '',
    allows_write  BOOLEAN NOT NULL DEFAULT FALSE,
    is_blocked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    BIGINT  NOT NULL,
    updated_at    BIGINT  NOT NULL
);

CREATE TABLE reminders (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    show_id      TEXT   NOT NULL,
    kind         TEXT   NOT NULL,
    created_at   BIGINT NOT NULL,
    last_sent_at BIGINT NOT NULL DEFAULT 0,
    UNIQUE (user_id, show_id, kind)
);

CREATE INDEX reminders_event_idx ON reminders (show_id, kind);
