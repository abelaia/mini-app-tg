package reminder

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/abelaia/mini-app-tg/backend/internal/schedule"
	"github.com/abelaia/mini-app-tg/backend/internal/storage"
	"github.com/abelaia/mini-app-tg/backend/internal/telegram"
	"github.com/abelaia/mini-app-tg/backend/internal/user"
)

type fakeSender struct {
	sent []telegram.Message
}

func (f *fakeSender) SendMessage(_ context.Context, msg telegram.Message) error {
	f.sent = append(f.sent, msg)
	return nil
}

func TestNotifierSendsOncePerOccurrence(t *testing.T) {
	ctx := context.Background()
	db, err := storage.Open(ctx, filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	sched, err := schedule.Load(filepath.Join("..", "..", "data", "schedule.json"))
	if err != nil {
		t.Fatal(err)
	}
	users := user.NewRepository(db)
	repo := NewRepository(db)
	if err := users.Upsert(ctx, telegram.User{ID: 7, FirstName: "Test"}); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.Create(ctx, 7, "dalekiy-gorod", schedule.KindPremiere); err != nil {
		t.Fatal(err)
	}

	sender := &fakeSender{}
	n := NewNotifier(repo, users, sched, sender, NotifierOptions{Lead: 10 * time.Minute, Grace: 15 * time.Minute})

	monday := time.Date(2099, 1, 5, 20, 51, 0, 0, sched.Location())
	n.Tick(ctx, monday.Add(-5*time.Minute))
	if len(sender.sent) != 0 {
		t.Fatalf("sent too early: %d", len(sender.sent))
	}
	n.Tick(ctx, monday)
	n.Tick(ctx, monday.Add(time.Minute))
	if len(sender.sent) != 1 {
		t.Fatalf("expected exactly one message, got %d", len(sender.sent))
	}
	if sender.sent[0].ChatID != 7 {
		t.Fatalf("wrong chat: %d", sender.sent[0].ChatID)
	}

	n.Tick(ctx, monday.AddDate(0, 0, 7))
	if len(sender.sent) != 2 {
		t.Fatalf("expected a message next week, got %d total", len(sender.sent))
	}
}
