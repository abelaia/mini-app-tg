package admin

import (
    "encoding/json"
    "github.com/abelaia/mini-app-tg/backend/internal/httpx"
    "github.com/abelaia/mini-app-tg/backend/internal/schedule"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func validSchedule() schedule.Schedule {
    return schedule.Schedule{Timezone: "Europe/Moscow", Platforms: map[string]schedule.Platform{"vk": {Title: "ВКонтакте", URL: "https://vk.com"}}, Shows: []schedule.Show{{ID: "show", Title: "Сериал", Translator: "Сабина", Day: "monday", Platform: "vk", Icon: "rose", Times: map[schedule.Kind]string{schedule.KindRepeat: "20:00", schedule.KindPremiere: "21:00"}}}}
}
func TestValidationBoundaries(t *testing.T) {
    s := validSchedule()
    s.Shows[0].Title = strings.Repeat("Я", 120)
    if err := validateSchedule(s); err != nil {
        t.Fatal(err)
    }
    s.Shows[0].Title += "Я"
    s.Shows[0].Times[schedule.KindRepeat] = "24:00"
    s.Shows[0].Day = "funday"
    s.Shows[0].Platform = "unknown"
    err := validateSchedule(s)
    fields, ok := err.(fieldErrors)
    if !ok {
        t.Fatalf("want field errors: %v", err)
    }
    for _, key := range []string{"shows.0.title", "shows.0.times.repeat", "shows.0.day", "shows.0.platform"} {
        if fields[key] == "" {
            t.Errorf("missing %s", key)
        }
    }
}
func TestDuplicateIDsAndArtwork(t *testing.T) {
    s := validSchedule()
    s.Shows = append(s.Shows, s.Shows[0])
    s.Shows[0].Artwork = &schedule.Artwork{URL: "https://example.com/image.svg", Role: "banner", Fit: "stretch"}
    fields := validateSchedule(s).(fieldErrors)
    for _, key := range []string{"shows.0.id", "shows.1.id", "shows.0.artwork"} {
        if fields[key] == "" {
            t.Errorf("missing %s", key)
        }
    }
}
func TestInvalidScheduleReturnsFieldsWithoutStore(t *testing.T) {
    r := httpx.NewRouter(httpx.Auth(httpx.AuthOptions{DevUserID: 42}))
    NewHandler(nil, NewACL([]int64{42})).Register(r)
    req := httptest.NewRequest(http.MethodPut, "/api/admin/schedule", strings.NewReader(`{"timezone":"bad","platforms":{},"shows":[]}`))
    w := httptest.NewRecorder()
    r.Handler().ServeHTTP(w, req)
    if w.Code != 422 {
        t.Fatalf("status %d: %s", w.Code, w.Body)
    }
    var body struct{ Fields map[string]string }
    if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
        t.Fatal(err)
    }
    if body.Fields["shows"] == "" || body.Fields["timezone"] == "" {
        t.Fatal(w.Body.String())
    }
}
func TestMediaRejectsNonImageAndNonAdmin(t *testing.T) {
    for _, tc := range []struct {
        user int64
        want int
    }{{42, 422}, {7, 403}} {
        r := httpx.NewRouter(httpx.Auth(httpx.AuthOptions{DevUserID: tc.user}))
        NewHandler(nil, NewACL([]int64{42})).Register(r)
        w := httptest.NewRecorder()
        r.Handler().ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/api/admin/media", strings.NewReader(`<svg/>`)))
        if w.Code != tc.want {
            t.Fatalf("got %d want %d", w.Code, tc.want)
        }
    }
}
