package schedule

import (
	"net/http"
	"time"

	"github.com/abelaia/mini-app-tg/backend/internal/httpx"
)

type Handler struct {
	store        *Store
	remindBefore time.Duration
}

func NewHandler(store *Store, remindBefore time.Duration) *Handler {
	return &Handler{store: store, remindBefore: remindBefore}
}

func (h *Handler) Register(r *httpx.Router) {
	r.Public("GET /api/schedule", h.get)
}

type response struct {
	Timezone            string              `json:"timezone"`
	RemindBeforeMinutes int                 `json:"remindBeforeMinutes"`
	Platforms           map[string]Platform `json:"platforms"`
	Shows               []Show              `json:"shows"`
	Promo               *Promo              `json:"promo,omitempty"`
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "public, max-age=30")
	promo := h.store.Promo()
	// Always return promo (including enabled:false) so the client can hide a
	// disabled banner instead of falling back to hardcoded copy.
	httpx.JSON(w, http.StatusOK, response{
		Timezone:            h.store.Timezone(),
		RemindBeforeMinutes: int(h.remindBefore.Minutes()),
		Platforms:           h.store.Platforms(),
		Shows:               h.store.PublicShows(),
		Promo:               &promo,
	})
}
