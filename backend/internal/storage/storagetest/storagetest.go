package storagetest

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"

	"github.com/abelaia/mini-app-tg/backend/internal/storage"
)

const port = 54329

func Run(m *testing.M) int {
	if os.Getenv("TEST_DATABASE_URL") != "" {
		return m.Run()
	}
	dir, err := os.MkdirTemp("", "pgtest")
	if err != nil {
		fmt.Println(err)
		return 1
	}
	defer os.RemoveAll(dir)
	pg := embeddedpostgres.NewDatabase(embeddedpostgres.DefaultConfig().
		Port(port).
		RuntimePath(filepath.Join(dir, "runtime")).
		DataPath(filepath.Join(dir, "data")).
		CachePath(filepath.Join(os.TempDir(), "embedded-postgres-cache")).
		Logger(nil))
	if err := pg.Start(); err != nil {
		fmt.Println("embedded postgres:", err)
		return 1
	}
	defer pg.Stop()
	os.Setenv("TEST_DATABASE_URL", fmt.Sprintf("postgres://postgres:postgres@localhost:%d/postgres?sslmode=disable", port))
	return m.Run()
}

func Open(t *testing.T) *sql.DB {
	t.Helper()
	ctx := context.Background()
	db, err := storage.Open(ctx, os.Getenv("TEST_DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		db.ExecContext(ctx, `TRUNCATE users, reminders RESTART IDENTITY CASCADE`)
		db.Close()
	})
	return db
}
