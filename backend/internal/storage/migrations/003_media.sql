CREATE TABLE media (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    data BYTEA NOT NULL,
    created_at BIGINT NOT NULL
);
