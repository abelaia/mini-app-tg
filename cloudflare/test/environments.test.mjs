import assert from 'node:assert/strict'
import test from 'node:test'
import configuration from '../cloudflare.config.ts'

test('preview cannot access the production database, bot token or delivery queue', () => {
    const preview = configuration({ mode: 'preview', isPreview: false }).worker
    const production = configuration({ mode: 'production', isPreview: false }).worker
    assert.notEqual(preview.name, production.name)
    assert.notEqual(preview.env.DB.id, production.env.DB.id)
    assert.equal(preview.env.REMINDERS_ENABLED.value, 'false')
    assert.equal(Object.hasOwn(preview.env, 'BOT_TOKEN'), false)
    assert.equal(Object.hasOwn(preview.env, 'DELIVERIES'), false)
    assert.deepEqual(preview.triggers, [])
    assert.equal(production.env.REMINDERS_ENABLED.value, 'true')
    assert.ok(production.triggers.some((trigger) => trigger.type === 'scheduled'))
})

test('unspecified modes use the isolated preview environment', () => {
    const config = configuration({ isPreview: false }).worker
    assert.equal(config.name, 'turkdizi-preview')
    assert.equal(config.env.REMINDERS_ENABLED.value, 'false')
})
