<script setup>
import { computed } from 'vue'
import ShowArt from './ShowArt.vue'
import EventRow from './EventRow.vue'
import content from '../content.json'
import { useScheduleStore } from '../store'

const props = defineProps({
  show: { type: Object, required: true },
  featured: { type: Boolean, default: false },
  nowMinutes: { type: Number, default: null },
})
const schedule = useScheduleStore()
const platform = computed(() => schedule.platformOf(props.show))
const kinds = computed(() => content.kindOrder.filter(kind => props.show.times?.[kind]))
</script>

<template>
  <article :class="['schedule-card', { 'schedule-card--featured': featured }]">
    <div v-if="featured" class="schedule-card__cover">
      <div class="schedule-card__cover-copy">
        <span class="schedule-card__platform">{{ platform.title }}</span>
        <p>Перевод<br />{{ show.translator }}</p>
      </div>
      <ShowArt :show="show" />
    </div>
    <div class="schedule-card__content">
      <h3 class="schedule-card__title">{{ show.title }}</h3>
      <p class="schedule-card__meta">{{ show.translator }} · {{ platform.title }}</p>
      <ul class="schedule-card__events">
        <EventRow v-for="kind in kinds" :key="kind" :show="show" :kind="kind" :now-minutes="nowMinutes" />
      </ul>
    </div>
  </article>
</template>

<style lang="scss">
.schedule-card {
  min-width: 0;
  &__cover {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    align-items: center;
    min-height: 170px;
    background: var(--color-sage-soft);
    color: var(--color-sage-deep);
    padding: 12px 12px 12px 20px;
    border-radius: 16px;
    .art { aspect-ratio: 1.15; background: none; border-radius: 0; }
    .art__image { padding: 0; }
  }
  &__platform { font-size: 12px; font-weight: 600; }
  &__cover-copy p {
    margin-top: 20px;
    font: 500 29px/1.12 var(--font-serif);
  }
  &__content { padding-block: 4px; }
  &__title { font: 600 30px/1.08 var(--font-serif); color: var(--color-ink); overflow-wrap: anywhere; }
  &__meta { margin-top: 8px; color: var(--color-ink-muted); font-size: 12px; }
  &__events { margin-top: 14px; }
  &--featured { background: var(--color-surface); border-radius: 16px; }
  &--featured &__content { padding: 22px 20px 12px; }
}
</style>
