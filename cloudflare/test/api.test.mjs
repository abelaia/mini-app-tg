import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import worker from '../src/index.mjs'
import { setupTelegram } from '../src/telegram-setup.mjs'

export function database() {
    const sqlite = new DatabaseSync(':memory:')
    sqlite.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'))
    sqlite.exec(
        readFileSync(new URL('../migrations/0002_delivery_queue.sql', import.meta.url), 'utf8'),
    )
    return {
        sqlite,
        async batch(statements) {
            sqlite.exec('BEGIN')
            try {
                const results = []
                for (const statement of statements) {
                    results.push(await statement.run())
                }
                sqlite.exec('COMMIT')
                return results
            } catch (error) {
                sqlite.exec('ROLLBACK')
                throw error
            }
        },
        prepare(sql) {
            const statement = sqlite.prepare(sql)
            let parameters = []
            return {
                bind(...values) {
                    parameters = values.map((value) =>
                        value instanceof ArrayBuffer ? new Uint8Array(value) : value,
                    )
                    return this
                },
                async first() {
                    return statement.get(...parameters) ?? null
                },
                async all() {
                    return { results: statement.all(...parameters) }
                },
                async run() {
                    const result = statement.run(...parameters)
                    return { meta: { changes: Number(result.changes) } }
                },
            }
        },
    }
}

const token = 'test-bot-token'

test('Telegram setup connects webhook and menu without exposing the bot token', async () => {
    const DB = database()
    const calls = []
    const env = { DB, BOT_TOKEN: token, WEBAPP_URL: 'https://example.com' }
    const id = '9fc2f7ac-7a94-45bc-b9c8-f80a1b6a338d'
    try {
        await setupTelegram({ id, action: 'connect' }, env, async (url, options) => {
            const method = url.split('/').at(-1)
            calls.push({ method, body: JSON.parse(options.body) })
            return Response.json({
                ok: true,
                result:
                    method === 'getMe'
                        ? { username: 'test_bot' }
                        : method === 'getWebhookInfo'
                          ? {
                                url: 'https://example.com/api/telegram/webhook',
                                pending_update_count: 0,
                            }
                          : true,
            })
        })
        assert.deepEqual(
            calls.map((call) => call.method),
            ['getMe', 'setWebhook', 'setChatMenuButton', 'getWebhookInfo'],
        )
        assert.equal(calls[1].body.url, 'https://example.com/api/telegram/webhook')
        assert.match(calls[1].body.secret_token, /^[a-f0-9]{32}$/)
        assert.equal(calls[2].body.menu_button.web_app.url, 'https://example.com')
        const saved = DB.sqlite
            .prepare('SELECT value FROM app_state WHERE key = ?')
            .get(`telegram-setup:${id}`).value
        assert.equal(JSON.parse(saved).status, 'complete')
        assert.equal(saved.includes(token), false)
        await setupTelegram({ id, action: 'connect' }, env, async () => {
            throw new Error('Must not run twice')
        })
    } finally {
        DB.sqlite.close()
    }
})

test('Telegram setup stores a safe failure instead of token-bearing network errors', async () => {
    const DB = database()
    try {
        const id = '6fd36b77-74c3-40ea-bfe6-e427a0570a85'
        await setupTelegram({ id, action: 'inspect' }, { DB, BOT_TOKEN: token }, async () => {
            throw new Error(`URL contains ${token}`)
        })
        const saved = DB.sqlite
            .prepare('SELECT value FROM app_state WHERE key = ?')
            .get(`telegram-setup:${id}`).value
        assert.equal(JSON.parse(saved).status, 'error')
        assert.equal(saved.includes(token), false)
    } finally {
        DB.sqlite.close()
    }
})

