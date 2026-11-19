package admin

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/abelaia/mini-app-tg/backend/internal/schedule"
)

type fieldErrors map[string]string

func (e fieldErrors) Error() string { return "Проверьте отмеченные поля" }
func (e fieldErrors) text(key, value string, limit int) {
	value = strings.TrimSpace(value)
	if value == "" {
		e[key] = "Заполните это поле"
	} else if utf8.RuneCountInString(value) > limit {
		e[key] = fmt.Sprintf("Не больше %d символов", limit)
	}
}

func validateSchedule(s schedule.Schedule) error {
	e := fieldErrors{}
	if _, err := time.LoadLocation(s.Timezone); err != nil || s.Timezone == "" {
		e["timezone"] = "Укажите корректный часовой пояс"
	}
	if len(s.Platforms) == 0 {
		e["platforms"] = "Добавьте хотя бы одну площадку"
	}
	for id, platform := range s.Platforms {
		key := "platforms." + id
		if !showIDPattern.MatchString(id) || len(id) > 64 {
			e[key+".id"] = "Некорректный ID площадки"
		}
		e.text(key+".title", platform.Title, 120)
		u, err := url.Parse(platform.URL)
		if err != nil || u.Host == "" || (u.Scheme != "https" && u.Scheme != "http") || len(platform.URL) > 2048 {
			e[key+".url"] = "Укажите ссылку http:// или https://"
		}
	}
	if len(s.Shows) == 0 {
		e["shows"] = "Добавьте хотя бы один сериал"
	}
	days := map[string]bool{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": true}
	icons := map[string]bool{"city": true, "mosque": true, "layers": true, "flame": true, "wave": true, "rose": true, "sparkle": true, "sun": true}
	seen := map[string]int{}
	for i, show := range s.Shows {
		key := fmt.Sprintf("shows.%d", i)
		e.text(key+".id", show.ID, 64)
		if show.ID != "" && !showIDPattern.MatchString(show.ID) {
			e[key+".id"] = "Только строчные латинские буквы, цифры и дефисы между словами"
		}
		if previous, exists := seen[show.ID]; exists {
			e[key+".id"] = "Этот ID уже используется другим сериалом"
			e[fmt.Sprintf("shows.%d.id", previous)] = e[key+".id"]
		}
		seen[show.ID] = i
		e.text(key+".title", show.Title, 120)
		e.text(key+".translator", show.Translator, 80)
		if show.Artwork != nil {
			if !regexpMediaURL.MatchString(show.Artwork.URL) {
				e[key+".artwork"] = "Загрузите изображение через форму"
			}
			if show.Artwork.Role != "banner" && show.Artwork.Role != "icon" {
				e[key+".artwork"] = "Выберите баннер или иконку"
			}
			if show.Artwork.Fit != "contain" && show.Artwork.Fit != "cover" {
				e[key+".artwork"] = "Выберите способ размещения картинки"
			}
		}
		if !days[show.Day] {
			e[key+".day"] = "Выберите день недели"
		}
		if _, ok := s.Platforms[show.Platform]; !ok {
			e[key+".platform"] = "Выберите площадку из списка"
		}
		if !icons[show.Icon] {
			e[key+".icon"] = "Выберите иконку из списка"
		}
		for _, kind := range schedule.Kinds {
			clock := show.Times[kind]
			if _, err := time.Parse("15:04", clock); err != nil || len(clock) != 5 {
				e[key+".times."+string(kind)] = "Укажите время от 00:00 до 23:59"
			}
		}
		for kind := range show.Times {
			if !kind.Valid() {
				e[key+".times"] = "Неизвестный тип показа"
			}
		}
	}
	if len(e) > 0 {
		return e
	}
	return nil
}

var regexpMediaURL = regexp.MustCompile(`^/api/media/[a-f0-9]{64}$`)

func validatePromo(p schedule.Promo) error {
	e := fieldErrors{}
	e.text("eyebrow", p.Eyebrow, 80)
	e.text("text", p.Text, 1000)
	if len(e) > 0 {
		return e
	}
	return nil
}
