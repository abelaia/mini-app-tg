import assert from 'node:assert/strict'
import test from 'node:test'
import {
    broadcastDuration,
    broadcastTiming,
} from '../../frontend/src/modules/schedule/lib/broadcastTiming.js'
import { validateSchedule } from '../src/validation.mjs'
import seed from '../../backend/data/schedule.json' with { type: 'json' }

test('premiere remains live after one hour and finishes at midnight by default', () => {
    assert.equal(broadcastTiming('21:00', 20 * 60 + 59).state, 'soon')
    assert.equal(broadcastTiming('21:00', 21 * 60).state, 'live')
    assert.equal(broadcastTiming('21:00', 22 * 60 + 30).state, 'live')
    assert.equal(broadcastTiming('21:00', 23 * 60 + 59).state, 'live')
    assert.equal(broadcastTiming('21:00', 24 * 60).state, 'done')
})

test('explicit end time overrides duration and supports the next day', () => {
    assert.equal(broadcastTiming('21:00', 22 * 60 + 59, '23:00').state, 'live')
    assert.equal(broadcastTiming('21:00', 23 * 60, '23:00').state, 'done')
    assert.equal(broadcastTiming('21:00', 24 * 60 + 30, '01:00').state, 'live')
    assert.equal(broadcastTiming('21:00', 25 * 60, '01:00').state, 'done')
    assert.equal(broadcastTiming('23:00', 23 * 60 + 30, '00:00').state, 'live')
})

test('repeat keeps its separate default duration', () => {
    assert.equal(broadcastDuration('repeat'), 60)
    assert.equal(broadcastDuration('premiere'), 180)
    assert.equal(
        broadcastTiming('20:00', 21 * 60, undefined, broadcastDuration('repeat')).state,
        'done',
    )
})

test('server accepts midnight endings and rejects malformed or zero-length broadcasts', () => {
    const schedule = structuredClone(seed)
    schedule.shows[0].endTimes = { premiere: '00:00' }
    assert.deepEqual(validateSchedule(schedule), {})
    schedule.shows[0].endTimes.premiere = '25:00'
    assert.ok(validateSchedule(schedule)['shows.0.endTimes.premiere'])
    schedule.shows[0].endTimes.premiere = schedule.shows[0].times.premiere
    assert.ok(validateSchedule(schedule)['shows.0.endTimes.premiere'])
})
