package schedule

import (
	"testing"
	"time"
)

func testSchedule(t *testing.T) *Schedule {
	t.Helper()
	s := &Schedule{
		Timezone:  "Europe/Moscow",
		Platforms: map[string]Platform{"vk": {Title: "ВКонтакте"}},
		Shows: []Show{{
			ID:       "show",
			Day:      "monday",
			Platform: "vk",
			Times:    map[Kind]string{KindPremiere: "21:00", KindRepeat: "20:00"},
		}},
	}
	if err := s.init(); err != nil {
		t.Fatal(err)
	}
	return s
}

func TestOccurrencesAround(t *testing.T) {
	s := testSchedule(t)
	show, _ := s.Show("show")
	monday := time.Date(2026, 10, 12, 20, 55, 0, 0, s.Location())

	got := s.OccurrencesAround(show, KindPremiere, monday)
	want := time.Date(2026, 10, 12, 21, 0, 0, 0, s.Location())
	if len(got) != 1 || !got[0].Equal(want) {
		t.Fatalf("got %v, want [%v]", got, want)
	}

	thursday := monday.AddDate(0, 0, 3)
	if got := s.OccurrencesAround(show, KindPremiere, thursday); len(got) != 0 {
		t.Fatalf("expected no occurrences on thursday, got %v", got)
	}
}

func TestInitRejectsUnknownDay(t *testing.T) {
	s := &Schedule{
		Timezone:  "Europe/Moscow",
		Platforms: map[string]Platform{"vk": {}},
		Shows:     []Show{{ID: "x", Day: "funday", Platform: "vk"}},
	}
	if err := s.init(); err == nil {
		t.Fatal("expected error for unknown day")
	}
}
