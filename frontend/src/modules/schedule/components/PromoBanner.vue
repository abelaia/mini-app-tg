<script setup>
import { computed } from 'vue'
import { promoBanner } from '@/shared/lib/media'
import content from '../content.json'
import { useScheduleStore } from '../store'

const schedule = useScheduleStore()

const promo = computed(() => schedule.promo ?? content.promo)
</script>

<template>
  <aside v-if="promo?.text" class="promo">
    <img class="promo__image" :src="promoBanner" alt="" decoding="async" />
    <div class="promo__copy">
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
