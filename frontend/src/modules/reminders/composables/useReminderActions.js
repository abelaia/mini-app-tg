import { useToast } from '@/shared/composables/useToast'
import { fill } from '@/shared/lib/text'
import { confirm, haptic, requestWriteAccess } from '@/shared/telegram/telegram'
import { useScheduleStore } from '@/modules/schedule/store'
import content from '../content.json'
import { useRemindersStore } from '../store'

export function useReminderActions() {
  const reminders = useRemindersStore()
  const schedule = useScheduleStore()
  const toast = useToast()

  const fail = () => {
    haptic.error()
    toast.show(content.toasts.error, { tone: 'error' })
  }

  async function enable(showId, kind) {
    haptic.tap()
    if (!(await requestWriteAccess())) {
      haptic.warning()
      toast.show(content.toasts.denied, { tone: 'error', duration: 3600 })
      return
    }
    try {
      await reminders.add(showId, kind)
      haptic.success()
      toast.show(fill(content.toasts.on, { title: schedule.showById[showId]?.title ?? '' }), { tone: 'success' })
    } catch {
      fail()
    }
  }

  async function disable(showId, kind) {
    haptic.tap()
    try {
      await reminders.remove(showId, kind)
      toast.show(content.toasts.off)
    } catch {
      fail()
    }
  }

  function toggle(showId, kind) {
    if (reminders.isPending(showId, kind)) return
    return reminders.isOn(showId, kind) ? disable(showId, kind) : enable(showId, kind)
  }

  async function clearAll() {
    if (!(await confirm(content.confirmClear))) return
    try {
      await reminders.clear()
      haptic.success()
      toast.show(content.toasts.cleared)
    } catch {
      fail()
    }
  }

  return { toggle, disable, clearAll }
}
