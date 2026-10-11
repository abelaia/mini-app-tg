<script setup>
import { computed } from 'vue'
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import content from '../content.json'
import { useScheduleStore } from '../store'
import EventRow from './EventRow.vue'
import ShowArt from './ShowArt.vue'

const props = defineProps({
  show: { type: Object, required: true },
  nowMinutes: { type: Number, default: null },
  tilt: { type: Number, default: 0 },
})

const schedule = useScheduleStore()
const platform = computed(() => schedule.platformOf(props.show))
</script>

<template>
  <article class="polaroid" :style="{ '--tilt': `${tilt}deg` }">
    <ShowArt class="polaroid__photo" :show="show">
      <span class="polaroid__platform">{{ platform.title }}</span>
    </ShowArt>
    <div class="polaroid__caption">
      <h3 class="polaroid__title">{{ show.title }}</h3>
      <p class="polaroid__translator">
        <BaseIcon name="mic" :size="14" />
        {{ content.translator }}: {{ show.translator }}
      </p>
    </div>
    <ul class="polaroid__events">
      <EventRow v-for="kind in content.kindOrder" :key="kind" :show="show" :kind="kind" :now-minutes="nowMinutes" />
    </ul>
  </article>
</template>

<style lang="scss">
.polaroid {
  position: relative;
  padding: var(--space-3) var(--space-3) var(--space-2);
  background: var(--color-paper);
  border-radius: var(--radius-xs);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 24px 48px -24px var(--color-shadow);
  transform: rotate(var(--tilt));
  animation: polaroid-drop var(--duration-slow) var(--ease-spring) both;

  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 50%;
    width: 84px;
    height: 22px;
    background: rgba(236, 222, 190, 0.7);
    transform: translateX(-50%) rotate(-3deg);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    z-index: 1;
  }

  &__platform {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: rgba(252, 250, 244, 0.22);
    border: var(--border-hairline) solid rgba(252, 250, 244, 0.35);
    backdrop-filter: blur(8px);
    @include eyebrow;
    font-size: var(--fs-xxs);
    color: var(--color-cream);
  }

  &__caption {
    padding: var(--space-4) var(--space-1) var(--space-1);
  }

  &__title {
    font-family: var(--font-serif);
    font-size: var(--fs-xxl);
    font-weight: 600;
    line-height: 1.02;
    color: var(--color-paper-ink);
  }

  &__translator {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: var(--space-2);
    font-size: var(--fs-sm);
    color: var(--color-paper-muted);
  }

  &__events {
    padding: 0 var(--space-1);
  }
}

@keyframes polaroid-drop {
  from {
    opacity: 0;
    transform: translateY(24px) rotate(calc(var(--tilt) * 3));
  }
}
</style>
