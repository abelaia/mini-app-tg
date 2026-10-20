package bot

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWebhookRejectsWrongSecret(t *testing.T) {
	handler := NewCommands(nil, nil, "").WebhookHandler("right")
	cases := map[string]int{"": http.StatusUnauthorized, "wrong": http.StatusUnauthorized, "right": http.StatusOK}
	for secret, want := range cases {
		req := httptest.NewRequest(http.MethodPost, WebhookPath, strings.NewReader(`{"update_id":1}`))
		req.Header.Set("X-Telegram-Bot-Api-Secret-Token", secret)
		rec := httptest.NewRecorder()
		handler(rec, req)
		if rec.Code != want {
			t.Fatalf("secret %q: got %d, want %d", secret, rec.Code, want)
		}
	}
}

func TestWebhookSecretFormat(t *testing.T) {
	s := WebhookSecret("123:abc")
	if len(s) != 32 || strings.Trim(s, "0123456789abcdef") != "" {
		t.Fatalf("bad secret %q", s)
	}
}
