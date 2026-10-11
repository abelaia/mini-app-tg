import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'
import { DEFAULT_TIMEZONE, WEEK } from '@/shared/lib/time'

export const useScheduleStore = defineStore('schedule', () => {
  const shows = ref([])
  const platforms = ref({})
  const timezone = ref(DEFAULT_TIMEZONE)
  const remindBeforeMinutes = ref(10)
  const status = ref('idle')

  const byDay = computed(() => Object.fromEntries(WEEK.map((day) => [day, shows.value.filter((show) => show.day === day)])))

  const showById = computed(() => Object.fromEntries(shows.value.map((show) => [show.id, show])))

  const platformOf = (show) => platforms.value[show.platform] ?? { title: show.platform, url: '' }

  async function load() {
    status.value = 'loading'
    try {
      const data = await http.get('/api/schedule')
      shows.value = data.shows
      platforms.value = data.platforms
      timezone.value = data.timezone
      remindBeforeMinutes.value = data.remindBeforeMinutes
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  return { shows, platforms, timezone, remindBeforeMinutes, status, byDay, showById, platformOf, load }
})
