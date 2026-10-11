<script setup>
import { computed } from 'vue'
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import { mod } from '@/shared/lib/text'
import { toneOf } from '../lib/tone'

const props = defineProps({
  show: { type: Object, required: true },
  size: { type: String, default: 'photo' },
})

const tone = computed(() => toneOf(props.show.id))
</script>

<template>
  <div :class="mod('art', { [size]: true, [tone]: true })">
    <span class="art__glow" />
    <BaseIcon class="art__icon" :name="show.icon" :size="size === 'photo' ? 96 : 22" :stroke="size === 'photo' ? 0.7 : 1.5" />
    <slot />
  </div>
</template>

<style lang="scss">
.art {
  @include grain(0.55);
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--color-cream);
  background: linear-gradient(155deg, var(--art-a) 0%, var(--art-b) 100%);

  &--sage {
    --art-a: var(--color-photo-sage-a);
    --art-b: var(--color-photo-sage-b);
  }

  &--rose {
    --art-a: var(--color-photo-rose-a);
    --art-b: var(--color-photo-rose-b);
  }

  &--olive {
    --art-a: var(--color-photo-olive-a);
    --art-b: var(--color-photo-olive-b);
  }

  &--photo {
    aspect-ratio: 16 / 11;
    border-radius: 2px;

    .art__icon {
      opacity: 0.92;
      filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.25));
    }
  }

  &--medallion {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__glow {
    position: absolute;
    top: -30%;
    left: -20%;
    width: 80%;
    height: 80%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 244, 222, 0.55) 0%, transparent 70%);
    pointer-events: none;
  }

  &__icon {
    position: relative;
  }
}
</style>
