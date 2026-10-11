package telegram

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

var (
	ErrNoHash    = errors.New("init data: hash is missing")
	ErrBadHash   = errors.New("init data: hash mismatch")
	ErrExpired   = errors.New("init data: expired")
	ErrNoUser    = errors.New("init data: user is missing")
	ErrMalformed = errors.New("init data: malformed")
)

type User struct {
	ID              int64  `json:"id"`
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name,omitempty"`
	Username        string `json:"username,omitempty"`
	LanguageCode    string `json:"language_code,omitempty"`
	PhotoURL        string `json:"photo_url,omitempty"`
	AllowsWriteToPM bool   `json:"allows_write_to_pm,omitempty"`
}

type InitData struct {
	User     User
	AuthDate time.Time
	QueryID  string
}

func ValidateInitData(raw, botToken string, ttl time.Duration, now time.Time) (InitData, error) {
	values, err := url.ParseQuery(raw)
	if err != nil {
		return InitData{}, ErrMalformed
	}
	hash := values.Get("hash")
	if hash == "" {
		return InitData{}, ErrNoHash
	}
	if !hmac.Equal([]byte(hash), []byte(sign(dataCheckString(values), botToken))) {
		return InitData{}, ErrBadHash
	}
	authUnix, err := strconv.ParseInt(values.Get("auth_date"), 10, 64)
	if err != nil {
		return InitData{}, ErrMalformed
	}
	authDate := time.Unix(authUnix, 0)
	if ttl > 0 && now.Sub(authDate) > ttl {
		return InitData{}, ErrExpired
	}
	rawUser := values.Get("user")
	if rawUser == "" {
		return InitData{}, ErrNoUser
	}
	var user User
	if err := json.Unmarshal([]byte(rawUser), &user); err != nil || user.ID == 0 {
		return InitData{}, ErrNoUser
	}
	return InitData{User: user, AuthDate: authDate, QueryID: values.Get("query_id")}, nil
}

func dataCheckString(values url.Values) string {
	keys := make([]string, 0, len(values))
	for k := range values {
		if k != "hash" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)
	pairs := make([]string, 0, len(keys))
	for _, k := range keys {
		pairs = append(pairs, k+"="+values.Get(k))
	}
	return strings.Join(pairs, "\n")
}

func sign(data, botToken string) string {
	secret := hmacSHA256([]byte("WebAppData"), []byte(botToken))
	return hex.EncodeToString(hmacSHA256(secret, []byte(data)))
}

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}
