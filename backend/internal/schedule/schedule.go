package schedule

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

type Kind string

const (
	KindRepeat   Kind = "repeat"
	KindPremiere Kind = "premiere"
)

var Kinds = []Kind{KindRepeat, KindPremiere}

func (k Kind) Valid() bool {
	return k == KindRepeat || k == KindPremiere
}

var weekdays = map[string]time.Weekday{
	"monday":    time.Monday,
	"tuesday":   time.Tuesday,
	"wednesday": time.Wednesday,
	"thursday":  time.Thursday,
	"friday":    time.Friday,
	"saturday":  time.Saturday,
	"sunday":    time.Sunday,
}

type Platform struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type Show struct {
	ID         string          `json:"id"`
	Title      string          `json:"title"`
	Translator string          `json:"translator"`
	Day        string          `json:"day"`
	Platform   string          `json:"platform"`
	Icon       string          `json:"icon"`
	Times      map[Kind]string `json:"times"`
}

type Schedule struct {
	Timezone  string              `json:"timezone"`
	Platforms map[string]Platform `json:"platforms"`
	Shows     []Show              `json:"shows"`
	loc       *time.Location
	byID      map[string]Show
}

func Load(path string) (*Schedule, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("schedule: read: %w", err)
	}
	var s Schedule
	if err := json.Unmarshal(raw, &s); err != nil {
		return nil, fmt.Errorf("schedule: parse: %w", err)
	}
	if err := s.init(); err != nil {
		return nil, err
	}
	return &s, nil
}

func (s *Schedule) init() error {
	loc, err := time.LoadLocation(s.Timezone)
	if err != nil {
		return fmt.Errorf("schedule: timezone: %w", err)
	}
	s.loc = loc
	s.byID = make(map[string]Show, len(s.Shows))
	for _, show := range s.Shows {
		if _, dup := s.byID[show.ID]; dup {
			return fmt.Errorf("schedule: duplicate show id %q", show.ID)
		}
		if _, ok := weekdays[show.Day]; !ok {
			return fmt.Errorf("schedule: show %q has unknown day %q", show.ID, show.Day)
		}
		if _, ok := s.Platforms[show.Platform]; !ok {
			return fmt.Errorf("schedule: show %q has unknown platform %q", show.ID, show.Platform)
		}
		for kind, clock := range show.Times {
			if !kind.Valid() {
				return fmt.Errorf("schedule: show %q has unknown kind %q", show.ID, kind)
			}
			if _, err := time.Parse("15:04", clock); err != nil {
				return fmt.Errorf("schedule: show %q has bad time %q", show.ID, clock)
			}
		}
		s.byID[show.ID] = show
	}
	return nil
}

func (s *Schedule) Location() *time.Location {
	return s.loc
}

func (s *Schedule) Show(id string) (Show, bool) {
	show, ok := s.byID[id]
	return show, ok
}

func (s *Schedule) Platform(id string) Platform {
	return s.Platforms[id]
}

func (s *Schedule) HasEvent(showID string, kind Kind) bool {
	show, ok := s.byID[showID]
	if !ok {
		return false
	}
	_, ok = show.Times[kind]
	return ok
}

func (s *Schedule) OccurrencesAround(show Show, kind Kind, now time.Time) []time.Time {
	clock, ok := show.Times[kind]
	if !ok {
		return nil
	}
	t, _ := time.Parse("15:04", clock)
	local := now.In(s.loc)
	var out []time.Time
	for offset := -1; offset <= 1; offset++ {
		day := local.AddDate(0, 0, offset)
		if day.Weekday() != weekdays[show.Day] {
			continue
		}
		out = append(out, time.Date(day.Year(), day.Month(), day.Day(), t.Hour(), t.Minute(), 0, 0, s.loc))
	}
	return out
}
