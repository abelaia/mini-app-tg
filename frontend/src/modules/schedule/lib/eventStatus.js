import app from '@/shared/content/app.json'
import { fill } from '@/shared/lib/text'
import { splitDuration, toMinutes } from '@/shared/lib/time'
import content from '../content.json'

const LIVE_WINDOW = 60

function formatDuration(total) {
  const { hours, minutes } = splitDuration(total)
  const parts = []
  if (hours) parts.push(`${hours} ${app.duration.hours}`)
  if (minutes || !hours) parts.push(`${minutes} ${app.duration.minutes}`)
  return parts.join(' ')
}

export function eventStatus(clock, nowMinutes) {
  const diff = toMinutes(clock) - nowMinutes
  if (diff > 0) return { state: 'soon', label: fill(content.status.soon, { time: formatDuration(diff) }) }
  if (diff > -LIVE_WINDOW) return { state: 'live', label: content.status.live }
  return { state: 'done', label: content.status.done }
}
