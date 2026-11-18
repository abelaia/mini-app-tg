<script setup>
import AsyncState from '@/shared/ui/AsyncState.vue'
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
    <SectionHeading :title="content.week.title" :text="content.week.hint" />
    <AsyncState :status="schedule.status" @retry="schedule.load">
      <div class="week__days">
        <DayBlock v-for="day in WEEK" :key="day" :day="day" :shows="schedule.byDay[day]" :today="day === zoned.day" />
      </div>
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
}
</style>
