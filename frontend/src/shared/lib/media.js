const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const showPoster = (showId) => asset(`assets/shows/${showId}.webp`)

const newShowFrames = {
    'polovina-mareri': '0 0 650 675',
    seventeen: '650 140 604 540',
    'klyukvennyy-sherbet': '335 680 650 555',
}

export function showPosterSprite(showId) {
    const viewBox = newShowFrames[showId]
    if (!viewBox) return null
    const [x, y, width, height] = viewBox.split(' ').map(Number)
    return {
        src: asset('assets/shows/new-shows-sheet.png'),
        viewBox,
        clip: { x, y, width, height },
    }
}

export const brandAvatar = asset('assets/brand/avatar.webp')

export const rasterIcons = {
    sun: asset('assets/ui/sun.webp'),
    calendar: asset('assets/ui/calendar.webp'),
    bell: asset('assets/ui/bell.webp'),
    feather: asset('assets/ui/feather.webp'),
    repeat: asset('assets/ui/repeat.webp'),
    sparkle: asset('assets/ui/sparkle.webp'),
    live: asset('assets/ui/live.webp'),
    rose: asset('assets/ui/rose.webp'),
}
