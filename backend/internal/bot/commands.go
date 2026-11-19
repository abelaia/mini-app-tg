package bot

import (
    "context"
    "crypto/sha256"
    "crypto/subtle"
    "encoding/hex"
    "encoding/json"
    "errors"
    "log/slog"
    "net/http"
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

const WebhookPath = "/api/telegram/webhook"

func NewCommands(bot *telegram.Bot, users UserSaver, webAppURL string) *Commands {
    return &Commands{bot: bot, users: users, webAppURL: webAppURL}
}

func WebhookSecret(token string) string {
    sum := sha256.Sum256([]byte("webhook:" + token))
    return hex.EncodeToString(sum[:16])
}

func (c *Commands) WebhookHandler(secret string) http.HandlerFunc {
    return func(w http.ResponseWriter, req *http.Request) {
        got := req.Header.Get("X-Telegram-Bot-Api-Secret-Token")
        if subtle.ConstantTimeCompare([]byte(got), []byte(secret)) != 1 {
            w.WriteHeader(http.StatusUnauthorized)
            return
        }
        var u telegram.Update
        if err := json.NewDecoder(http.MaxBytesReader(w, req.Body, 1<<20)).Decode(&u); err != nil {
            w.WriteHeader(http.StatusBadRequest)
            return
        }
        c.handle(req.Context(), u)
        w.WriteHeader(http.StatusOK)
    }
}

func (c *Commands) RunPolling(ctx context.Context) {
    if err := c.bot.DeleteWebhook(ctx); err != nil {
        slog.Warn("delete webhook", "err", err)
    }
    c.Run(ctx)
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
