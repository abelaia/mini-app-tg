<script setup>
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import BaseSheet from '@/shared/ui/BaseSheet.vue'
import { mod } from '@/shared/lib/text'
import { openLink } from '@/shared/telegram/telegram'
import content from '../content.json'

defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['close'])

const rules = content.rules
</script>

<template>
  <BaseSheet :open="open" :eyebrow="rules.eyebrow" :title="rules.title" @close="$emit('close')">
    <p class="rules__intro">{{ rules.intro }}</p>
    <section v-for="(section, s) in rules.sections" :key="section.title" :class="mod('rules__section', { [section.tone]: true })" :style="{ animationDelay: `${140 + s * 120}ms` }">
      <h3 class="rules__heading">
        <span class="rules__badge">
          <BaseIcon :name="section.icon" :size="14" :stroke="2.2" />
        </span>
        {{ section.title }}
      </h3>
      <ul class="rules__list">
        <li v-for="item in section.items" :key="item" class="rules__item">{{ item }}</li>
      </ul>
    </section>
    <div class="rules__note">
      <BaseIcon class="rules__note-icon" name="shield" :size="20" />
      <div>
        <p class="rules__outro">{{ rules.outro }}</p>
        <p class="rules__contact">{{ rules.contact }}</p>
      </div>
    </div>
    <template #footer>
      <div class="rules__actions">
        <BaseButton variant="ghost" icon="external" @click="openLink(rules.source.url)">{{ rules.source.title }}</BaseButton>
        <BaseButton class="rules__accept" @click="$emit('close')">{{ rules.accept }}</BaseButton>
      </div>
    </template>
  </BaseSheet>
</template>

<style lang="scss">
.rules {
  &__intro {
    font-size: var(--fs-sm);
    color: var(--color-ink-muted);
  }

  &__section {
    --rules-accent: var(--color-sage-deep);
    --rules-soft: var(--color-sage-soft);
    margin-top: var(--space-5);
    animation: rules-rise var(--duration-slow) var(--ease-out) both;

    &--deny {
      --rules-accent: var(--color-rose);
      --rules-soft: var(--color-rose-soft);
    }
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    font-family: var(--font-serif);
    font-size: var(--fs-xl);
    font-weight: 600;
  }

  &__badge {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--rules-soft);
    color: var(--rules-accent);
  }

  &__list {
    display: flex;
    flex-direction: column;
    padding: var(--space-1) var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-surface-muted);
  }

  &__item {
    position: relative;
    padding: var(--space-3) 0 var(--space-3) var(--space-5);
    font-size: var(--fs-sm);
    line-height: 1.4;

    & + & {
      border-top: var(--border-hairline) solid var(--color-line);
    }

    &::before {
      content: '';
      position: absolute;
      left: 2px;
      top: calc(var(--space-3) + 7px);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--rules-accent);
    }
  }

  &__note {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-5);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    border: var(--border-hairline) dashed var(--color-line);
    animation: rules-rise var(--duration-slow) var(--ease-out) 380ms both;
  }

  &__note-icon {
    color: var(--color-gold);
  }

  &__outro {
    font-size: var(--fs-sm);
    color: var(--color-ink-soft);
  }

  &__contact {
    margin-top: var(--space-2);
    font-size: var(--fs-sm);
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: var(--space-2);
  }

  &__accept {
    flex: 1;
  }
}

@keyframes rules-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
</style>
