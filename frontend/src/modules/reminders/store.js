import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/shared/api/http'

const keyOf = (showId, kind) => `${showId}:${kind}`

export const useRemindersStore = defineStore('reminders', () => {
  const items = ref([])
  const status = ref('idle')
  const pending = ref(new Set())

  const index = computed(() => new Map(items.value.map((item) => [keyOf(item.showId, item.kind), item])))

  const count = computed(() => items.value.length)

  const isOn = (showId, kind) => index.value.has(keyOf(showId, kind))

  const isPending = (showId, kind) => pending.value.has(keyOf(showId, kind))

  async function load() {
    status.value = 'loading'
    try {
      items.value = await http.get('/api/reminders')
      status.value = 'ready'
    } catch {
      status.value = 'error'
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
      const created = await http.post('/api/reminders', { showId, kind })
      if (!isOn(showId, kind)) items.value = [...items.value, created]
      return created
    })
  }

  function remove(showId, kind) {
    const item = index.value.get(keyOf(showId, kind))
    if (!item) return Promise.resolve()
    return withPending(keyOf(showId, kind), async () => {
      await http.delete(`/api/reminders/${item.id}`)
      items.value = items.value.filter((entry) => entry.id !== item.id)
    })
  }

  async function clear() {
    await http.delete('/api/reminders')
    items.value = []
  }

  return { items, status, count, isOn, isPending, load, add, remove, clear }
})
