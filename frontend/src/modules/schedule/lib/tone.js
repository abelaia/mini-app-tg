const TONES = ['sage', 'rose', 'olive']

export function toneOf(id) {
  const sum = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return TONES[sum % TONES.length]
}
