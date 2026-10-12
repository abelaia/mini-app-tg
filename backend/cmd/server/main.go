package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata"

	"github.com/abelaia/mini-app-tg/backend/internal/bot"
	"github.com/abelaia/mini-app-tg/backend/internal/config"
	"github.com/abelaia/mini-app-tg/backend/internal/httpx"
	"github.com/abelaia/mini-app-tg/backend/internal/reminder"
	"github.com/abelaia/mini-app-tg/backend/internal/schedule"
	"github.com/abelaia/mini-app-tg/backend/internal/storage"
	"github.com/abelaia/mini-app-tg/backend/internal/telegram"
	"github.com/abelaia/mini-app-tg/backend/internal/user"
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	sched, err := schedule.Load(cfg.SchedulePath)
	if err != nil {
		return err
	}
	db, err := storage.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer db.Close()

	users := user.NewRepository(db)
	reminders := reminder.NewRepository(db)

	devUserID := int64(0)
	if cfg.IsDev() {
		devUserID = cfg.DevUserID
	}
	router := httpx.NewRouter(httpx.Auth(httpx.AuthOptions{BotToken: cfg.BotToken, TTL: cfg.InitDataTTL, DevUserID: devUserID}))
	router.Public("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	router.Mount(
		schedule.NewHandler(sched, cfg.RemindBefore),
		user.NewHandler(users),
		reminder.NewHandler(reminders, users, sched),
	)
	router.Static(cfg.StaticDir)

	if cfg.BotToken != "" {
		tg := telegram.NewBot(cfg.BotToken)
		notifier := reminder.NewNotifier(reminders, users, sched, tg, reminder.NotifierOptions{
			Lead:      cfg.RemindBefore,
			Grace:     15 * time.Minute,
			Interval:  30 * time.Second,
			WebAppURL: cfg.WebAppURL,
		})
		go notifier.Run(ctx)
		if cfg.BotPolling {
			go bot.NewCommands(tg, users, cfg.WebAppURL).Run(ctx)
		}
	} else {
		slog.Warn("BOT_TOKEN is empty: notifications and bot commands are disabled")
	}

	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           httpx.Chain(router.Handler(), httpx.Recover, httpx.Logger, httpx.CORS(cfg.AllowedOrigins)),
		ReadHeaderTimeout: 5 * time.Second,
	}
	errCh := make(chan error, 1)
	go func() {
		slog.Info("server started", "addr", cfg.Addr, "env", cfg.Env)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}
