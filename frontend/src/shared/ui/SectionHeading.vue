<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
})
</script>

<template>
  <div class="heading">
    <div class="heading__main">
      <span v-if="eyebrow" class="heading__eyebrow">{{ eyebrow }}</span>
      <h2 class="heading__title">{{ title }}</h2>
      <p v-if="text" class="heading__text">{{ text }}</p>
    </div>
    <slot />
  </div>
</template>

<style lang="scss">
.heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);

  &__main {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  &__eyebrow {
    @include eyebrow;
    color: var(--color-sage);
  }

  &__title {
    font-family: var(--font-serif);
    font-size: var(--fs-xxl);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  &__text {
    font-size: var(--fs-sm);
    color: var(--color-ink-muted);
  }
}
</style>
