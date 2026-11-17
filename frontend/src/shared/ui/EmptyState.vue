<script setup>
import BrandMark from './BrandMark.vue'

defineProps({
  icon: { type: String, default: 'rose' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
})
</script>

<template>
  <div class="empty">
    <BrandMark class="empty__mark" :name="icon" :size="104" tone="rose" />
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="text" class="empty__text">{{ text }}</p>
    <slot />
  </div>
</template>

<style lang="scss">
.empty {
  @include card;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-6);
  text-align: center;

  &__mark {
    margin-bottom: var(--space-2);
  }

  &__title {
    font-family: var(--font-serif);
    font-size: var(--fs-xl);
    font-weight: 600;
    line-height: 1.1;
  }

  &__text {
    max-width: 280px;
    margin-bottom: var(--space-3);
    font-size: var(--fs-sm);
    color: var(--color-ink-muted);
  }
}
</style>
