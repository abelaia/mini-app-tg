<script setup>
import { computed } from 'vue'
import { rasterIcons } from '@/shared/lib/media'
import { mod } from '@/shared/lib/text'
import { icons } from './icons'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  stroke: { type: [Number, String], default: 1.6 },
})

const src = computed(() => rasterIcons[props.name] ?? '')
const path = computed(() => icons[props.name] ?? '')
</script>

<template>
  <img v-if="src" :class="mod('icon', { raster: true })" :src="src" :width="size" :height="size" alt="" decoding="async" />
  <svg v-else class="icon" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="path" />
  </svg>
</template>

<style lang="scss">
.icon {
  flex-shrink: 0;

  &--raster {
    display: block;
    object-fit: contain;
  }
}
</style>
