package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type APIError struct {
	Code        int
	Description string
	RetryAfter  time.Duration
}

func (e *APIError) Error() string {
	return fmt.Sprintf("telegram api %d: %s", e.Code, e.Description)
}

func (e *APIError) IsBlocked() bool {
	return e.Code == http.StatusForbidden
}

type WebAppInfo struct {
	URL string `json:"url"`
}

type InlineButton struct {
	Text   string      `json:"text"`
	URL    string      `json:"url,omitempty"`
	WebApp *WebAppInfo `json:"web_app,omitempty"`
}

type InlineKeyboard struct {
	Rows [][]InlineButton `json:"inline_keyboard"`
}

type Message struct {
	ChatID      int64           `json:"chat_id"`
	Text        string          `json:"text"`
	ParseMode   string          `json:"parse_mode,omitempty"`
	ReplyMarkup *InlineKeyboard `json:"reply_markup,omitempty"`
}

type Update struct {
	ID      int64 `json:"update_id"`
	Message *struct {
		Text string `json:"text"`
		Chat struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		From *User `json:"from"`
	} `json:"message"`
}

type Bot struct {
	token   string
	baseURL string
	client  *http.Client
	limiter *time.Ticker
}

func NewBot(token string) *Bot {
	return &Bot{
		token:   token,
		baseURL: "https://api.telegram.org",
		client:  &http.Client{Timeout: 60 * time.Second},
		limiter: time.NewTicker(time.Second / 25),
	}
}

func (b *Bot) SendMessage(ctx context.Context, msg Message) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-b.limiter.C:
	}
	err := b.call(ctx, "sendMessage", msg, nil)
	if apiErr, ok := err.(*APIError); ok && apiErr.RetryAfter > 0 {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(apiErr.RetryAfter):
		}
		return b.call(ctx, "sendMessage", msg, nil)
	}
	return err
}

func (b *Bot) GetUpdates(ctx context.Context, offset int64, timeout time.Duration) ([]Update, error) {
	var updates []Update
	payload := map[string]any{
		"offset":          offset,
		"timeout":         int(timeout.Seconds()),
		"allowed_updates": []string{"message"},
	}
	err := b.call(ctx, "getUpdates", payload, &updates)
	return updates, err
}

func (b *Bot) call(ctx context.Context, method string, payload, result any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	endpoint := fmt.Sprintf("%s/bot%s/%s", b.baseURL, b.token, method)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := b.client.Do(req)
	if err != nil {
		return b.redact(err)
	}
	defer resp.Body.Close()
	var envelope struct {
		OK          bool            `json:"ok"`
		Result      json.RawMessage `json:"result"`
		ErrorCode   int             `json:"error_code"`
		Description string          `json:"description"`
		Parameters  struct {
			RetryAfter int `json:"retry_after"`
		} `json:"parameters"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return fmt.Errorf("telegram %s: decode: %w", method, err)
	}
	if !envelope.OK {
		return &APIError{
			Code:        envelope.ErrorCode,
			Description: envelope.Description,
			RetryAfter:  time.Duration(envelope.Parameters.RetryAfter) * time.Second,
		}
	}
	if result == nil {
		return nil
	}
	return json.Unmarshal(envelope.Result, result)
}

func (b *Bot) redact(err error) error {
	var urlErr *url.Error
	if errors.As(err, &urlErr) {
		urlErr.URL = strings.ReplaceAll(urlErr.URL, b.token, "<token>")
	}
	return err
}
