import seed from '../../backend/data/schedule.json' with { type: 'json' }
import { authenticate, isAdmin, verifyWebhookSecret } from './telegram-auth.mjs'
import { validatePromo, validateSchedule } from './validation.mjs'
import { getMedia, uploadMedia } from './media.mjs'
import { deliverBatch, enqueueReminders, telegramSend } from './notifications.mjs'
import { setupTelegram } from './telegram-setup.mjs'

const defaultPromo = { eyebrow: 'Анонс', text: '', enabled: false }

function json(value, status = 200, headers = {}) {
    return Response.json(value, { status, headers })
}

async function state(db, key, fallback) {
    const row = await db.prepare('SELECT value FROM app_state WHERE key = ?').bind(key).first()
    return row ? JSON.parse(row.value) : structuredClone(fallback)
}

async function saveState(db, key, value) {
    await db
        .prepare(
            `INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        )
        .bind(key, JSON.stringify(value), Math.floor(Date.now() / 1000))
        .run()
}

async function upsertUser(db, user) {
    const now = Math.floor(Date.now() / 1000)
    await db
        .prepare(
            `INSERT INTO users
                (id, first_name, last_name, username, language_code, allows_write, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                first_name = excluded.first_name, last_name = excluded.last_name,
                username = excluded.username, language_code = excluded.language_code,
                allows_write = MAX(users.allows_write, excluded.allows_write),
                updated_at = excluded.updated_at`,
        )
        .bind(
            user.id,
            user.first_name ?? '',
            user.last_name ?? '',
            user.username ?? '',
            user.language_code ?? '',
            user.allows_write_to_pm ? 1 : 0,
            now,
            now,
        )
        .run()
}

function reminder(row) {
    return {
        id: row.id,
        showId: row.show_id,
        kind: row.kind,
        createdAt: new Date(row.created_at * 1000).toISOString(),
    }
}

async function readJSON(request) {
    // Read a bounded stream: Content-Length is not trustworthy for chunked uploads.
    const reader = request.body?.getReader()
    if (!reader) {
        throw new Response('Missing body', { status: 400 })
    }
    const chunks = []
    let size = 0
    while (true) {
        const { value, done } = await reader.read()
        if (done) {
            break
        }
        size += value.byteLength
        if (size > 1024 * 1024) {
            await reader.cancel()
            throw json({ error: 'Слишком большой запрос' }, 413)
        }
        chunks.push(value)
    }
    const data = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
        data.set(chunk, offset)
        offset += chunk.byteLength
    }
    try {
        return JSON.parse(new TextDecoder().decode(data))
    } catch {
        throw json({ error: 'Некорректный JSON' }, 400)
    }
}

export async function handleRequest(request, env) {
    const path = new URL(request.url).pathname
    const method = request.method
    if (path === '/api/health' && method === 'GET') {
        return json({ status: 'ok' })
    }
    if (!path.startsWith('/api/')) {
        return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 })
    }
    if (path === '/api/telegram/webhook' && method === 'POST') {
        if (
            !(await verifyWebhookSecret(
                env.BOT_TOKEN,
                request.headers.get('X-Telegram-Bot-Api-Secret-Token'),
            ))
        ) {
            return json({ error: 'unauthorized' }, 401)
        }
        const update = await readJSON(request)
        const message = update?.message
        if (
            message?.chat?.type === 'private' &&
            message.chat.id === message.from?.id &&
            /^\/start(?:\s|$)/.test(message.text ?? '')
        ) {
            await upsertUser(env.DB, { ...message.from, allows_write_to_pm: true })
            await env.DB.prepare('UPDATE users SET is_blocked = 0 WHERE id = ?')
                .bind(message.from.id)
                .run()
            const welcome = {
                chat_id: message.chat.id,
                text: 'Привет! Это TürkDiziOnline <tg-emoji emoji-id="5427232022252764138">❤️‍🔥</tg-emoji>\n\nЗдесь расписание онлайн-переводов турецких сериалов <tg-emoji emoji-id="5384206341256521018">🇹🇷</tg-emoji>\nВключи напоминания, и я напишу перед началом эфира ☺️',
                parse_mode: 'HTML',
                ...(env.WEBAPP_URL
                    ? {
                          reply_markup: {
                              inline_keyboard: [
                                  [
                                      {
                                          text: 'Открыть расписание',
                                          web_app: { url: env.WEBAPP_URL },
                                      },
                                  ],
                              ],
                          },
                      }
                    : {}),
            }
            let result = await telegramSend(env, welcome)
            if (!result.ok && result.code === 400) {
                result = await telegramSend(env, {
                    ...welcome,
                    text: 'Привет! Это TürkDiziOnline ❤️‍🔥\n\nЗдесь расписание онлайн-переводов турецких сериалов 🇹🇷\nВключи напоминания, и я напишу перед началом эфира ☺️',
                    parse_mode: undefined,
                })
            }
            if (!result.ok && result.code !== 403) {
                return json({ error: 'telegram unavailable' }, 502)
            }
        }
        return json({ ok: true })
    }
    if (path === '/api/schedule' && method === 'GET') {
        const schedule = await state(env.DB, 'schedule', seed)
        return json(
            {
                ...schedule,
                shows: schedule.shows.filter((show) => show.enabled !== false),
                remindBeforeMinutes: 10,
                promo: await state(env.DB, 'promo', defaultPromo),
            },
            200,
            { 'Cache-Control': 'public, max-age=30' },
        )
    }
    const media = /^\/api\/media\/([a-f0-9]{64})$/.exec(path)
    if (media && method === 'GET') {
        return getMedia(media[1], env.DB)
    }
    const user = await authenticate(request, env.BOT_TOKEN)
    if (!user) {
        return json({ error: 'unauthorized' }, 401)
    }
    if (path === '/api/session' && method === 'POST') {
        await upsertUser(env.DB, user)
        return json({ user, isAdmin: isAdmin(user, env.ADMIN_IDS) })
    }
    if (path.startsWith('/api/admin/')) {
        if (!isAdmin(user, env.ADMIN_IDS)) {
            return json({ error: 'admin only' }, 403)
        }
        if (path === '/api/admin/media' && method === 'POST') {
            return uploadMedia(request, env.DB)
        }
        const key =
            path === '/api/admin/schedule'
                ? 'schedule'
                : path === '/api/admin/promo'
                  ? 'promo'
                  : null
        if (key && method === 'GET') {
            return json(await state(env.DB, key, key === 'schedule' ? seed : defaultPromo))
        }
        if (key && method === 'PUT') {
            const value = await readJSON(request)
            const fields = key === 'schedule' ? validateSchedule(value) : validatePromo(value)
            if (Object.keys(fields).length) {
                return json({ error: 'Проверьте отмеченные поля', fields }, 422)
            }
            await saveState(env.DB, key, value)
            return json(value)
        }
    }
    if (path === '/api/reminders' && method === 'GET') {
        const rows = await env.DB.prepare(
            'SELECT id, show_id, kind, created_at FROM reminders WHERE user_id = ? ORDER BY created_at, id',
        )
            .bind(user.id)
            .all()
        return json(rows.results.map(reminder))
    }
    if (path === '/api/reminders' && method === 'POST') {
        const input = await readJSON(request)
        const schedule = await state(env.DB, 'schedule', seed)
        const show = schedule.shows.find(
            (item) => item.id === input?.showId && item.enabled !== false,
        )
        if (!show || !['repeat', 'premiere'].includes(input?.kind) || !show.times[input.kind]) {
            return json({ error: 'unknown show or kind' }, 422)
        }
        await upsertUser(env.DB, user)
        await env.DB.prepare(
            `INSERT INTO reminders (user_id, show_id, kind, created_at) VALUES (?, ?, ?, ?)
                ON CONFLICT (user_id, show_id, kind) DO NOTHING`,
        )
            .bind(user.id, show.id, input.kind, Math.floor(Date.now() / 1000))
            .run()
        const row = await env.DB.prepare(
            'SELECT id, show_id, kind, created_at FROM reminders WHERE user_id = ? AND show_id = ? AND kind = ?',
        )
            .bind(user.id, show.id, input.kind)
            .first()
        return json(reminder(row), 201)
    }
    if (path === '/api/reminders' && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM reminders WHERE user_id = ?').bind(user.id).run()
        return new Response(null, { status: 204 })
    }
    const match = /^\/api\/reminders\/(\d+)$/.exec(path)
    if (match && method === 'DELETE') {
        const id = Number(match[1])
        if (!Number.isSafeInteger(id)) {
            return json({ error: 'invalid id' }, 400)
        }
        const result = await env.DB.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?')
            .bind(id, user.id)
            .run()
        return result.meta.changes
            ? new Response(null, { status: 204 })
            : json({ error: 'not found' }, 404)
    }
    return json({ error: 'not found' }, 404)
}

export default {
    async scheduled(controller, env) {
        await enqueueReminders(env, controller.scheduledTime)
    },
    async queue(batch, env) {
        const deliveries = []
        for (const message of batch.messages) {
            if (message.body?.type === 'telegram-setup') {
                await setupTelegram(message.body, env)
                message.ack()
            } else {
                deliveries.push(message)
            }
        }
        if (deliveries.length) {
            await deliverBatch(
                {
                    messages: deliveries,
                    retryAll: (options) => {
                        for (const message of deliveries) {
                            message.retry(options)
                        }
                    },
                },
                env,
            )
        }
    },
    async fetch(request, env) {
        try {
            return await handleRequest(request, env)
        } catch (error) {
            if (error instanceof Response) {
                return error
            }
            console.error(
                JSON.stringify({ event: 'request_failed', path: new URL(request.url).pathname }),
            )
            return json({ error: 'internal error' }, 500)
        }
    },
}
