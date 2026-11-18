package schedule

type Promo struct {
	Eyebrow string `json:"eyebrow"`
	Text    string `json:"text"`
	Enabled bool   `json:"enabled"`
}

func DefaultPromo() Promo {
	return Promo{
		Eyebrow: "Анонс",
		Text:    "В субботу в 21:00 — «Розы и грехи». Сабина выходит в прямой эфир.",
		Enabled: true,
	}
}
