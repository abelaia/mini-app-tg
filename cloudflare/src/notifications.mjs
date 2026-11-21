import seed from '../../backend/data/schedule.json' with { type: 'json' }
import { dueOccurrences } from './schedule.mjs'

async function loadSchedule(db) {
    const row = await db.prepare("SELECT value FROM app_state WHERE key = 'schedule'").first()
    return row ? JSON.parse(row.value) : seed
}

export async function enqueueReminders(env, now = Date.now()) {
    if (env.REMINDERS_ENABLED !== 'true' || !env.BOT_TOKEN) {
        return
    }
    const seconds = Math.floor(now / 1000)
    const schedule = await loadSchedule(env.DB)
    for (const event of dueOccurrences(schedule, now)) {
        const fireAt = Math.floor(event.fireAt / 1000)
        await env.DB.prepare(
            `INSERT OR IGNORE INTO deliveries
                    (reminder_id, fire_at, available_at, expires_at)
                SELECT r.id, ?, ?, ? FROM reminders r
                JOIN users u ON u.id = r.user_id
                WHERE r.show_id = ? AND r.kind = ? AND r.created_at < ?
                    AND r.last_sent_at < ? AND u.is_blocked = 0`,
        )
            .bind(fireAt, seconds, fireAt + 900, event.show.id, event.kind, fireAt, fireAt)
            .run()
    }
    // Re-enqueue abandoned work after a queue outage; claiming below prevents
    // two consumers from sending the same delivery concurrently.
    const rows = await env.DB.prepare(
        `SELECT reminder_id, fire_at FROM deliveries
            WHERE status IN ('pending', 'sending') AND available_at <= ?
                AND lease_until <= ? AND queued_at < ? AND expires_at >= ?
            ORDER BY fire_at, reminder_id LIMIT 1000`,
    )
        .bind(seconds, seconds, seconds - 120, seconds)
        .all()
    for (let index = 0; index < rows.results.length; index += 50) {
        const items = rows.results.slice(index, index + 50)
        await env.DELIVERIES.sendBatch(items.map((body) => ({ body })))
        await env.DB.batch(
            items.map((item) =>
                env.DB.prepare(
                    'UPDATE deliveries SET queued_at = ? WHERE reminder_id = ? AND fire_at = ?',
                ).bind(seconds, item.reminder_id, item.fire_at),
            ),
        )
    }
    // Bound retention and indexed queue scans. Subscriptions remain intact.
    await env.DB.prepare('DELETE FROM deliveries WHERE expires_at < ?')
        .bind(seconds - 86400)
        .run()
}

function escapeHTML(value) {
    return String(value).replace(
        /[&<>"']/g,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character],
    )
}

export async function telegramSend(env, payload, fetcher = fetch) {
    try {
        const response = await fetcher(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000),
        })
        const result = await response.json()
        return {
            ok: result.ok === true,
            code: result.error_code ?? response.status,
            retryAfter: Number(result.parameters?.retry_after) || 0,
        }
    } catch {
        // Do not log fetch errors: their URLs can contain the bot token.
        return { ok: false, code: 503, retryAfter: 60 }
    }
}

export async function deliverBatch(batch, env, options = {}) {
    const clock = options.clock ?? Date.now
    const send = options.send ?? telegramSend
    const pause =
        options.pause ??
        ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)))
    if (env.REMINDERS_ENABLED !== 'true' || !env.BOT_TOKEN) {
        batch.retryAll({ delaySeconds: 60 })
        return
    }
    const schedule = await loadSchedule(env.DB)
    const active = new Set(
        dueOccurrences(schedule, clock()).map(
            (event) => `${event.show.id}:${event.kind}:${Math.floor(event.fireAt / 1000)}`,
        ),
    )
    for (const message of batch.messages) {
        const { reminder_id: reminderID, fire_at: fireAt } = message.body ?? {}
        if (!Number.isSafeInteger(reminderID) || !Number.isSafeInteger(fireAt)) {
            message.ack()
            continue
        }
        const now = Math.floor(clock() / 1000)
        const claimed = await env.DB.prepare(
            `UPDATE deliveries SET status = 'sending', lease_until = ?, attempts = attempts + 1
                WHERE reminder_id = ? AND fire_at = ? AND status IN ('pending', 'sending')
                    AND lease_until <= ? AND available_at <= ? AND expires_at >= ?
                RETURNING reminder_id`,
        )
            .bind(now + 60, reminderID, fireAt, now, now, now)
            .first()
        if (!claimed) {
            message.ack()
            continue
        }
        const reminder = await env.DB.prepare(
            `SELECT r.user_id, r.show_id, r.kind FROM reminders r
                JOIN users u ON u.id = r.user_id WHERE r.id = ? AND u.is_blocked = 0`,
        )
            .bind(reminderID)
            .first()
        const show = schedule.shows.find(
            (item) => item.id === reminder?.show_id && item.enabled !== false,
        )
        if (
            !show ||
            !show.times?.[reminder.kind] ||
            !active.has(`${show.id}:${reminder.kind}:${fireAt}`)
        ) {
            await env.DB.prepare(
                "UPDATE deliveries SET status = 'failed' WHERE reminder_id = ? AND fire_at = ?",
            )
                .bind(reminderID, fireAt)
                .run()
            message.ack()
            continue
        }
        const platform = schedule.platforms[show.platform]
        const title = reminder.kind === 'premiere' ? 'Новая серия' : 'Повтор прошлой серии'
        const rows = []
        if (platform?.url) {
            rows.push([{ text: `Смотреть · ${platform.title}`, url: platform.url }])
        }
        if (env.WEBAPP_URL) {
            rows.push([{ text: 'Открыть расписание', web_app: { url: env.WEBAPP_URL } }])
        }
        const result = await send(env, {
            chat_id: reminder.user_id,
            text: `🌹 <b>${escapeHTML(show.title)}</b>\n${title} в ${escapeHTML(show.times[reminder.kind])} по Москве\n\nПеревод: ${escapeHTML(show.translator)} · ${escapeHTML(platform?.title ?? '')}`,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: rows },
        })
        const terminal =
            result.ok || (result.code >= 400 && result.code < 500 && result.code !== 429)
        const statements = [
            env.DB.prepare(
                `UPDATE deliveries SET status = ?, available_at = ?, lease_until = 0
                WHERE reminder_id = ? AND fire_at = ?`,
            ).bind(
                result.ok ? 'sent' : terminal ? 'failed' : 'pending',
                now + Math.max(result.retryAfter || 0, 60),
                reminderID,
                fireAt,
            ),
        ]
        if (result.ok) {
            statements.push(
                env.DB.prepare(
                    'UPDATE reminders SET last_sent_at = MAX(last_sent_at, ?) WHERE id = ?',
                ).bind(fireAt, reminderID),
            )
        } else if (result.code === 403) {
            statements.push(
                env.DB.prepare('UPDATE users SET is_blocked = 1 WHERE id = ?').bind(
                    reminder.user_id,
                ),
            )
        }
        await env.DB.batch(statements)
        if (terminal) {
            message.ack()
        } else {
            message.retry({ delaySeconds: Math.max(result.retryAfter || 0, 60) })
        }
        // The queue consumer is configured with concurrency 1. Keep below
        // Telegram's free broadcast rate even when network requests are fast.
        await pause(50)
        if (result.code === 429) {
            batch.retryAll({ delaySeconds: Math.max(result.retryAfter || 0, 60) })
            return
        }
    }
}
