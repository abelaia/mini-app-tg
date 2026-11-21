ALTER TABLE deliveries ADD COLUMN queued_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN expires_at INTEGER NOT NULL DEFAULT 0;

CREATE INDEX deliveries_queue_idx ON deliveries(status, available_at, queued_at, expires_at);
