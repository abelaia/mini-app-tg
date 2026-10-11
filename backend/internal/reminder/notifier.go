package reminder

import (
	"context"
	"errors"
	"fmt"
	"html"
	"log/slog"
	"time"

	"github.com/abelaia/mini-app-tg/backend/internal/schedule"
	"github.com/abelaia/mini-app-tg/backend/internal/telegram"
)

type Sender interface {
	SendMessage(ctx context.Context, msg telegram.Message) error
}

type Blocker interface {
	MarkBlocked(ctx context.Context, id int64) error
}

type NotifierOptions struct {
	Lead      time.Duration
	Grace     time.Duration
	Interval  time.Duration
	WebAppURL string
}

type Notifier struct {
	repo     *Repository
	users    Blocker
	schedule *schedule.Schedule
	sender   Sender
	opts     NotifierOptions
}

func NewNotifier(repo *Repository, users Blocker, s *schedule.Schedule, sender Sender, opts NotifierOptions) *Notifier {
	return &Notifier{repo: repo, users: users, schedule: s, sender: sender, opts: opts}
}

func (n *Notifier) Run(ctx context.Context) {
	ticker := time.NewTicker(n.opts.Interval)
	defer ticker.Stop()
	n.Tick(ctx, time.Now())
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			n.Tick(ctx, now)
		}
	}
}

func (n *Notifier) Tick(ctx context.Context, now time.Time) {
	for _, show := range n.schedule.Shows {
		for _, kind := range schedule.Kinds {
			for _, start := range n.schedule.OccurrencesAround(show, kind, now) {
				fireAt := start.Add(-n.opts.Lead)
				if now.Before(fireAt) || now.Sub(fireAt) > n.opts.Grace {
					continue
				}
				n.dispatch(ctx, show, kind, start, fireAt)
			}
		}
	}
}

func (n *Notifier) dispatch(ctx context.Context, show schedule.Show, kind schedule.Kind, start, fireAt time.Time) {
	recipients, err := n.repo.Due(ctx, show.ID, kind, fireAt)
	if err != nil {
		slog.Error("load due reminders", "err", err, "show", show.ID)
		return
	}
	if len(recipients) == 0 {
		return
	}
	slog.Info("sending reminders", "show", show.ID, "kind", kind, "count", len(recipients))
	msg := n.message(show, kind, start)
	for _, rec := range recipients {
		msg.ChatID = rec.UserID
		err := n.sender.SendMessage(ctx, msg)
		var apiErr *telegram.APIError
		switch {
		case err == nil:
		case errors.As(err, &apiErr) && apiErr.IsBlocked():
			if err := n.users.MarkBlocked(ctx, rec.UserID); err != nil {
				slog.Error("mark blocked", "err", err, "user", rec.UserID)
			}
		case errors.As(err, &apiErr):
			slog.Warn("telegram rejected reminder", "err", err, "user", rec.UserID)
		default:
			slog.Error("send reminder", "err", err, "user", rec.UserID)
			continue
		}
		if err := n.repo.MarkSent(ctx, rec.ReminderID, fireAt); err != nil {
			slog.Error("mark sent", "err", err, "reminder", rec.ReminderID)
		}
	}
}

var kindTitles = map[schedule.Kind]string{
	schedule.KindRepeat:   "Повтор прошлой серии",
	schedule.KindPremiere: "Новая серия",
}

func (n *Notifier) message(show schedule.Show, kind schedule.Kind, start time.Time) telegram.Message {
	platform := n.schedule.Platform(show.Platform)
	text := fmt.Sprintf(
		"🌹 <b>%s</b>\n%s в %s по Москве\n\nПеревод: %s · %s",
		html.EscapeString(show.Title),
		kindTitles[kind],
		start.Format("15:04"),
		html.EscapeString(show.Translator),
		html.EscapeString(platform.Title),
	)
	var rows [][]telegram.InlineButton
	if platform.URL != "" {
		rows = append(rows, []telegram.InlineButton{{Text: "Смотреть · " + platform.Title, URL: platform.URL}})
	}
	if n.opts.WebAppURL != "" {
		rows = append(rows, []telegram.InlineButton{{Text: "Открыть расписание", WebApp: &telegram.WebAppInfo{URL: n.opts.WebAppURL}}})
	}
	msg := telegram.Message{Text: text, ParseMode: "HTML"}
	if len(rows) > 0 {
		msg.ReplyMarkup = &telegram.InlineKeyboard{Rows: rows}
	}
	return msg
}
