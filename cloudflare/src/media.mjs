export function imageInfo(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    if (
        bytes.length >= 33 &&
        view.getUint32(0) === 0x89504e47 &&
        view.getUint32(4) === 0x0d0a1a0a &&
        view.getUint32(8) === 13 &&
        view.getUint32(12) === 0x49484452
    ) {
        return { width: view.getUint32(16), height: view.getUint32(20), type: 'image/png' }
    }
    if (bytes.length >= 4 && view.getUint16(0) === 0xffd8) {
        let offset = 2
        while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
            const marker = bytes[offset + 1]
            if (marker === 0xff) {
                offset++
                continue
            }
            if (marker === 0xda || marker === 0xd9) {
                break
            }
            const length = view.getUint16(offset + 2)
            if (length < 2 || offset + 2 + length > bytes.length) {
                break
            }
            if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
                return {
                    height: view.getUint16(offset + 5),
                    width: view.getUint16(offset + 7),
                    type: 'image/jpeg',
                }
            }
            offset += 2 + length
        }
    }
    return null
}

export async function readBytes(request, maximum) {
    const reader = request.body?.getReader()
    if (!reader) {
        return new Uint8Array()
    }
    const chunks = []
    let size = 0
    while (true) {
        const { value, done } = await reader.read()
        if (done) {
            break
        }
        size += value.byteLength
        if (size > maximum) {
            await reader.cancel()
            throw Response.json({ error: 'Слишком большой запрос' }, { status: 413 })
        }
        chunks.push(value)
    }
    const data = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
        data.set(chunk, offset)
        offset += chunk.byteLength
    }
    return data
}

export async function uploadMedia(request, db) {
    const bytes = await readBytes(request, 8 * 1024 * 1024)
    const info = imageInfo(bytes)
    if (
        !info ||
        info.width < 1 ||
        info.height < 1 ||
        info.width > 4096 ||
        info.height > 4096 ||
        info.width * info.height > 16000000
    ) {
        return Response.json(
            { error: 'Выберите PNG или JPEG с разрешением до 4096 × 4096' },
            { status: 422 },
        )
    }
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
    const id = [...hash].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    const statements = [
        db
            .prepare(
                'INSERT OR IGNORE INTO media (id, content_type, size, created_at) VALUES (?, ?, ?, ?)',
            )
            .bind(id, info.type, bytes.length, Math.floor(Date.now() / 1000)),
    ]
    const chunkSize = 1024 * 1024
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        statements.push(
            db
                .prepare(
                    'INSERT OR IGNORE INTO media_chunks (media_id, part, data) VALUES (?, ?, ?)',
                )
                .bind(id, offset / chunkSize, bytes.slice(offset, offset + chunkSize).buffer),
        )
    }
    await db.batch(statements)
    return Response.json(
        { url: `/api/media/${id}`, width: info.width, height: info.height },
        { status: 201 },
    )
}

export async function getMedia(id, db) {
    const media = await db.prepare('SELECT content_type FROM media WHERE id = ?').bind(id).first()
    if (!media) {
        return new Response('Not found', { status: 404 })
    }
    const rows = await db
        .prepare('SELECT data FROM media_chunks WHERE media_id = ? ORDER BY part')
        .bind(id)
        .all()
    const parts = rows.results.map((row) => new Uint8Array(row.data))
    return new Response(new Blob(parts, { type: media.content_type }), {
        headers: {
            'Content-Type': media.content_type,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    })
}
