package httpx

import (
	"context"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/abelaia/mini-app-tg/backend/internal/telegram"
)

type Middleware func(http.Handler) http.Handler

type ctxKey struct{}

func UserFrom(ctx context.Context) telegram.User {
	user, _ := ctx.Value(ctxKey{}).(telegram.User)
	return user
}

type AuthOptions struct {
	BotToken  string
	TTL       time.Duration
	DevUserID int64
}

func Auth(opts AuthOptions) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "tma ")
			if !ok || raw == "" {
				if opts.DevUserID != 0 {
					dev := telegram.User{ID: opts.DevUserID, FirstName: "Dev", AllowsWriteToPM: true}
					next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, dev)))
					return
				}
				Error(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			data, err := telegram.ValidateInitData(raw, opts.BotToken, opts.TTL, time.Now())
			if err != nil {
				Error(w, http.StatusUnauthorized, err.Error())
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, data.User)))
		})
	}
}

func CORS(origins []string) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && (slices.Contains(origins, "*") || slices.Contains(origins, origin)) {
				h := w.Header()
				h.Set("Access-Control-Allow-Origin", origin)
				h.Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
				h.Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
				h.Set("Access-Control-Max-Age", "600")
				h.Add("Vary", "Origin")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		if strings.HasPrefix(r.URL.Path, "/api/") {
			slog.Info("http", "method", r.Method, "path", r.URL.Path, "status", sw.status, "took", time.Since(start).Round(time.Millisecond))
		}
	})
}

func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("panic", "err", rec, "path", r.URL.Path)
				Error(w, http.StatusInternalServerError, "internal error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func Chain(h http.Handler, mws ...Middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}
