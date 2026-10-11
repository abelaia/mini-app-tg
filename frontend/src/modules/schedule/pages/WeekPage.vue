<script setup>
import AsyncState from '@/shared/ui/AsyncState.vue'
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import SectionHeading from '@/shared/ui/SectionHeading.vue'
import { useNow } from '@/shared/composables/useNow'
import { WEEK } from '@/shared/lib/time'
import DayBlock from '../components/DayBlock.vue'
import content from '../content.json'
import { useScheduleStore } from '../store'

const schedule = useScheduleStore()
const { zoned } = useNow()
</script>

<template>
  <section class="week">
    <SectionHeading :eyebrow="content.week.eyebrow" :title="content.week.title" :text="content.week.hint" />
    <AsyncState :status="schedule.status" @retry="schedule.load">
      <div class="week__days">
        <DayBlock v-for="day in WEEK" :key="day" :day="day" :shows="schedule.byDay[day]" :today="day === zoned.day" />
      </div>
      <ul class="week__notes">
        <li v-for="note in content.week.notes" :key="note.text" class="week__note">
          <BaseIcon :name="note.icon" :size="16" />
          {{ note.text }}
        </li>
      </ul>
    </AsyncState>
  </section>
</template>

<style lang="scss">
.week {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__days {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__notes {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-sage-soft);
    color: var(--color-sage-deep);
  }

  &__note {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--fs-sm);
    font-weight: 500;
  }
}
</style>
