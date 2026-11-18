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
	if err := validateSchedule(next); err != nil {
		httpx.Error(w, http.StatusUnprocessableEntity, err.Error())
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
	if promo.Eyebrow == "" || promo.Text == "" {
		httpx.Error(w, http.StatusUnprocessableEntity, "eyebrow and text are required")
		return
	}
	if err := h.store.SetPromo(r.Context(), promo); err != nil {
		slog.Error("admin save promo", "err", err)
		httpx.Error(w, http.StatusInternalServerError, "internal error")
		return
	}
	httpx.JSON(w, http.StatusOK, h.store.Promo())
}

func validateSchedule(s schedule.Schedule) error {
	if strings.TrimSpace(s.Timezone) == "" {
		return errText("timezone is required")
	}
	if len(s.Platforms) == 0 {
		return errText("at least one platform is required")
	}
	if len(s.Shows) == 0 {
		return errText("at least one show is required")
	}
	for id := range s.Platforms {
		if !showIDPattern.MatchString(id) {
			return errText("bad platform id")
		}
	}
	seen := map[string]struct{}{}
	for _, show := range s.Shows {
		if !showIDPattern.MatchString(show.ID) {
			return errText("bad show id: " + show.ID)
		}
		if _, ok := seen[show.ID]; ok {
			return errText("duplicate show id")
		}
		seen[show.ID] = struct{}{}
		if strings.TrimSpace(show.Title) == "" {
			return errText("show title is required")
		}
	}
	return nil
}

type plainError string

func (e plainError) Error() string { return string(e) }

func errText(s string) error { return plainError(s) }
