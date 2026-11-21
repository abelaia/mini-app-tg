import assert from 'node:assert/strict'
import test from 'node:test'
import { database } from './api.test.mjs'
import { deliverBatch, enqueueReminders } from '../src/notifications.mjs'

const now = Date.parse('2026-11-22T20:50:00+03:00')
const schedule = {
    timezone: 'Europe/Moscow',
    platforms: { vk: { title: 'VK', url: 'https://vk.com' } },
    shows: [
        {
            id: 'test',
            title: 'Тест',
            translator: 'Сабина',
            day: 'sunday',
            platform: 'vk',
            times: { premiere: '21:00' },
        },
    ],
}

function setup() {
    const DB = database()
    DB.sqlite.prepare('INSERT INTO users (id, created_at, updated_at) VALUES (1, 1, 1)').run()
    DB.sqlite
        .prepare(
            "INSERT INTO reminders (user_id, show_id, kind, created_at) VALUES (1, 'test', 'premiere', 1)",
        )
        .run()
    DB.sqlite
        .prepare("INSERT INTO app_state (key, value, updated_at) VALUES ('schedule', ?, 1)")
        .run(JSON.stringify(schedule))
    const jobs = []
    return {
        DB,
        jobs,
        env: {
            DB,
            BOT_TOKEN: 'fake-token',
            REMINDERS_ENABLED: 'true',
            DELIVERIES: {
                async sendBatch(items) {
                    jobs.push(...items)
                },
            },
        },
    }
}

function batch(body) {
    const state = { acknowledged: 0, retried: 0 }
    return {
        state,
        messages: [
            {
                body,
                ack() {
                    state.acknowledged++
                },
                retry() {
                    state.retried++
                },
            },
        ],
        retryAll() {
            state.retried++
        },
    }
}

test('cron persists work once and redelivered jobs do not resend completed reminders', async () => {
    const { DB, jobs, env } = setup()
    let sent = 0
    const options = {
        clock: () => now,
        pause: async () => {},
        send: async () => {
            sent++
            return { ok: true, code: 200 }
        },
    }
    try {
        await enqueueReminders(env, now)
        await enqueueReminders(env, now + 60000)
        assert.equal(jobs.length, 1)
        assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM deliveries').get().n, 1)
        await deliverBatch(batch(jobs[0].body), env, options)
        await deliverBatch(batch(jobs[0].body), env, options)
        assert.equal(sent, 1)
        assert.equal(
            DB.sqlite.prepare('SELECT last_sent_at FROM reminders').get().last_sent_at,
            now / 1000,
        )
    } finally {
        DB.sqlite.close()
    }
})

test('Telegram failure remains pending and is retried rather than marked sent', async () => {
    const { DB, jobs, env } = setup()
    try {
        await enqueueReminders(env, now)
        const work = batch(jobs[0].body)
        await deliverBatch(work, env, {
            clock: () => now,
            pause: async () => {},
            send: async () => ({ ok: false, code: 503 }),
        })
        assert.equal(work.state.retried, 1)
        assert.equal(DB.sqlite.prepare('SELECT status FROM deliveries').get().status, 'pending')
        assert.equal(DB.sqlite.prepare('SELECT last_sent_at FROM reminders').get().last_sent_at, 0)
    } finally {
        DB.sqlite.close()
    }
})

test('disabled staging cannot send or queue real messages', async () => {
    const { DB, jobs, env } = setup()
    try {
        await enqueueReminders({ ...env, REMINDERS_ENABLED: 'false' }, now)
        assert.equal(jobs.length, 0)
    } finally {
        DB.sqlite.close()
    }
})
