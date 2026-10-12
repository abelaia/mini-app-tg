package telegram

import (
	"net/url"
	"strconv"
	"strings"
	"testing"
	"time"
)

const testToken = "123456:TEST-token"

func signedInitData(t *testing.T, authDate time.Time) string {
	t.Helper()
	values := url.Values{}
	values.Set("auth_date", strconv.FormatInt(authDate.Unix(), 10))
	values.Set("query_id", "AAE")
	values.Set("user", `{"id":42,"first_name":"Алина","allows_write_to_pm":true}`)
	values.Set("hash", sign(dataCheckString(values), testToken))
	return values.Encode()
}

func TestValidateInitData(t *testing.T) {
	now := time.Now()
	raw := signedInitData(t, now.Add(-time.Minute))

	got, err := ValidateInitData(raw, testToken, time.Hour, now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.User.ID != 42 || !got.User.AllowsWriteToPM {
		t.Fatalf("unexpected user: %+v", got.User)
	}
}

func TestValidateInitDataErrors(t *testing.T) {
	now := time.Now()
	cases := map[string]struct {
		raw   string
		token string
		want  error
	}{
		"wrong token": {signedInitData(t, now), "other:token", ErrBadHash},
		"expired":     {signedInitData(t, now.Add(-2*time.Hour)), testToken, ErrExpired},
		"no hash":     {"auth_date=1&user=%7B%7D", testToken, ErrNoHash},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := ValidateInitData(tc.raw, tc.token, time.Hour, now); err != tc.want {
				t.Fatalf("got %v, want %v", err, tc.want)
			}
		})
	}
}

func TestBotRedactsToken(t *testing.T) {
	b := NewBot(testToken)
	b.baseURL = "http://127.0.0.1:1"
	err := b.call(t.Context(), "getMe", map[string]any{}, nil)
	if err == nil || strings.Contains(err.Error(), testToken) {
		t.Fatalf("token leaked or no error: %v", err)
	}
}
