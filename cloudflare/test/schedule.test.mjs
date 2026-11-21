import assert from 'node:assert/strict'
import test from 'node:test'
import { dueOccurrences } from '../src/schedule.mjs'

const schedule = {
    timezone: 'Europe/Moscow',
    shows: [{ id: 'test', day: 'sunday', times: { premiere: '00:05' } }],
}

test('finds Sunday reminders on Saturday night in Moscow', () => {
    const now = Date.parse('2026-11-21T23:55:00+03:00')
    const [event] = dueOccurrences(schedule, now)
    assert.equal(event.kind, 'premiere')
    assert.equal(event.fireAt, now)
    assert.equal(event.start, Date.parse('2026-11-22T00:05:00+03:00'))
})

test('catches delayed cron, excludes early and stale occurrences', () => {
    const fireAt = Date.parse('2026-11-21T23:55:00+03:00')
    assert.equal(dueOccurrences(schedule, fireAt - 1).length, 0)
    assert.equal(dueOccurrences(schedule, fireAt + 60000).length, 1)
    assert.equal(dueOccurrences(schedule, fireAt + 15 * 60000 + 1).length, 0)
})

test('does not send disabled shows or silently reinterpret timezone', () => {
    const now = Date.parse('2026-11-21T23:55:00+03:00')
    assert.equal(
        dueOccurrences({ ...schedule, shows: [{ ...schedule.shows[0], enabled: false }] }, now)
            .length,
        0,
    )
    assert.throws(() => dueOccurrences({ ...schedule, timezone: 'UTC' }, now))
})
