package schedule

import (
    "context"
    "crypto/sha256"
    "fmt"
    "time"
)

func (st *Store) SaveMedia(ctx context.Context, data []byte, contentType string) (string, error) {
    id := fmt.Sprintf("%x", sha256.Sum256(data))
    _, err := st.db.ExecContext(ctx, `INSERT INTO media (id,content_type,data,created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`, id, contentType, data, time.Now().Unix())
    return id, err
}

func (st *Store) Media(ctx context.Context, id string) ([]byte, string, error) {
    var data []byte
    var contentType string
    err := st.db.QueryRowContext(ctx, `SELECT data,content_type FROM media WHERE id=$1`, id).Scan(&data, &contentType)
    return data, contentType, err
}
