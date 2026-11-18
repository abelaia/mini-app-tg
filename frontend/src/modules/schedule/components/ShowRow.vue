<script setup>
import { computed } from 'vue'
import ReminderBell from '@/modules/reminders/components/ReminderBell.vue'
import content from '../content.json'
import { useScheduleStore } from '../store'
import ShowArt from './ShowArt.vue'

const props = defineProps({
  show: { type: Object, required: true },
  caption: { type: String, default: '' },
})

const schedule = useScheduleStore()
const platform = computed(() => schedule.platformOf(props.show))
</script>

<template>
  <article class="show-row">
    <ShowArt :show="show" size="medallion" />
    <div class="show-row__body">
      <h3 class="show-row__title">{{ show.title }}</h3>
      <p class="show-row__meta">{{ [caption, show.translator, platform.title].filter(Boolean).join(' · ') }}</p>
      <div class="show-row__times">
        <ReminderBell :show-id="show.id" kind="premiere" variant="chip" :label="`${show.times.premiere} · ${content.kinds.premiere.short}`" />
        <ReminderBell :show-id="show.id" kind="repeat" variant="quiet" :label="`${content.kinds.repeat.short} ${show.times.repeat}`" />
      </div>
    </div>
  </article>
</template>

<style lang="scss">
.show-row {
  display: flex;
  gap: var(--space-3);

  &__body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-family: var(--font-sans);
    font-size: var(--fs-lg);
    font-weight: 600;
    line-height: 1.15;
  }

  &__meta {
    font-size: var(--fs-xs);
    color: var(--color-ink-muted);
  }

  &__times {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
}
</style>
