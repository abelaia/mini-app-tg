import { ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'

const blankShow = () => ({
  id: '',
  title: '',
  translator: '',
  day: 'monday',
  platform: 'vk',
  icon: 'rose',
  times: { repeat: '20:00', premiere: '21:00' },
  enabled: true,
})

export const useAdminStore = defineStore('admin', () => {
  const schedule = ref(null)
  const promo = ref(null)
  const status = ref('idle')
  const saving = ref(false)
  const message = ref('')

  async function load() {
    status.value = 'loading'
    message.value = ''
    try {
      const [nextSchedule, nextPromo] = await Promise.all([http.get('/api/admin/schedule'), http.get('/api/admin/promo')])
      schedule.value = {
        ...nextSchedule,
        shows: (nextSchedule.shows ?? []).map((show) => ({
          ...show,
          enabled: show.enabled !== false,
          times: { repeat: show.times?.repeat ?? '20:00', premiere: show.times?.premiere ?? '21:00' },
        })),
      }
      promo.value = nextPromo
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  function addShow() {
    if (!schedule.value) return
    schedule.value.shows = [...schedule.value.shows, blankShow()]
  }

  function removeShow(index) {
    if (!schedule.value) return
    schedule.value.shows = schedule.value.shows.filter((_, i) => i !== index)
  }

  async function saveSchedule() {
    if (!schedule.value) return
    saving.value = true
    message.value = ''
    try {
      const payload = {
        timezone: schedule.value.timezone,
        platforms: schedule.value.platforms,
        shows: schedule.value.shows.map((show) => ({
          id: show.id.trim(),
          title: show.title.trim(),
          translator: show.translator.trim(),
          day: show.day,
          platform: show.platform,
          icon: show.icon,
          times: {
            repeat: show.times.repeat,
            premiere: show.times.premiere,
          },
          enabled: Boolean(show.enabled),
        })),
      }
      const saved = await http.put('/api/admin/schedule', payload)
      schedule.value = {
        ...saved,
        shows: (saved.shows ?? []).map((show) => ({
          ...show,
          enabled: show.enabled !== false,
          times: { repeat: show.times?.repeat ?? '20:00', premiere: show.times?.premiere ?? '21:00' },
        })),
      }
      message.value = 'schedule'
    } catch {
      message.value = 'error'
    } finally {
      saving.value = false
    }
  }

  async function savePromo() {
    if (!promo.value) return
    saving.value = true
    message.value = ''
    try {
      promo.value = await http.put('/api/admin/promo', {
        eyebrow: promo.value.eyebrow.trim(),
        text: promo.value.text.trim(),
        enabled: Boolean(promo.value.enabled),
      })
      message.value = 'promo'
    } catch {
      message.value = 'error'
    } finally {
      saving.value = false
    }
  }

  return { schedule, promo, status, saving, message, load, addShow, removeShow, saveSchedule, savePromo }
})
