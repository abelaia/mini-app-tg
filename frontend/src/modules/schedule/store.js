import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'
import { DEFAULT_TIMEZONE, WEEK } from '@/shared/lib/time'

export const useScheduleStore = defineStore('schedule', () => {
  const shows = ref([])
  const platforms = ref({})
  const timezone = ref(DEFAULT_TIMEZONE)
  const remindBeforeMinutes = ref(10)
  const promo = ref(null)
  const status = ref('idle')

  const byDay = computed(() => Object.fromEntries(WEEK.map((day) => [day, shows.value.filter((show) => show.day === day)])))

  const showById = computed(() => Object.fromEntries(shows.value.map((show) => [show.id, show])))

  const platformOf = (show) => platforms.value[show.platform] ?? { title: show.platform, url: '' }

  async function apply(data) {
    shows.value = data.shows
    platforms.value = data.platforms
    timezone.value = data.timezone
    remindBeforeMinutes.value = data.remindBeforeMinutes
    promo.value = data.promo ?? null
    status.value = 'ready'
  }

  async function load() {
    status.value = 'loading'
    try {
      await apply(await http.get('/api/schedule'))
    } catch {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}assets/schedule.json`)
        if (!response.ok) throw new Error('sample schedule missing')
        await apply(await response.json())
      } catch {
        status.value = 'error'
      }
    }
  }

  return { shows, platforms, timezone, remindBeforeMinutes, promo, status, byDay, showById, platformOf, load }
})
