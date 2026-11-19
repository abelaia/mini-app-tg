package schedule

import (
    "database/sql"
    "errors"
    "net/http"
    "regexp"
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
    r.Public("GET /api/media/{id}", h.getMedia)
}

var mediaIDPattern = regexp.MustCompile(`^[a-f0-9]{64}$`)

func (h *Handler) getMedia(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    if !mediaIDPattern.MatchString(id) {
        http.NotFound(w, r)
        return
    }
    data, contentType, err := h.store.Media(r.Context(), id)
    if errors.Is(err, sql.ErrNoRows) {
        http.NotFound(w, r)
        return
    }
    if err != nil {
        httpx.Error(w, http.StatusInternalServerError, "Не удалось загрузить изображение")
        return
    }
    w.Header().Set("Content-Type", contentType)
    w.Header().Set("X-Content-Type-Options", "nosniff")
    w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
    w.Write(data)
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
