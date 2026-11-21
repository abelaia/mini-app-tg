import app from '@/shared/content/app.json'
import { fill } from '@/shared/lib/text'
import { splitDuration } from '@/shared/lib/time'
import content from '../content.json'
import { broadcastTiming } from './broadcastTiming'

function formatDuration(total) {
    const { hours, minutes } = splitDuration(total)
    const parts = []
    if (hours) parts.push(`${hours} ${app.duration.hours}`)
    if (minutes || !hours) parts.push(`${minutes} ${app.duration.minutes}`)
    return parts.join(' ')
}

export function eventStatus(clock, nowMinutes, endClock, durationMinutes) {
    const timing = broadcastTiming(clock, nowMinutes, endClock, durationMinutes)
    if (timing.state === 'soon') {
        return {
            state: 'soon',
            label: fill(content.status.soon, { time: formatDuration(timing.untilStart) }),
        }
    }
    return { state: timing.state, label: content.status[timing.state] }
}
