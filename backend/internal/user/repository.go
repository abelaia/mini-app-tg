package user

import (
	"context"
	"database/sql"
	"time"

	"github.com/abelaia/mini-app-tg/backend/internal/telegram"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Upsert(ctx context.Context, u telegram.User) error {
	now := time.Now().Unix()
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO users (id, first_name, last_name, username, language_code, allows_write, is_blocked, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
		ON CONFLICT (id) DO UPDATE SET
			first_name = excluded.first_name,
			last_name = excluded.last_name,
			username = excluded.username,
			language_code = excluded.language_code,
			allows_write = MAX(users.allows_write, excluded.allows_write),
			is_blocked = 0,
			updated_at = excluded.updated_at`,
		u.ID, u.FirstName, u.LastName, u.Username, u.LanguageCode, u.AllowsWriteToPM, now, now)
	return err
}

func (r *Repository) MarkBlocked(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `UPDATE users SET is_blocked = 1, updated_at = ? WHERE id = ?`, time.Now().Unix(), id)
	return err
}
