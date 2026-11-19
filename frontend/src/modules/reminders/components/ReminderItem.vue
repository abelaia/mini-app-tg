<script setup>
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import ShowArt from '@/modules/schedule/components/ShowArt.vue'
import scheduleContent from '@/modules/schedule/content.json'
import content from '../content.json'

defineProps({
  show: { type: Object, required: true },
  kind: { type: String, required: true },
})

defineEmits(['remove'])
</script>

<template>
  <li class="reminder">
    <ShowArt :show="show" size="medallion" />
    <div class="reminder__body">
      <h3 class="reminder__title">{{ show.title }}</h3>
      <p class="reminder__meta">
        <BaseIcon :name="scheduleContent.kinds[kind].icon" :size="13" />
        {{ scheduleContent.days[show.day].short }} · {{ scheduleContent.kinds[kind].title }} · {{ show.times[kind] }}
      </p>
    </div>
    <button type="button" class="reminder__remove" :aria-label="content.remove" @click="$emit('remove')">
      <BaseIcon name="close" :size="18" />
    </button>
  </li>
</template>

<style lang="scss">
.reminder {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;

  & + & {
    border-top: var(--border-hairline) solid var(--color-line);
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-family: var(--font-serif);
    font-size: var(--fs-lg);
    font-weight: 600;
    line-height: 1.15;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 2px;
    font-size: var(--fs-xs);
    color: var(--color-ink-muted);
  }

  &__remove {
    @include button-reset;
    @include press(0.88);
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--color-surface-muted);
    color: var(--color-ink-soft);
  }
}
</style>
