import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'
import { isPreview } from '@/shared/lib/environment'

const keyOf = (showId, kind) => `${showId}:${kind}`
const previewStorageKey = 'turkdizi:preview-reminders:v1'

export const useRemindersStore = defineStore('reminders', () => {
    const items = ref([])
    const status = ref('idle')
    const pending = ref(new Set())

    const index = computed(
        () => new Map(items.value.map((item) => [keyOf(item.showId, item.kind), item])),
    )

    const count = computed(() => items.value.length)

    const isOn = (showId, kind) => index.value.has(keyOf(showId, kind))

    const isPending = (showId, kind) => pending.value.has(keyOf(showId, kind))

    async function load() {
        status.value = 'loading'
        if (isPreview) {
            try {
                const saved = JSON.parse(localStorage.getItem(previewStorageKey) ?? '[]')
                items.value = Array.isArray(saved)
                    ? saved.filter(
                          (item) =>
                              item &&
                              typeof item.showId === 'string' &&
                              ['repeat', 'premiere'].includes(item.kind) &&
                              typeof item.id === 'string',
                      )
                    : []
            } catch {
                items.value = []
            }
            status.value = 'ready'
            return
        }
        try {
            items.value = await http.get('/api/reminders')
            status.value = 'ready'
        } catch {
            items.value = []
            status.value = 'error'
        }
    }

    function savePreview() {
        try {
            localStorage.setItem(previewStorageKey, JSON.stringify(items.value))
        } catch {
            // The preview remains usable when browser storage is unavailable.
        }
    }

    async function withPending(key, task) {
        pending.value = new Set(pending.value).add(key)
        try {
            return await task()
        } finally {
            const next = new Set(pending.value)
            next.delete(key)
            pending.value = next
        }
    }

    function add(showId, kind) {
        return withPending(keyOf(showId, kind), async () => {
            if (isPreview) {
                const existing = index.value.get(keyOf(showId, kind))
                if (existing) return existing
                const created = {
                    id: crypto.randomUUID(),
                    showId,
                    kind,
                    createdAt: new Date().toISOString(),
                }
                items.value = [...items.value, created]
                savePreview()
                return created
            }
            const created = await http.post('/api/reminders', { showId, kind })
            if (!isOn(showId, kind)) items.value = [...items.value, created]
            return created
        })
    }

    function remove(showId, kind) {
        const item = index.value.get(keyOf(showId, kind))
        if (!item) return Promise.resolve()
        return withPending(keyOf(showId, kind), async () => {
            if (isPreview) {
                items.value = items.value.filter((entry) => entry.id !== item.id)
                savePreview()
                return
            }
            await http.delete(`/api/reminders/${item.id}`)
            items.value = items.value.filter((entry) => entry.id !== item.id)
        })
    }

    async function clear() {
        if (isPreview) {
            items.value = []
            savePreview()
            return
        }
        await http.delete('/api/reminders')
        items.value = []
    }

    return { items, status, count, isOn, isPending, load, add, remove, clear }
})
