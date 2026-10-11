package bot

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/abelaia/mini-app-tg/backend/internal/telegram"
)

const startText = "Привет! Это TürkDiziOnline 🌹\n\nЗдесь расписание онлайн-переводов турецких сериалов. Включи напоминания, и я напишу перед началом эфира."

type UserSaver interface {
	Upsert(ctx context.Context, u telegram.User) error
}

type Commands struct {
	bot       *telegram.Bot
	users     UserSaver
	webAppURL string
}

func NewCommands(bot *telegram.Bot, users UserSaver, webAppURL string) *Commands {
	return &Commands{bot: bot, users: users, webAppURL: webAppURL}
}

func (c *Commands) Run(ctx context.Context) {
	var offset int64
	for ctx.Err() == nil {
		updates, err := c.bot.GetUpdates(ctx, offset, 30*time.Second)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				return
			}
			slog.Warn("get updates", "err", err)
			time.Sleep(5 * time.Second)
			continue
		}
		for _, u := range updates {
			offset = u.ID + 1
			c.handle(ctx, u)
		}
	}
}

func (c *Commands) handle(ctx context.Context, u telegram.Update) {
	if u.Message == nil || !strings.HasPrefix(u.Message.Text, "/start") {
		return
	}
	if from := u.Message.From; from != nil {
		from.AllowsWriteToPM = true
		if err := c.users.Upsert(ctx, *from); err != nil {
			slog.Error("upsert user from /start", "err", err)
		}
	}
	msg := telegram.Message{ChatID: u.Message.Chat.ID, Text: startText}
	if c.webAppURL != "" {
		msg.ReplyMarkup = &telegram.InlineKeyboard{Rows: [][]telegram.InlineButton{{
			{Text: "Открыть расписание", WebApp: &telegram.WebAppInfo{URL: c.webAppURL}},
		}}}
	}
	if err := c.bot.SendMessage(ctx, msg); err != nil {
		slog.Warn("reply /start", "err", err)
	}
}
