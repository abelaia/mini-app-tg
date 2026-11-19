const ZOOM = [1, 3]
const STRETCH = [0.75, 1.6]
const SHIFT = [-80, 80]

function clamp(value, [min, max], fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

export function artworkPlacement(artwork) {
  return {
    zoom: clamp(artwork?.zoom, ZOOM, 1),
    stretch: clamp(artwork?.stretch, STRETCH, 1),
    x: clamp(artwork?.x, SHIFT, 0),
    y: clamp(artwork?.y, SHIFT, 0),
  }
}

export function artworkTransform(artwork) {
  const { zoom, stretch, x, y } = artworkPlacement(artwork)
  return {
    objectFit: 'cover',
    padding: 0,
    transform: `translate(${x}%, ${y}%) scale(${zoom * stretch}, ${zoom})`,
    transformOrigin: 'center',
  }
}
