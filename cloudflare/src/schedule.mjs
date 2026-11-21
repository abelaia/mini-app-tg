const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Existing community schedule uses Moscow time (UTC+3, without daylight saving).
// Reject other zones rather than silently dispatching at the wrong local time.
export function dueOccurrences(schedule, now, leadMinutes = 10, graceMinutes = 15) {
    if (schedule.timezone !== 'Europe/Moscow') {
        throw new Error('Unsupported schedule timezone')
    }
    const lead = leadMinutes * 60000
    const grace = graceMinutes * 60000
    const local = new Date(now + 3 * 3600000)
    const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
    const occurrences = []
    for (const show of schedule.shows) {
        if (show.enabled === false) {
            continue
        }
        for (const offset of [-1, 0, 1]) {
            const day = new Date(midnight + offset * 86400000)
            if (weekdays[day.getUTCDay()] !== show.day) {
                continue
            }
            for (const kind of ['repeat', 'premiere']) {
                const clock = show.times?.[kind]
                if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock ?? '')) {
                    continue
                }
                const [hours, minutes] = clock.split(':').map(Number)
                const start = day.getTime() + (hours * 60 + minutes) * 60000 - 3 * 3600000
                const fireAt = start - lead
                if (now >= fireAt && now - fireAt <= grace) {
                    occurrences.push({ show, kind, start, fireAt })
                }
            }
        }
    }
    return occurrences
}
