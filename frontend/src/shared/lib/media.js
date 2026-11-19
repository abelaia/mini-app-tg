const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const showPoster = (showId) => asset(`assets/shows/${showId}.webp`)

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