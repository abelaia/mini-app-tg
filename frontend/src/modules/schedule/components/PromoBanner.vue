<script setup>
import { promoBanner } from '@/shared/lib/media'
import content from '../content.json'
</script>

<template>
  <aside class="promo" :style="{ '--promo-image': `url(${promoBanner})` }">
    <div class="promo__copy">
      <span class="promo__eyebrow">{{ content.promo.eyebrow }}</span>
      <p class="promo__text">{{ content.promo.text }}</p>
    </div>
  </aside>
</template>

<style lang="scss">
.promo {
  position: relative;
  min-height: 112px;
  padding: var(--space-4) var(--space-4) var(--space-4) 42%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: var(--border-hairline) solid var(--color-line);
  background:
    linear-gradient(100deg, rgba(42, 33, 28, 0.78) 0%, rgba(42, 33, 28, 0.42) 40%, rgba(42, 33, 28, 0.12) 68%),
    var(--promo-image) center / cover no-repeat;

  &__eyebrow {
    @include eyebrow;
    color: var(--color-gold);
  }

  &__text {
    margin: var(--space-2) 0 0;
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1.35;
    color: var(--color-cream);
  }
}
</style>