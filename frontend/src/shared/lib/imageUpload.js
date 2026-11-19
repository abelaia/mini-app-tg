export async function prepareImage(file) {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type))
        throw new Error('Выберите PNG, JPEG, WebP, GIF или AVIF')
    if (file.size > 10 * 1024 * 1024) throw new Error('Размер файла — не больше 10 МБ')
    let image
    try {
        image = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
        throw new Error('Не удалось открыть картинку. Попробуйте другой файл')
    }
    try {
        if (image.width * image.height > 40_000_000)
            throw new Error('Разрешение картинки слишком большое — максимум 40 мегапикселей')
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Браузер не смог обработать картинку')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (!blob) throw new Error('Не удалось подготовить изображение')
        return blob
    } finally {
        image.close()
    }
}
