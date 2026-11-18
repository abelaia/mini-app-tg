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

export function eventStatus(clock, nowMinutes, kind) {
  const diff = toMinutes(clock) - nowMinutes
  const state = diff > 0 ? 'soon' : diff > -LIVE_WINDOW ? 'live' : 'done'
  const template = content.status[kind]?.[state] ?? ''
  return { state, label: fill(template, { time: formatDuration(Math.abs(diff)) }) }
}
