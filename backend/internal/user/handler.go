package user

import (
	"log/slog"
	"net/http"

	"github.com/abelaia/mini-app-tg/backend/internal/httpx"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Register(r *httpx.Router) {
	r.Private("POST /api/session", h.session)
}

func (h *Handler) session(w http.ResponseWriter, r *http.Request) {
	u := httpx.UserFrom(r.Context())
	if err := h.repo.Upsert(r.Context(), u); err != nil {
		slog.Error("upsert user", "err", err, "user", u.ID)
		httpx.Error(w, http.StatusInternalServerError, "internal error")
		return
	}
	httpx.JSON(w, http.StatusOK, u)
}
