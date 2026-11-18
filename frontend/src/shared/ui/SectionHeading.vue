<script setup>
defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  script: { type: Boolean, default: false },
})
</script>

<template>
  <div class="heading">
    <div class="heading__main">
      <h2 :class="['heading__title', { 'heading__title--script': script }]">{{ title }}</h2>
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

  &__title {
    font-family: var(--font-serif);
    font-size: var(--fs-xxl);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.01em;

    &--script {
      font-family: var(--font-script);
      font-size: var(--fs-display);
      font-weight: 400;
      line-height: 1.15;
      letter-spacing: 0;
      color: var(--color-rose);
    }
  }

  &__text {
    font-size: var(--fs-sm);
    color: var(--color-ink-muted);
  }
}
</style>
