<script setup>
import { computed, ref } from 'vue'
import BaseIcon from '@/shared/ui/BaseIcon.vue'
import BrandMonogram from '@/shared/ui/BrandMonogram.vue'
import SectionHeading from '@/shared/ui/SectionHeading.vue'
import { haptic, openLink } from '@/shared/telegram/telegram'
import { useScheduleStore } from '@/modules/schedule/store'
import scheduleContent from '@/modules/schedule/content.json'
import LinkRow from '../components/LinkRow.vue'
import RulesSheet from '../components/RulesSheet.vue'
import content from '../content.json'

const schedule = useScheduleStore()
const activeSheet = ref('')

const platforms = computed(() =>
  Object.entries(schedule.platforms).map(([id, platform]) => ({
    id,
    ...platform,
    shows: schedule.shows.filter((show) => show.platform === id),
  })),
)

function open(url) {
  haptic.tap()
  openLink(url)
}
</script>

<template>
  <section class="about">
    <div class="about__hero">
      <BrandMonogram :size="84" />
      <h2 class="about__name">{{ content.hero.name }}</h2>
      <p class="about__tagline">{{ content.hero.tagline }}</p>
      <p class="about__text">{{ content.hero.text }}</p>
    </div>
    <div v-if="platforms.length" class="about__block">
      <SectionHeading :title="content.platformsTitle" />
      <ul class="about__platforms">
        <li v-for="platform in platforms" :key="platform.id">
          <button type="button" class="platform" @click="open(platform.url)">
            <span class="platform__head">
              <span class="platform__title">{{ platform.title }}</span>
              <BaseIcon class="platform__icon" name="external" :size="16" />
            </span>
            <span v-for="show in platform.shows" :key="show.id" class="platform__show">
              <span class="platform__day">{{ scheduleContent.days[show.day].short }}</span>
              {{ show.title }}
            </span>
          </button>
        </li>
      </ul>
    </div>
    <div class="about__block">
      <SectionHeading :title="content.linksTitle" />
      <ul class="about__links">
        <LinkRow v-for="link in content.links" :key="link.title" v-bind="link" @select="activeSheet = $event" />
      </ul>
    </div>
    <footer class="about__footer">
      <p>{{ content.footer.ads }}</p>
      <button type="button" class="about__registry" @click="open(content.footer.registry.url)">{{ content.footer.registry.title }}</button>
      <p>{{ content.footer.copyright }}</p>
    </footer>
    <RulesSheet :open="activeSheet === 'rules'" @close="activeSheet = ''" />
  </section>
</template>

<style lang="scss">
.about {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);

  &__hero {
    @include card;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-7) var(--space-5) var(--space-6);
    text-align: center;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0 0 auto;
      height: 96px;
      background: linear-gradient(180deg, var(--color-sage-soft), transparent);
    }

    > * {
      position: relative;
    }
  }

  &__name {
    margin-top: var(--space-4);
    font-family: var(--font-serif);
    font-size: var(--fs-xxl);
    font-weight: 600;
    line-height: 1;
  }

  &__tagline {
    margin-top: var(--space-1);
    font-family: var(--font-script);
    font-size: var(--fs-xl);
    color: var(--color-rose);
  }

  &__text {
    max-width: 320px;
    margin-top: var(--space-3);
    font-size: var(--fs-sm);
    color: var(--color-ink-soft);
  }

  &__block {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    .heading__title {
      font-size: var(--fs-xl);
    }
  }

  &__platforms {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  &__links {
    @include card;
    padding: var(--space-1) var(--space-4);

    li + li {
      border-top: var(--border-hairline) solid var(--color-line);
    }
  }

  &__footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding-bottom: var(--space-4);
    font-size: var(--fs-xs);
    color: var(--color-ink-muted);
    text-align: center;
  }

  &__registry {
    @include button-reset;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
}

.platform {
  @include button-reset;
  @include card;
  @include press(0.97);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  height: 100%;
  padding: var(--space-4);
  text-align: left;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-1);
  }

  &__title {
    font-family: var(--font-serif);
    font-size: var(--fs-xl);
    font-weight: 600;
    line-height: 1;
  }

  &__icon {
    color: var(--color-ink-muted);
  }

  &__show {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    font-size: var(--fs-xs);
    line-height: 1.3;
    color: var(--color-ink-soft);
  }

  &__day {
    @include eyebrow;
    font-size: var(--fs-xxs);
    color: var(--color-sage);
    flex-shrink: 0;
    width: 18px;
  }
}
</style>
