<script setup>
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import { haptic, openLink } from '@/shared/telegram/telegram'

const props = defineProps({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  text: { type: String, default: '' },
  url: { type: String, default: '' },
  sheet: { type: String, default: '' },
})

const emit = defineEmits(['select'])

function open() {
  if (props.sheet) {
    emit('select', props.sheet)
    return
  }
  haptic.tap()
  openLink(props.url)
}
</script>

<template>
  <li>
    <button type="button" class="link-row" @click="open">
      <span class="link-row__icon">
        <BaseIcon :name="icon" :size="20" />
      </span>
      <span class="link-row__body">
        <span class="link-row__title">{{ title }}</span>
        <span v-if="text" class="link-row__text">{{ text }}</span>
      </span>
      <BaseIcon class="link-row__arrow" name="chevron-right" :size="18" />
    </button>
  </li>
</template>

<style lang="scss">
.link-row {
  @include button-reset;
  @include press(0.98);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) 0;
  text-align: left;

  &__icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: var(--radius-md);
    background: var(--color-sage-soft);
    color: var(--color-sage-deep);
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-weight: 600;
    font-size: var(--fs-md);
  }

  &__text {
    font-size: var(--fs-xs);
    color: var(--color-ink-muted);
  }

  &__arrow {
    color: var(--color-ink-muted);
  }
}
</style>
