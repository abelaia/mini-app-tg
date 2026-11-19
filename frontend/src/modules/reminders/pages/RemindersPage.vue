<script setup>
import { computed } from 'vue'
import AsyncState from '@/shared/ui/AsyncState.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SectionHeading from '@/shared/ui/SectionHeading.vue'
import { useNow } from '@/shared/composables/useNow'
import { fill } from '@/shared/lib/text'
import { dayOffset } from '@/shared/lib/time'
import { useScheduleStore } from '@/modules/schedule/store'
import scheduleContent from '@/modules/schedule/content.json'
import ReminderItem from '../components/ReminderItem.vue'
import { useReminderActions } from '../composables/useReminderActions'
import content from '../content.json'
import { useRemindersStore } from '../store'

const reminders = useRemindersStore()
const schedule = useScheduleStore()
const { zoned } = useNow()
const { disable, clearAll } = useReminderActions()

const status = computed(() => {
  const states = [reminders.status, schedule.status]
  if (states.includes('error')) return 'error'
  return states.every((state) => state === 'ready') ? 'ready' : 'loading'
})

const items = computed(() =>
  reminders.items
    .map((item) => ({ ...item, show: schedule.showById[item.showId] }))
    .filter((item) => item.show)
    .sort((a, b) => {
      const byDay = dayOffset(zoned.value.day, a.show.day) - dayOffset(zoned.value.day, b.show.day)
      return byDay || scheduleContent.kindOrder.indexOf(a.kind) - scheduleContent.kindOrder.indexOf(b.kind)
    }),
)

const subtitle = computed(() => fill(content.subtitle, { minutes: schedule.remindBeforeMinutes }))

const retry = () => Promise.all([reminders.load(), schedule.load()])
</script>

<template>
  <section class="reminders">
    <SectionHeading :eyebrow="content.eyebrow" :title="content.title" :text="subtitle" />
    <AsyncState :status="status" @retry="retry">
      <TransitionGroup v-if="items.length" tag="ul" name="reminders" class="reminders__list">
        <ReminderItem v-for="item in items" :key="item.id" :show="item.show" :kind="item.kind" @remove="disable(item.showId, item.kind)" />
      </TransitionGroup>
      <EmptyState v-else icon="bell" :title="content.empty.title" :text="content.empty.text">
        <RouterLink to="/week">
          <BaseButton icon="calendar">{{ content.empty.action }}</BaseButton>
        </RouterLink>
      </EmptyState>
      <BaseButton v-if="items.length > 1" class="reminders__clear" variant="danger" icon="bell-off" block @click="clearAll">{{ content.clear }}</BaseButton>
    </AsyncState>
  </section>
</template>

<style lang="scss">
.reminders {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__list {
    @include card;
    padding: var(--space-1) var(--space-4);
  }

  &__clear {
    margin-top: var(--space-2);
  }
}

.reminders-leave-active {
  transition: opacity var(--duration-base) var(--ease-out), transform var(--duration-base) var(--ease-out);
}

.reminders-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
