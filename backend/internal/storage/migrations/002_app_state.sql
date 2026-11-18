CREATE TABLE app_state (
    key        TEXT   PRIMARY KEY,
    value      JSONB  NOT NULL,
    updated_at BIGINT NOT NULL
);
