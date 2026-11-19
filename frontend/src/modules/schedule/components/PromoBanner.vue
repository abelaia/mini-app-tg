<script setup>
import { computed } from 'vue'
import content from '../content.json'
import { useScheduleStore } from '../store'

const schedule = useScheduleStore()

// After a successful schedule load, trust the API (incl. enabled:false).
// Static content.promo is only a fallback before/without API data.
const promo = computed(() => {
  const fromApi = schedule.promo
  if (fromApi) return fromApi.enabled === false ? null : fromApi
  if (schedule.status === 'ready') return null
  return content.promo
})
</script>

<template>
  <aside v-if="promo?.text && promo.enabled !== false" class="promo">
    <div class="promo__copy">
      <h2 class="promo__eyebrow">{{ promo.eyebrow || content.promo.eyebrow }}</h2>
      <p class="promo__text">{{ promo.text }}</p>
    </div>
  </aside>
</template>

<style lang="scss">
.promo {
  position: relative;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  min-height: 118px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: var(--border-hairline) solid var(--color-line);
  background: var(--color-surface);

  &__image {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 118px;
    object-fit: cover;
    object-position: 18% center;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-4);
    background: color-mix(in srgb, var(--color-surface) 92%, var(--color-ink));
  }

  &__eyebrow {
    @include eyebrow;
    color: var(--color-rose);
  }

  &__text {
    margin: 0;
    font-size: var(--fs-sm);
    font-weight: 650;
    line-height: 1.35;
    color: var(--color-ink);
  }
}

:root[data-theme='dark'] .promo__copy {
  background: color-mix(in srgb, var(--color-surface) 88%, black);
}
</style>

<style lang="scss">
.promo {
  display: block; min-height: 0; border: 0; border-radius: 0; background: none;
  border-top: 1px solid var(--color-line); padding-top: 24px; margin-top: 24px;
  &__copy { padding: 0; background: none !important; gap: 10px; }
  &__eyebrow { font: 600 26px/1.1 var(--font-serif); letter-spacing: 0; text-transform: none; }
  &__text { font-size: 13px; font-weight: 400; color: var(--color-ink-soft); line-height: 1.6; }
}
</style>
