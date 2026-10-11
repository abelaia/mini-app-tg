package reminder

import (
	"context"
	"database/sql"
	"time"

	"github.com/abelaia/mini-app-tg/backend/internal/schedule"
)

type Reminder struct {
	ID        int64         `json:"id"`
	ShowID    string        `json:"showId"`
	Kind      schedule.Kind `json:"kind"`
	CreatedAt time.Time     `json:"createdAt"`
}

type Recipient struct {
	ReminderID int64
	UserID     int64
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, userID int64) ([]Reminder, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, show_id, kind, created_at FROM reminders
		WHERE user_id = ? ORDER BY created_at`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Reminder{}
	for rows.Next() {
		var rem Reminder
		var created int64
		if err := rows.Scan(&rem.ID, &rem.ShowID, &rem.Kind, &created); err != nil {
			return nil, err
		}
		rem.CreatedAt = time.Unix(created, 0)
		out = append(out, rem)
	}
	return out, rows.Err()
}

func (r *Repository) Create(ctx context.Context, userID int64, showID string, kind schedule.Kind) (Reminder, error) {
	now := time.Now().Unix()
	if _, err := r.db.ExecContext(ctx, `
		INSERT INTO reminders (user_id, show_id, kind, created_at) VALUES (?, ?, ?, ?)
		ON CONFLICT (user_id, show_id, kind) DO NOTHING`, userID, showID, kind, now); err != nil {
		return Reminder{}, err
	}
	rem := Reminder{ShowID: showID, Kind: kind}
	var created int64
	err := r.db.QueryRowContext(ctx, `
		SELECT id, created_at FROM reminders WHERE user_id = ? AND show_id = ? AND kind = ?`,
		userID, showID, kind).Scan(&rem.ID, &created)
	rem.CreatedAt = time.Unix(created, 0)
	return rem, err
}

func (r *Repository) Delete(ctx context.Context, userID, id int64) (bool, error) {
	res, err := r.db.ExecContext(ctx, `DELETE FROM reminders WHERE id = ? AND user_id = ?`, id, userID)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}

func (r *Repository) DeleteAll(ctx context.Context, userID int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM reminders WHERE user_id = ?`, userID)
	return err
}

func (r *Repository) Due(ctx context.Context, showID string, kind schedule.Kind, fireAt time.Time) ([]Recipient, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT r.id, r.user_id FROM reminders r
		JOIN users u ON u.id = r.user_id
		WHERE r.show_id = ? AND r.kind = ?
			AND r.last_sent_at < ? AND r.created_at < ?
			AND u.is_blocked = 0`,
		showID, kind, fireAt.Unix(), fireAt.Unix())
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Recipient
	for rows.Next() {
		var rec Recipient
		if err := rows.Scan(&rec.ReminderID, &rec.UserID); err != nil {
			return nil, err
		}
		out = append(out, rec)
	}
	return out, rows.Err()
}

func (r *Repository) MarkSent(ctx context.Context, id int64, at time.Time) error {
	_, err := r.db.ExecContext(ctx, `UPDATE reminders SET last_sent_at = ? WHERE id = ?`, at.Unix(), id)
	return err
}
