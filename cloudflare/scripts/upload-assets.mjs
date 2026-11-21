import { readFile, writeFile, readdir, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const root = path.resolve('.cloudflare/output/v1/workers/default/assets')
const sessionPath = path.resolve('.cloudflare/upload-session.local.json')
const completionPath = path.resolve('.cloudflare/assets-completion.local.json')
const session = JSON.parse(await readFile(sessionPath, 'utf8'))
const files = new Map()

async function scan(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name)
        if (entry.isDirectory()) {
            await scan(filename)
        } else {
            const data = await readFile(filename)
            files.set(createHash('sha256').update(data).digest('hex').slice(0, 32), {
                filename,
                data,
            })
        }
    }
}

await scan(root)
let completion = session.jwt
try {
    for (const bucket of session.buckets ?? []) {
        const form = new FormData()
        for (const hash of bucket) {
            const file = files.get(hash)
            if (!file) {
                throw new Error('The build changed after the upload session was created')
            }
            const type =
                {
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.svg': 'image/svg+xml',
                    '.webp': 'image/webp',
                    '.html': 'text/html',
                    '.css': 'text/css',
                    '.js': 'application/javascript',
                    '.json': 'application/json',
                    '.woff2': 'font/woff2',
                    '.woff': 'font/woff',
                }[path.extname(file.filename)] ?? 'application/octet-stream'
            form.append(hash, new Blob([file.data.toString('base64')], { type }), hash)
        }
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${session.accountId}/workers/assets/upload?base64=true`,
            { method: 'POST', headers: { Authorization: `Bearer ${session.jwt}` }, body: form },
        )
        const result = await response.json()
        if (!response.ok || !result.success) {
            throw new Error(`Cloudflare rejected assets: ${response.status}`)
        }
        if (result.result?.jwt) {
            completion = result.result.jwt
        }
    }
    await writeFile(completionPath, JSON.stringify({ completion }))
    console.log('Assets uploaded')
} finally {
    await rm(sessionPath, { force: true })
}
