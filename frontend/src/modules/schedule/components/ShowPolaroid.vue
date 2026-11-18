<script setup>
import { computed } from 'vue'
import content from '../content.json'
import { useScheduleStore } from '../store'
import EventRow from './EventRow.vue'
import ShowArt from './ShowArt.vue'

const props = defineProps({
  show: { type: Object, required: true },
  nowMinutes: { type: Number, default: null },
})

const schedule = useScheduleStore()
const platform = computed(() => schedule.platformOf(props.show))
const kinds = ['premiere', 'repeat']
</script>

<template>
  <article class="polaroid">
    <div class="polaroid__lead">
      <ShowArt :show="show" size="medallion" />
      <div class="polaroid__copy">
        <h3 class="polaroid__title">{{ show.title }}</h3>
        <p class="polaroid__translator">{{ content.translator }}: {{ show.translator }} · {{ platform.title }}</p>
      </div>
    </div>
    <ul class="polaroid__events">
      <EventRow v-for="kind in kinds" :key="kind" :show="show" :kind="kind" :now-minutes="nowMinutes" :quiet="kind === 'repeat'" />
    </ul>
  </article>
</template>

<style lang="scss">
.polaroid {
  padding: var(--space-4);
  background: var(--color-surface);
  border: var(--border-hairline) solid var(--color-line);
  border-radius: var(--radius-lg);

  &__lead {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__copy {
    min-width: 0;
  }

  &__title {
    font-family: var(--font-sans);
    font-size: var(--fs-xl);
    font-weight: 600;
    line-height: 1.15;
    color: var(--color-ink);
  }

  &__translator {
    margin-top: var(--space-1);
    font-size: var(--fs-sm);
    color: var(--color-ink-soft);
  }

  &__events {
    margin-top: var(--space-2);
  }
}
</style>
