<script setup>
import { onBeforeUnmount, watch } from 'vue'
import app from '@/shared/content/app.json'
import { backButton, haptic } from '@/shared/telegram/telegram'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
})

const emit = defineEmits(['close'])

let previousBack = null

const close = () => emit('close')

const onKey = (event) => event.key === 'Escape' && close()

function lock() {
  previousBack = backButton.handler
  backButton.show(close)
  document.documentElement.classList.add('is-locked')
  window.addEventListener('keydown', onKey)
  haptic.tap()
}

function unlock() {
  previousBack ? backButton.show(previousBack) : backButton.hide()
  previousBack = null
  document.documentElement.classList.remove('is-locked')
  window.removeEventListener('keydown', onKey)
}

watch(
  () => props.open,
  (open) => (open ? lock() : unlock()),
)

onBeforeUnmount(() => props.open && unlock())
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="sheet" role="dialog" aria-modal="true" :aria-label="title">
        <div class="sheet__overlay" @click="close" />
        <div class="sheet__panel">
          <span class="sheet__handle" />
          <header class="sheet__head">
            <div class="sheet__titles">
              <span v-if="eyebrow" class="sheet__eyebrow">{{ eyebrow }}</span>
              <h2 class="sheet__title">{{ title }}</h2>
            </div>
            <button type="button" class="sheet__close" :aria-label="app.sheet.close" @click="close">
              <BaseIcon name="close" :size="18" />
            </button>
          </header>
          <div class="sheet__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="sheet__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.is-locked,
.is-locked body {
  overflow: hidden;
}

.sheet {
  position: fixed;
  inset: 0;
  z-index: var(--z-sheet);
  display: flex;
  align-items: flex-end;
  justify-content: center;

  &__overlay {
    position: absolute;
    inset: 0;
    background: var(--color-overlay);
    backdrop-filter: blur(6px);
  }

  &__panel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 560px;
    max-height: calc(var(--tg-viewport-stable-height, 100vh) - var(--safe-top) - var(--space-8));
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    background: var(--color-surface);
    box-shadow: 0 -24px 60px -20px var(--color-shadow);
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0 0 auto;
      height: 120px;
      background: linear-gradient(180deg, var(--color-sage-soft), transparent);
      pointer-events: none;
    }
  }

  &__handle {
    position: relative;
    align-self: center;
    width: 40px;
    height: 4px;
    margin-top: var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--color-line);
  }

  &__head {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4) var(--gutter) var(--space-3);
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
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
  }

  &__close {
    @include button-reset;
    @include press(0.88);
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--color-surface-muted);
    color: var(--color-ink-soft);
    flex-shrink: 0;
  }

  &__body {
    position: relative;
    flex: 1;
    padding: 0 var(--gutter) var(--space-5);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  &__footer {
    padding: var(--space-3) var(--gutter) calc(var(--safe-bottom) + var(--space-4));
    border-top: var(--border-hairline) solid var(--color-line);
  }
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--duration-slow) var(--ease-out);

  .sheet__panel {
    transition: transform var(--duration-slow) var(--ease-out);
  }
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;

  .sheet__panel {
    transform: translateY(100%);
  }
}
</style>
