import { createHmac } from 'node:crypto'
import assert from 'node:assert/strict'
import test from 'node:test'
import { authenticate, isAdmin } from '../src/telegram-auth.mjs'

const token = 'test-token'
const now = Date.UTC(2026, 10, 21, 12)

function signedRequest(overrides = {}) {
    const params = new URLSearchParams({
        auth_date: String(now / 1000),
        user: JSON.stringify({ id: 1042683920, first_name: 'Alina' }),
        ...overrides,
    })
    const data = [...params.keys()]
        .sort()
        .map((key) => `${key}=${params.get(key)}`)
        .join('\n')
    const secret = createHmac('sha256', 'WebAppData').update(token).digest()
    params.set('hash', createHmac('sha256', secret).update(data).digest('hex'))
    return new Request('https://example.com/api/session', {
        headers: { Authorization: `tma ${params}` },
    })
}

test('accepts Telegram HMAC and checks admin ID exactly', async () => {
    const user = await authenticate(signedRequest(), token, now)
    assert.equal(user.id, 1042683920)
    assert.equal(isAdmin(user, '6313177223,1042683920'), true)
    assert.equal(isAdmin(user, '110426839200'), false)
})

test('rejects expired, future and tampered credentials', async () => {
    assert.equal(await authenticate(signedRequest({ auth_date: '1' }), token, now), null)
    assert.equal(
        await authenticate(signedRequest({ auth_date: String(now / 1000 + 60) }), token, now),
        null,
    )
    assert.equal(await authenticate(signedRequest(), 'other-token', now), null)
})

test('rejects unsigned and duplicated parameters', async () => {
    assert.equal(await authenticate(new Request('https://example.com'), token, now), null)
    const request = signedRequest()
    request.headers.set('Authorization', `${request.headers.get('Authorization')}&auth_date=1`)
    assert.equal(await authenticate(request, token, now), null)
})
