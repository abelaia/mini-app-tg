import { toMinutes } from '../../../shared/lib/time.js'

export function broadcastTiming(clock, nowMinutes, endClock, durationMinutes = 180) {
    const start = toMinutes(clock)
    let end = endClock ? toMinutes(endClock) : start + durationMinutes
    if (endClock && end <= start) {
        end += 1440
    }
    return {
        state: nowMinutes < start ? 'soon' : nowMinutes < end ? 'live' : 'done',
        untilStart: Math.max(0, start - nowMinutes),
        end,
    }
}

export function broadcastDuration(kind) {
    return kind === 'repeat' ? 60 : 180
}
