import { webhookSecret } from './telegram-auth.mjs'

// Administrative jobs are submitted through the authenticated Cloudflare
// Queues API. There is intentionally no public HTTP setup endpoint.
export async function setupTelegram(job, env, fetcher = fetch) {
    if (!/^[a-f0-9-]{36}$/.test(job.id ?? '') || !['inspect', 'connect'].includes(job.action)) {
        return
    }
    const key = `telegram-setup:${job.id}`
    const previous = await env.DB.prepare('SELECT value FROM app_state WHERE key = ?')
        .bind(key)
        .first()
    if (previous && JSON.parse(previous.value).status === 'complete') {
        return
    }
    const result = { status: 'error', action: job.action }
    async function call(method, body = {}) {
        const response = await fetcher(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        })
        const envelope = await response.json()
        if (!envelope.ok) {
            result.failedMethod = method
            result.errorCode = envelope.error_code ?? response.status
            throw new Error('Telegram rejected setup')
        }
        return envelope.result
    }
    try {
        if (!env.BOT_TOKEN) {
            throw new Error('Missing bot token')
        }
        const bot = await call('getMe')
        result.username = bot.username
        if (job.action === 'connect') {
            const url = new URL(env.WEBAPP_URL)
            if (url.protocol !== 'https:') {
                throw new Error('HTTPS is required')
            }
            await call('setWebhook', {
                url: `${url.origin}/api/telegram/webhook`,
                secret_token: await webhookSecret(env.BOT_TOKEN),
                allowed_updates: ['message'],
            })
            result.webhookUpdated = true
            await call('setChatMenuButton', {
                menu_button: {
                    type: 'web_app',
                    text: 'Открыть расписание',
                    web_app: { url: env.WEBAPP_URL },
                },
            })
            result.menuUpdated = true
        }
        const webhook = await call('getWebhookInfo')
        result.webhookURL = webhook.url
        result.pendingUpdates = webhook.pending_update_count
        result.lastErrorDate = webhook.last_error_date ?? null
        result.status = 'complete'
    } catch {
        // A fetch error may include the token-bearing URL. Store only safe
        // status fields, never error objects or request headers.
        result.status = 'error'
    }
    await env.DB.prepare(
        `INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?)
        ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
        .bind(key, JSON.stringify(result), Math.floor(Date.now() / 1000))
        .run()
}
