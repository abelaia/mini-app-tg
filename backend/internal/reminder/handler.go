package reminder

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/abelaia/mini-app-tg/backend/internal/httpx"
	"github.com/abelaia/mini-app-tg/backend/internal/schedule"
	"github.com/abelaia/mini-app-tg/backend/internal/telegram"
)

type UserSaver interface {
	Upsert(ctx context.Context, u telegram.User) error
}

type Handler struct {
	repo     *Repository
	users    UserSaver
	schedule *schedule.Schedule
}

func NewHandler(repo *Repository, users UserSaver, s *schedule.Schedule) *Handler {
	return &Handler{repo: repo, users: users, schedule: s}
}

func (h *Handler) Register(r *httpx.Router) {
	r.Private("GET /api/reminders", h.list)
	r.Private("POST /api/reminders", h.create)
	r.Private("DELETE /api/reminders/{id}", h.delete)
	r.Private("DELETE /api/reminders", h.deleteAll)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.List(r.Context(), httpx.UserFrom(r.Context()).ID)
	if err != nil {
		h.fail(w, "list reminders", err)
		return
	}
	httpx.JSON(w, http.StatusOK, items)
}

type createRequest struct {
	ShowID string        `json:"showId"`
	Kind   schedule.Kind `json:"kind"`
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var req createRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if !h.schedule.HasEvent(req.ShowID, req.Kind) {
		httpx.Error(w, http.StatusUnprocessableEntity, "unknown show or kind")
		return
	}
	u := httpx.UserFrom(r.Context())
	if err := h.users.Upsert(r.Context(), u); err != nil {
		h.fail(w, "upsert user", err)
		return
	}
	rem, err := h.repo.Create(r.Context(), u.ID, req.ShowID, req.Kind)
	if err != nil {
		h.fail(w, "create reminder", err)
		return
	}
	httpx.JSON(w, http.StatusCreated, rem)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	found, err := h.repo.Delete(r.Context(), httpx.UserFrom(r.Context()).ID, id)
	if err != nil {
		h.fail(w, "delete reminder", err)
		return
	}
	if !found {
		httpx.Error(w, http.StatusNotFound, "not found")
		return
	}
	httpx.NoContent(w)
}

func (h *Handler) deleteAll(w http.ResponseWriter, r *http.Request) {
	if err := h.repo.DeleteAll(r.Context(), httpx.UserFrom(r.Context()).ID); err != nil {
		h.fail(w, "delete reminders", err)
		return
	}
	httpx.NoContent(w)
}

func (h *Handler) fail(w http.ResponseWriter, op string, err error) {
	slog.Error(op, "err", err)
	httpx.Error(w, http.StatusInternalServerError, "internal error")
}
