export const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export const DEFAULT_TIMEZONE = 'Europe/Moscow'

export function zonedNow(timeZone = DEFAULT_TIMEZONE, date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  )
  const hours = Number(parts.hour)
  const minutes = Number(parts.minute)
  return {
    day: parts.weekday.toLowerCase(),
    minutes: hours * 60 + minutes,
    clock: `${parts.hour}:${parts.minute}`,
  }
}

export function zonedDateLabel(timeZone = DEFAULT_TIMEZONE, date = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', { timeZone, day: 'numeric', month: 'long' }).format(date)
}

export const toMinutes = (clock) => {
  const [hours, minutes] = clock.split(':').map(Number)
  return hours * 60 + minutes
}

export const dayOffset = (from, to) => (WEEK.indexOf(to) - WEEK.indexOf(from) + 7) % 7

export const shiftDay = (day, offset) => WEEK[(WEEK.indexOf(day) + offset) % 7]

export function splitDuration(totalMinutes) {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}
