package config

import (
	"bufio"
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Env            string
	Addr           string
	BotToken       string
	WebAppURL      string
	DatabaseURL    string
	SchedulePath   string
	StaticDir      string
	AllowedOrigins []string
	InitDataTTL    time.Duration
	RemindBefore   time.Duration
	BotPolling     bool
	DevUserID      int64
}

func (c Config) IsDev() bool {
	return c.Env == "dev"
}

func Load() (Config, error) {
	loadDotEnv(".env")
	cfg := Config{
		Env:            get("APP_ENV", "prod"),
		Addr:           get("HTTP_ADDR", ":"+get("PORT", "8080")),
		BotToken:       get("BOT_TOKEN", ""),
		WebAppURL:      get("WEBAPP_URL", ""),
		DatabaseURL:    get("DATABASE_URL", ""),
		SchedulePath:   get("SCHEDULE_PATH", "data/schedule.json"),
		StaticDir:      get("STATIC_DIR", ""),
		AllowedOrigins: split(get("ALLOWED_ORIGINS", "")),
		InitDataTTL:    duration("INIT_DATA_TTL", 24*time.Hour),
		RemindBefore:   duration("REMIND_BEFORE", 10*time.Minute),
		BotPolling:     get("BOT_POLLING", "true") == "true",
		DevUserID:      int64Value("DEV_USER_ID", 0),
	}
	if cfg.DatabaseURL == "" {
		return cfg, errors.New("DATABASE_URL is required")
	}
	if cfg.BotToken == "" && !cfg.IsDev() {
		return cfg, errors.New("BOT_TOKEN is required")
	}
	return cfg, nil
}

func get(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func duration(key string, fallback time.Duration) time.Duration {
	d, err := time.ParseDuration(get(key, ""))
	if err != nil {
		return fallback
	}
	return d
}

func int64Value(key string, fallback int64) int64 {
	n, err := strconv.ParseInt(get(key, ""), 10, 64)
	if err != nil {
		return fallback
	}
	return n
}

func split(s string) []string {
	var out []string
	for _, part := range strings.Split(s, ",") {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, strings.Trim(strings.TrimSpace(value), `"'`))
		}
	}
}
