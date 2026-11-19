<script setup>
import { computed, ref } from 'vue'
import AsyncState from '@/shared/ui/AsyncState.vue'
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import { useNow } from '@/shared/composables/useNow'
import { WEEK } from '@/shared/lib/time'
import ScheduleCard from '../components/ScheduleCard.vue'
import content from '../content.json'
import { useScheduleStore } from '../store'

const schedule = useScheduleStore()
const { zoned, now } = useNow()
const selectedDay = ref(zoned.value.day)
const selectedShows = computed(() => schedule.byDay[selectedDay.value] ?? [])
const dates = computed(() => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: schedule.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now.value).map(({ type, value }) => [type, value]))
  const monday = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
  monday.setUTCDate(monday.getUTCDate() - WEEK.indexOf(zoned.value.day))
  return WEEK.map((day, index) => {
    const date = new Date(monday)
    date.setUTCDate(date.getUTCDate() + index)
    return { day, number: date.getUTCDate(), label: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date) }
  })
})
const selectedDate = computed(() => dates.value.find(date => date.day === selectedDay.value)?.label)
const range = computed(() => `${dates.value[0].label} — ${dates.value[6].label}`)
</script>

<template>
  <section class="week">
    <header class="week__heading"><h1>Неделя<br />историй</h1><p>{{ range }} · МСК</p></header>
    <nav class="week__picker" aria-label="Выбрать день недели">
      <button v-for="date in dates" :key="date.day" type="button" :class="{ 'is-selected': selectedDay === date.day }" :aria-pressed="selectedDay === date.day" :aria-label="`${content.days[date.day].full}, ${date.label}`" @click="selectedDay = date.day">
        <span>{{ content.days[date.day].short }}</span><strong>{{ date.number }}</strong><i v-if="schedule.byDay[date.day]?.length" aria-hidden="true" />
      </button>
    </nav>
    <AsyncState :status="schedule.status" @retry="schedule.load">
      <div class="week__selected-heading"><h2>{{ content.days[selectedDay].full }}</h2><span>{{ selectedDate }}</span></div>
      <div v-if="selectedShows.length" class="week__days">
        <ScheduleCard v-for="show in selectedShows" :key="show.id" :show="show" :now-minutes="selectedDay === zoned.day ? zoned.minutes : null" />
      </div>
      <div v-else class="week__empty"><BaseIcon name="calendar" :size="28" /><h3>В этот день без эфиров</h3><p>Выбери другой день — точки под датами отмечают дни с показами.</p></div>
      <p class="week__notes"><BaseIcon name="clock" :size="20" />Время московское. Нажми на колокольчик — бот напомнит за {{ schedule.remindBeforeMinutes }} минут.</p>
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
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-sage-soft);
    color: var(--color-sage-deep);
  }

  &__note {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1.3;
  }

  &__note-mark {
    flex-shrink: 0;
  }
}
</style>

<style lang="scss">
.week {
  gap: 28px;
  &__heading h1 { font: 600 46px/1.02 var(--font-serif); color: var(--color-ink); }
  &__heading p { margin-top: 18px; font-size: 12px; color: var(--color-ink-muted); }
  &__picker { display: grid; grid-template-columns: repeat(7, minmax(44px, 1fr)); gap: 6px; overflow-x: auto; padding-bottom: 4px; }
  &__picker button {
    @include button-reset;
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    min-height: 76px; padding: 9px 2px; border-radius: 12px;
    background: var(--color-surface); color: var(--color-ink);
    span { font-size: 11px; color: var(--color-ink-muted); }
    strong { font-size: 18px; font-weight: 600; }
    i { width: 3px; height: 3px; border-radius: 50%; background: currentColor; }
    &.is-selected { background: var(--color-sage-deep); color: var(--color-on-accent); span { color: inherit; } }
  }
  &__selected-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  &__selected-heading h2 { font: 600 30px/1.1 var(--font-serif); color: var(--color-ink); }
  &__selected-heading span { color: var(--color-ink-muted); font-size: 12px; }
  &__days { padding: 20px; gap: 24px; background: var(--color-surface); border-radius: 16px; }
  &__days .schedule-card + .schedule-card { padding-top: 24px; border-top: 1px solid var(--color-line); }
  &__notes { flex-direction: row; align-items: flex-start; font-size: 12px; line-height: 1.5; border-radius: 12px; svg { flex-shrink: 0; margin-top: 2px; } }
  &__empty { padding: 28px 20px; background: var(--color-surface); border-radius: 16px; color: var(--color-sage-deep); }
  &__empty h3 { margin-block: 12px; font: 600 27px/1.1 var(--font-serif); color: var(--color-ink); }
  &__empty p { color: var(--color-ink-muted); font-size: 13px; }
}
</style>
