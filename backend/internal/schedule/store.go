package schedule

import (
    "context"
    "database/sql"
    "encoding/json"
    "fmt"
    "sync"
    "time"
)

const (
    stateSchedule = "schedule"
    statePromo    = "promo"
)

type Store struct {
    mu    sync.RWMutex
    db    *sql.DB
    sched *Schedule
    promo Promo
}

func OpenStore(ctx context.Context, db *sql.DB, seedPath string) (*Store, error) {
    st := &Store{db: db, promo: DefaultPromo()}
    raw, err := st.loadState(ctx, stateSchedule)
    if err != nil {
        return nil, err
    }
    if raw == nil {
        seed, err := Load(seedPath)
        if err != nil {
            return nil, err
        }
        if err := st.saveState(ctx, stateSchedule, seed); err != nil {
            return nil, err
        }
        st.sched = seed
    } else {
        sched, err := Parse(raw)
        if err != nil {
            return nil, err
        }
        st.sched = sched
    }

    promoRaw, err := st.loadState(ctx, statePromo)
    if err != nil {
        return nil, err
    }
    if promoRaw == nil {
        if err := st.saveState(ctx, statePromo, st.promo); err != nil {
            return nil, err
        }
    } else if err := json.Unmarshal(promoRaw, &st.promo); err != nil {
        return nil, fmt.Errorf("schedule: promo: %w", err)
    }
    return st, nil
}

func Parse(raw []byte) (*Schedule, error) {
    var s Schedule
    if err := json.Unmarshal(raw, &s); err != nil {
        return nil, fmt.Errorf("schedule: parse: %w", err)
    }
    if err := s.init(); err != nil {
        return nil, err
    }
    return &s, nil
}

func (st *Store) loadState(ctx context.Context, key string) ([]byte, error) {
    var raw []byte
    err := st.db.QueryRowContext(ctx, `SELECT value FROM app_state WHERE key = $1`, key).Scan(&raw)
    if err == sql.ErrNoRows {
        return nil, nil
    }
    if err != nil {
        return nil, fmt.Errorf("schedule: load %s: %w", key, err)
    }
    return raw, nil
}

func (st *Store) saveState(ctx context.Context, key string, value any) error {
    raw, err := json.Marshal(value)
    if err != nil {
        return err
    }
    _, err = st.db.ExecContext(ctx, `
        INSERT INTO app_state (key, value, updated_at) VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
    `, key, raw, time.Now().Unix())
    if err != nil {
        return fmt.Errorf("schedule: save %s: %w", key, err)
    }
    return nil
}

func (st *Store) Snapshot() Schedule {
    st.mu.RLock()
    defer st.mu.RUnlock()
    return cloneSchedule(st.sched)
}

func (st *Store) PublicShows() []Show {
    st.mu.RLock()
    defer st.mu.RUnlock()
    out := make([]Show, 0, len(st.sched.Shows))
    for _, show := range st.sched.Shows {
        if show.IsEnabled() {
            out = append(out, show)
        }
    }
    return out
}

func (st *Store) Platforms() map[string]Platform {
    st.mu.RLock()
    defer st.mu.RUnlock()
    out := make(map[string]Platform, len(st.sched.Platforms))
    for id, platform := range st.sched.Platforms {
        out[id] = platform
    }
    return out
}

func (st *Store) Timezone() string {
    st.mu.RLock()
    defer st.mu.RUnlock()
    return st.sched.Timezone
}

func (st *Store) Promo() Promo {
    st.mu.RLock()
    defer st.mu.RUnlock()
    return st.promo
}

func (st *Store) Show(id string) (Show, bool) {
    st.mu.RLock()
    defer st.mu.RUnlock()
    show, ok := st.sched.byID[id]
    if !ok || !show.IsEnabled() {
        return Show{}, false
    }
    return show, true
}

func (st *Store) Platform(id string) Platform {
    st.mu.RLock()
    defer st.mu.RUnlock()
    return st.sched.Platforms[id]
}

func (st *Store) HasEvent(showID string, kind Kind) bool {
    st.mu.RLock()
    defer st.mu.RUnlock()
    return st.sched.HasEvent(showID, kind) && st.sched.byID[showID].IsEnabled()
}

func (st *Store) OccurrencesAround(show Show, kind Kind, now time.Time) []time.Time {
    st.mu.RLock()
    defer st.mu.RUnlock()
    return st.sched.OccurrencesAround(show, kind, now)
}

func (st *Store) AllShows() []Show {
    st.mu.RLock()
    defer st.mu.RUnlock()
    out := make([]Show, len(st.sched.Shows))
    copy(out, st.sched.Shows)
    return out
}

func (st *Store) Replace(ctx context.Context, next Schedule) error {
    if err := next.init(); err != nil {
        return err
    }
    if err := st.saveState(ctx, stateSchedule, next); err != nil {
        return err
    }
    st.mu.Lock()
    st.sched = &next
    st.mu.Unlock()
    return nil
}

func (st *Store) SetPromo(ctx context.Context, promo Promo) error {
    if err := st.saveState(ctx, statePromo, promo); err != nil {
        return err
    }
    st.mu.Lock()
    st.promo = promo
    st.mu.Unlock()
    return nil
}

func cloneSchedule(src *Schedule) Schedule {
    out := Schedule{
        Timezone:  src.Timezone,
        Platforms: make(map[string]Platform, len(src.Platforms)),
        Shows:     make([]Show, len(src.Shows)),
    }
    for id, platform := range src.Platforms {
        out.Platforms[id] = platform
    }
    copy(out.Shows, src.Shows)
    return out
}
