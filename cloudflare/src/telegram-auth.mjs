const encoder = new TextEncoder()

async function hmac(key, value) {
    const imported = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
    )
    return new Uint8Array(await crypto.subtle.sign('HMAC', imported, encoder.encode(value)))
}

export async function authenticate(request, botToken, now = Date.now()) {
    const authorization = request.headers.get('Authorization') ?? ''
    if (!botToken || !authorization.startsWith('tma ')) {
        return null
    }
    const params = new URLSearchParams(authorization.slice(4))
    const keys = [...params.keys()]
    if (new Set(keys).size !== keys.length) {
        return null
    }
    const hash = params.get('hash') ?? ''
    if (!/^[a-f0-9]{64}$/.test(hash)) {
        return null
    }
    const authDate = Number(params.get('auth_date'))
    if (
        !Number.isSafeInteger(authDate) ||
        authDate <= 0 ||
        authDate > now / 1000 + 30 ||
        now / 1000 - authDate > 86400
    ) {
        return null
    }
    const data = keys
        .filter((key) => key !== 'hash')
        .sort()
        .map((key) => `${key}=${params.get(key)}`)
        .join('\n')
    const secret = await hmac(encoder.encode('WebAppData'), botToken)
    const signingKey = await crypto.subtle.importKey(
        'raw',
        secret,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify'],
    )
    const signature = Uint8Array.from(hash.match(/../g), (byte) => parseInt(byte, 16))
    if (!(await crypto.subtle.verify('HMAC', signingKey, signature, encoder.encode(data)))) {
        return null
    }
    try {
        const user = JSON.parse(params.get('user'))
        return Number.isSafeInteger(user?.id) && user.id > 0 ? user : null
    } catch {
        return null
    }
}

export function isAdmin(user, adminIDs = '') {
    return adminIDs
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .includes(String(user.id))
}

export async function webhookSecret(token) {
    const digest = new Uint8Array(
        await crypto.subtle.digest('SHA-256', encoder.encode(`webhook:${token}`)),
    )
    return [...digest.slice(0, 16)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyWebhookSecret(token, provided) {
    if (!token || !provided || provided.length > 256) {
        return false
    }
    const expected = await webhookSecret(token)
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(expected),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify'],
    )
    return crypto.subtle.verify(
        'HMAC',
        key,
        await hmac(encoder.encode(provided), 'verify'),
        encoder.encode('verify'),
    )
}
