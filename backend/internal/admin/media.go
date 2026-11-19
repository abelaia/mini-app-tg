package admin

import (
	"bytes"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"

	"github.com/abelaia/mini-app-tg/backend/internal/httpx"
)

func (h *Handler) uploadMedia(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 8<<20)
	data, err := io.ReadAll(r.Body)
	if err != nil {
		httpx.Error(w, http.StatusRequestEntityTooLarge, "Изображение должно быть не больше 8 МБ")
		return
	}
	cfg, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || (format != "jpeg" && format != "png") {
		httpx.Error(w, http.StatusUnprocessableEntity, "Не удалось прочитать изображение. Выберите PNG или JPEG")
		return
	}
	if cfg.Width < 1 || cfg.Height < 1 || cfg.Width > 4096 || cfg.Height > 4096 || int64(cfg.Width)*int64(cfg.Height) > 16000000 {
		httpx.Error(w, http.StatusUnprocessableEntity, "Слишком большое разрешение изображения")
		return
	}
	contentType := "image/" + format
	id, err := h.store.SaveMedia(r.Context(), data, contentType)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "Не удалось сохранить изображение")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"url": "/api/media/" + id, "width": cfg.Width, "height": cfg.Height})
}
