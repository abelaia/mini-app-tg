import { clock, maxLength, oneOf, required, slug, text, validate } from '@/shared/lib/validation'
import { WEEK } from '@/shared/lib/time'

export const ICON_OPTIONS = ['city', 'mosque', 'layers', 'flame', 'wave', 'rose', 'sparkle', 'sun']
export const LIMITS = { id: 64, title: 120, translator: 80, eyebrow: 80, promo: 1000 }

function inRange(value, min, max, fallback) {
  const number = Number(value ?? fallback)
  return Number.isFinite(number) && number >= min && number <= max
}

function validArtwork(artwork) {
  return /^\/api\/media\/[a-f0-9]{64}$/.test(artwork.url ?? '')
    && artwork.role === 'icon'
    && artwork.fit === 'cover'
    && inRange(artwork.zoom, 1, 3, 1)
    && inRange(artwork.stretch, 0.75, 1.6, 1)
    && inRange(artwork.x, -80, 80, 0)
    && inRange(artwork.y, -80, 80, 0)
}

export function validateSchedule(schedule) {
  const errors = {}
  const add = (key, value, rules) => { const error = validate(value, rules); if (error) errors[key] = error }
  if (!schedule?.shows?.length) errors.shows = 'Добавьте хотя бы один сериал'
  const ids = new Map()
  for (const [index, show] of (schedule?.shows ?? []).entries()) {
    const path = `shows.${index}`
    add(`${path}.id`, show.id, [required, maxLength(LIMITS.id), slug])
    add(`${path}.title`, show.title, [required, maxLength(LIMITS.title)])
    add(`${path}.translator`, show.translator, [required, maxLength(LIMITS.translator)])
    if (show.artwork && !validArtwork(show.artwork)) errors[`${path}.artwork`] = 'Загрузите картинку и настройте кадр иконки'
    add(`${path}.day`, show.day, [oneOf(WEEK)])
    add(`${path}.platform`, show.platform, [oneOf(Object.keys(schedule.platforms ?? {}))])
    add(`${path}.icon`, show.icon, [oneOf(ICON_OPTIONS)])
    for (const kind of ['repeat', 'premiere']) add(`${path}.times.${kind}`, show.times?.[kind], [required, clock])
    const id = text(show.id)
    if (id && ids.has(id)) {
      errors[`${path}.id`] = 'Этот ID уже используется другим сериалом'
      errors[`shows.${ids.get(id)}.id`] = errors[`${path}.id`]
    }
    ids.set(id, index)
  }
  return errors
}

export function validatePromo(promo) {
  const errors = {}
  for (const [name, limit] of [['eyebrow', LIMITS.eyebrow], ['text', LIMITS.promo]]) {
    const error = validate(promo?.[name], [required, maxLength(limit)])
    if (error) errors[name] = error
  }
  return errors
}
