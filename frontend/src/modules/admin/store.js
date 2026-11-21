import { ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'
import { validatePromo, validateSchedule } from './validation'

const blankShow = () => ({
    id: '',
    title: '',
    translator: '',
    day: 'monday',
    platform: 'vk',
    icon: 'rose',
    times: { repeat: '20:00', premiere: '21:00' },
    endTimes: { repeat: '', premiere: '' },
    enabled: true,
})

export const useAdminStore = defineStore('admin', () => {
    const schedule = ref(null)
    const promo = ref(null)
    const status = ref('idle')
    const saving = ref(false)
    const message = ref('')
    const fieldErrors = ref({})

    async function load() {
        status.value = 'loading'
        message.value = ''
        try {
            const [nextSchedule, nextPromo] = await Promise.all([
                http.get('/api/admin/schedule'),
                http.get('/api/admin/promo'),
            ])
            schedule.value = {
                ...nextSchedule,
                shows: (nextSchedule.shows ?? []).map((show) => ({
                    ...show,
                    enabled: show.enabled !== false,
                    endTimes: {
                        repeat: show.endTimes?.repeat ?? '',
                        premiere: show.endTimes?.premiere ?? '',
                    },
                    times: {
                        repeat: show.times?.repeat ?? '20:00',
                        premiere: show.times?.premiere ?? '21:00',
                    },
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
        if (!schedule.value || saving.value) return
        fieldErrors.value = validateSchedule(schedule.value)
        if (Object.keys(fieldErrors.value).length) return false
        saving.value = true
        message.value = ''
        try {
            const payload = {
                timezone: schedule.value.timezone,
                platforms: schedule.value.platforms,
                shows: schedule.value.shows.map((show) => ({
                    artwork: show.artwork ?? null,
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
                    endTimes: Object.fromEntries(
                        Object.entries(show.endTimes ?? {}).filter(([, time]) => time),
                    ),
                    enabled: Boolean(show.enabled),
                })),
            }
            const saved = await http.put('/api/admin/schedule', payload)
            schedule.value = {
                ...saved,
                shows: (saved.shows ?? []).map((show) => ({
                    ...show,
                    enabled: show.enabled !== false,
                    endTimes: {
                        repeat: show.endTimes?.repeat ?? '',
                        premiere: show.endTimes?.premiere ?? '',
                    },
                    times: {
                        repeat: show.times?.repeat ?? '20:00',
                        premiere: show.times?.premiere ?? '21:00',
                    },
                })),
            }
            message.value = 'schedule'
        } catch (error) {
            fieldErrors.value = error.fields ?? {}
            message.value = 'error'
        } finally {
            saving.value = false
        }
    }

    async function savePromo() {
        if (!promo.value || saving.value) return
        fieldErrors.value = validatePromo(promo.value)
        if (Object.keys(fieldErrors.value).length) return false
        saving.value = true
        message.value = ''
        try {
            promo.value = await http.put('/api/admin/promo', {
                eyebrow: promo.value.eyebrow.trim(),
                text: promo.value.text.trim(),
                enabled: Boolean(promo.value.enabled),
            })
            message.value = 'promo'
        } catch (error) {
            fieldErrors.value = error.fields ?? {}
            message.value = 'error'
        } finally {
            saving.value = false
        }
    }

    return {
        schedule,
        promo,
        status,
        saving,
        message,
        fieldErrors,
        load,
        addShow,
        removeShow,
        saveSchedule,
        savePromo,
    }
})
