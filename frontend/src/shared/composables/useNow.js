import { computed, ref } from 'vue'
import { DEFAULT_TIMEZONE, zonedDateLabel, zonedNow } from '@/shared/lib/time'

const now = ref(new Date())
let timer = null

function start() {
  if (timer) return
  timer = window.setInterval(() => (now.value = new Date()), 20000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) now.value = new Date()
  })
}

export function useNow(timeZone = DEFAULT_TIMEZONE) {
  start()
  const zoned = computed(() => zonedNow(timeZone, now.value))
  const dateLabel = computed(() => zonedDateLabel(timeZone, now.value))
  return { now, zoned, dateLabel }
}
