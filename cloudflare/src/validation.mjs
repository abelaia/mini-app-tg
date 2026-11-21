const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const days = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
const icons = new Set(['city', 'mosque', 'layers', 'flame', 'wave', 'rose', 'sparkle', 'sun'])

function text(fields, key, value, limit) {
    if (typeof value !== 'string' || !value.trim()) {
        fields[key] = 'Заполните это поле'
    } else if ([...value].length > limit) {
        fields[key] = `Не больше ${limit} символов`
    }
}

export function validateSchedule(value) {
    const fields = {}
    if (value?.timezone !== 'Europe/Moscow') {
        fields.timezone = 'Выберите Europe/Moscow'
    }
    const platforms = value?.platforms
    if (!platforms || typeof platforms !== 'object' || Array.isArray(platforms)) {
        fields.platforms = 'Добавьте площадки'
    } else {
        if (!Object.keys(platforms).length) {
            fields.platforms = 'Добавьте хотя бы одну площадку'
        }
        for (const [id, platform] of Object.entries(platforms)) {
            if (!idPattern.test(id) || id.length > 64) {
                fields[`platforms.${id}.id`] = 'Некорректный ID площадки'
            }
            text(fields, `platforms.${id}.title`, platform?.title, 120)
            try {
                const url = new URL(platform?.url)
                if (!['https:', 'http:'].includes(url.protocol) || platform.url.length > 2048) {
                    throw new Error('Invalid URL')
                }
            } catch {
                fields[`platforms.${id}.url`] = 'Укажите ссылку http:// или https://'
            }
        }
    }
    if (!Array.isArray(value?.shows) || !value.shows.length || value.shows.length > 500) {
        fields.shows = 'Добавьте от 1 до 500 сериалов'
        return fields
    }
    const seen = new Map()
    value.shows.forEach((show, index) => {
        const key = `shows.${index}`
        text(fields, `${key}.id`, show?.id, 64)
        text(fields, `${key}.title`, show?.title, 120)
        text(fields, `${key}.translator`, show?.translator, 80)
        if (!idPattern.test(show?.id ?? '')) {
            fields[`${key}.id`] = 'Только строчные латинские буквы, цифры и дефисы'
        }
        if (seen.has(show?.id)) {
            fields[`${key}.id`] = 'Этот ID уже используется другим сериалом'
            fields[`shows.${seen.get(show?.id)}.id`] = fields[`${key}.id`]
        }
        seen.set(show?.id, index)
        if (!days.has(show?.day)) {
            fields[`${key}.day`] = 'Выберите день недели'
        }
        if (!Object.hasOwn(platforms ?? {}, show?.platform ?? '')) {
            fields[`${key}.platform`] = 'Выберите площадку из списка'
        }
        if (!icons.has(show?.icon)) {
            fields[`${key}.icon`] = 'Выберите иконку из списка'
        }
        for (const kind of ['repeat', 'premiere']) {
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(show?.times?.[kind] ?? '')) {
                fields[`${key}.times.${kind}`] = 'Укажите время от 00:00 до 23:59'
            }
        }
        if (Object.keys(show?.times ?? {}).some((kind) => !['repeat', 'premiere'].includes(kind))) {
            fields[`${key}.times`] = 'Неизвестный тип показа'
        }
        if (show?.endTimes != null) {
            if (typeof show.endTimes !== 'object' || Array.isArray(show.endTimes)) {
                fields[`${key}.endTimes`] = 'Укажите время окончания показа'
            } else {
                for (const [kind, end] of Object.entries(show.endTimes)) {
                    if (!['repeat', 'premiere'].includes(kind)) {
                        fields[`${key}.endTimes`] = 'Неизвестный тип показа'
                    } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(end ?? '')) {
                        fields[`${key}.endTimes.${kind}`] = 'Укажите время от 00:00 до 23:59'
                    } else if (end === show.times?.[kind]) {
                        fields[`${key}.endTimes.${kind}`] = 'Окончание должно отличаться от начала'
                    }
                }
            }
        }
        if (show?.enabled !== undefined && typeof show.enabled !== 'boolean') {
            fields[`${key}.enabled`] = 'Некорректное состояние'
        }
        if (show?.artwork) {
            const art = show.artwork
            const bounds = { zoom: [1, 3], stretch: [0.75, 1.6], x: [-80, 80], y: [-80, 80] }
            let valid = /^\/api\/media\/[a-f0-9]{64}$/.test(art.url ?? '')
            valid &&= art.role === 'icon' && art.fit === 'cover'
            for (const [field, [minimum, maximum]] of Object.entries(bounds)) {
                const number = art[field] ?? (['zoom', 'stretch'].includes(field) ? 1 : 0)
                valid &&= Number.isFinite(number) && number >= minimum && number <= maximum
            }
            if (!valid) {
                fields[`${key}.artwork`] = 'Загрузите картинку и настройте кадр иконки'
            }
        }
    })
    return fields
}

export function validatePromo(value) {
    const fields = {}
    text(fields, 'eyebrow', value?.eyebrow, 80)
    text(fields, 'text', value?.text, 1000)
    if (typeof value?.enabled !== 'boolean') {
        fields.enabled = 'Некорректное состояние'
    }
    return fields
}