function request(path, method = 'GET', body, userID = 1042683920) {
    const params = new URLSearchParams({
        auth_date: String(Math.floor(Date.now() / 1000)),
        user: JSON.stringify({ id: userID, first_name: 'Test' }),
    })
    const data = [...params.keys()]
        .sort()
        .map((key) => `${key}=${params.get(key)}`)
        .join('\n')
    const secret = createHmac('sha256', 'WebAppData').update(token).digest()
    params.set('hash', createHmac('sha256', secret).update(data).digest('hex'))
    return new Request(`https://example.com${path}`, {
        method,
        headers: { Authorization: `tma ${params}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    })
}

test('public schedule, Telegram session and per-user subscriptions remain compatible', async () => {
    const DB = database()
    const env = { DB, BOT_TOKEN: token, ADMIN_IDS: '1042683920' }
    try {
        const publicResponse = await worker.fetch(
            new Request('https://example.com/api/schedule'),
            env,
        )
        assert.equal(publicResponse.status, 200)
        const schedule = await publicResponse.json()
        assert.equal(schedule.remindBeforeMinutes, 10)
        assert.ok(schedule.shows.some((show) => show.title === 'Еще 17'))
        const session = await worker.fetch(request('/api/session', 'POST'), env)
        assert.equal((await session.json()).isAdmin, true)
        const payload = { showId: schedule.shows[0].id, kind: 'premiere' }
        const created = await worker.fetch(request('/api/reminders', 'POST', payload), env)
        assert.equal(created.status, 201)
        const item = await created.json()
        const repeated = await worker.fetch(request('/api/reminders', 'POST', payload), env)
        assert.equal((await repeated.json()).id, item.id)
        const otherUser = await worker.fetch(
            request('/api/reminders', 'GET', undefined, 12345),
            env,
        )
        assert.deepEqual(await otherUser.json(), [])
        const forbiddenDelete = await worker.fetch(
            request(`/api/reminders/${item.id}`, 'DELETE', undefined, 12345),
            env,
        )
        assert.equal(forbiddenDelete.status, 404)
        const deleted = await worker.fetch(request(`/api/reminders/${item.id}`, 'DELETE'), env)
        assert.equal(deleted.status, 204)
    } finally {
        DB.sqlite.close()
    }
})

test('admin image upload preserves bytes and is publicly readable', async () => {
    const DB = database()
    const env = { DB, BOT_TOKEN: token, ADMIN_IDS: '1042683920' }
    const image = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4FYAAAAASUVORK5CYII=',
        'base64',
    )
    try {
        const authenticated = request('/api/admin/media', 'POST')
        const upload = await worker.fetch(
            new Request(authenticated.url, {
                method: 'POST',
                headers: authenticated.headers,
                body: image,
            }),
            env,
        )
        assert.equal(upload.status, 201)
        const saved = await upload.json()
        assert.equal(saved.width, 1)
        const download = await worker.fetch(new Request(`https://example.com${saved.url}`), env)
        assert.equal(download.status, 200)
        assert.equal(download.headers.get('Content-Type'), 'image/png')
        assert.deepEqual(Buffer.from(await download.arrayBuffer()), image)
    } finally {
        DB.sqlite.close()
    }
})

test('admin edits persist and invalid fields or unsigned requests are rejected', async () => {
    const DB = database()
    const env = { DB, BOT_TOKEN: token, ADMIN_IDS: '1042683920' }
    try {
        const unauthorized = await worker.fetch(
            new Request('https://example.com/api/admin/schedule'),
            env,
        )
        assert.equal(unauthorized.status, 401)
        const forbidden = await worker.fetch(
            request('/api/admin/promo', 'GET', undefined, 12345),
            env,
        )
        assert.equal(forbidden.status, 403)
        const promo = { eyebrow: 'Новости', text: 'Новый эфир', enabled: true }
        assert.equal(
            (await worker.fetch(request('/api/admin/promo', 'PUT', promo), env)).status,
            200,
        )
        const saved = await worker.fetch(request('/api/admin/promo'), env)
        assert.deepEqual(await saved.json(), promo)
        const invalid = await worker.fetch(
            request('/api/admin/schedule', 'PUT', { shows: [] }),
            env,
        )
        assert.equal(invalid.status, 422)
        assert.ok((await invalid.json()).fields.shows)
        const malformed = request('/api/admin/promo', 'PUT', {})
        const badJSON = new Request(malformed.url, {
            method: 'PUT',
            headers: malformed.headers,
            body: '{',
        })
        assert.equal((await worker.fetch(badJSON, env)).status, 400)
    } finally {
        DB.sqlite.close()
    }
})
