package admin

import (
    "log/slog"
    "net/http"
    "regexp"
    "strings"

    "github.com/abelaia/mini-app-tg/backend/internal/httpx"
    "github.com/abelaia/mini-app-tg/backend/internal/schedule"
)

var showIDPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type Handler struct {
    store *schedule.Store
    acl   ACL
}

func NewHandler(store *schedule.Store, acl ACL) *Handler {
    return &Handler{store: store, acl: acl}
}

func (h *Handler) Register(r *httpx.Router) {
    r.Private("POST /api/admin/media", h.uploadMedia)
    r.Private("GET /api/admin/schedule", h.getSchedule)
    r.Private("PUT /api/admin/schedule", h.putSchedule)
    r.Private("GET /api/admin/promo", h.getPromo)
    r.Private("PUT /api/admin/promo", h.putPromo)
}

func (h *Handler) requireAdmin(w http.ResponseWriter, r *http.Request) bool {
    user := httpx.UserFrom(r.Context())
    if !h.acl.IsAdmin(user.ID) {
        httpx.Error(w, http.StatusForbidden, "admin only")
        return false
    }
    return true
}

func (h *Handler) getSchedule(w http.ResponseWriter, r *http.Request) {
    if !h.requireAdmin(w, r) {
        return
    }
    snap := h.store.Snapshot()
    httpx.JSON(w, http.StatusOK, snap)
}

func (h *Handler) putSchedule(w http.ResponseWriter, r *http.Request) {
    if !h.requireAdmin(w, r) {
        return
    }
    var next schedule.Schedule
    if err := httpx.Decode(r, &next); err != nil {
        httpx.Error(w, http.StatusBadRequest, err.Error())
        return
    }
    for i := range next.Shows {
        next.Shows[i].ID = strings.TrimSpace(next.Shows[i].ID)
        next.Shows[i].Title = strings.TrimSpace(next.Shows[i].Title)
        next.Shows[i].Translator = strings.TrimSpace(next.Shows[i].Translator)
    }
    if err := validateSchedule(next); err != nil {
        httpx.JSON(w, http.StatusUnprocessableEntity, map[string]any{"error": err.Error(), "fields": err})
        return
    }
    if err := h.store.Replace(r.Context(), next); err != nil {
        slog.Error("admin save schedule", "err", err)
        httpx.Error(w, http.StatusInternalServerError, "internal error")
        return
    }
    httpx.JSON(w, http.StatusOK, h.store.Snapshot())
}

func (h *Handler) getPromo(w http.ResponseWriter, r *http.Request) {
    if !h.requireAdmin(w, r) {
        return
    }
    httpx.JSON(w, http.StatusOK, h.store.Promo())
}

func (h *Handler) putPromo(w http.ResponseWriter, r *http.Request) {
    if !h.requireAdmin(w, r) {
        return
    }
    var promo schedule.Promo
    if err := httpx.Decode(r, &promo); err != nil {
        httpx.Error(w, http.StatusBadRequest, err.Error())
        return
    }
    promo.Eyebrow = strings.TrimSpace(promo.Eyebrow)
    promo.Text = strings.TrimSpace(promo.Text)
    if err := validatePromo(promo); err != nil {
        httpx.JSON(w, http.StatusUnprocessableEntity, map[string]any{"error": err.Error(), "fields": err})
        return
    }
    if err := h.store.SetPromo(r.Context(), promo); err != nil {
        slog.Error("admin save promo", "err", err)
        httpx.Error(w, http.StatusInternalServerError, "internal error")
        return
    }
    httpx.JSON(w, http.StatusOK, h.store.Promo())
}
