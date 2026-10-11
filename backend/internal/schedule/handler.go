package schedule

import (
	"net/http"
	"time"

	"github.com/abelaia/mini-app-tg/backend/internal/httpx"
)

type Handler struct {
	schedule     *Schedule
	remindBefore time.Duration
}

func NewHandler(s *Schedule, remindBefore time.Duration) *Handler {
	return &Handler{schedule: s, remindBefore: remindBefore}
}

func (h *Handler) Register(r *httpx.Router) {
	r.Public("GET /api/schedule", h.get)
}

type response struct {
	Timezone            string              `json:"timezone"`
	RemindBeforeMinutes int                 `json:"remindBeforeMinutes"`
	Platforms           map[string]Platform `json:"platforms"`
	Shows               []Show              `json:"shows"`
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "public, max-age=60")
	httpx.JSON(w, http.StatusOK, response{
		Timezone:            h.schedule.Timezone,
		RemindBeforeMinutes: int(h.remindBefore.Minutes()),
		Platforms:           h.schedule.Platforms,
		Shows:               h.schedule.Shows,
	})
}
