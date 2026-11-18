<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AsyncState from '@/shared/ui/AsyncState.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import SectionHeading from '@/shared/ui/SectionHeading.vue'
import { useSessionStore } from '@/app/sessionStore'
import { useScheduleStore } from '@/modules/schedule/store'
import scheduleContent from '@/modules/schedule/content.json'
import { useToast } from '@/shared/composables/useToast'
import content from '../content.json'
import { useAdminStore } from '../store'

const ICON_OPTIONS = ['city', 'mosque', 'layers', 'flame', 'wave', 'rose', 'sparkle', 'sun']

const session = useSessionStore()
const admin = useAdminStore()
const schedule = useScheduleStore()
const toast = useToast()
const router = useRouter()
const tab = ref('shows')

const days = computed(() => Object.entries(scheduleContent.days).map(([id, day]) => ({ id, label: day.full })))
const platforms = computed(() => Object.entries(admin.schedule?.platforms ?? {}).map(([id, platform]) => ({ id, title: platform.title })))

watch(
  () => admin.message,
  (value) => {
    if (value === 'schedule') {
      toast.show(content.shows.saved)
      schedule.load()
    }
    if (value === 'promo') {
      toast.show(content.promo.saved)
      schedule.load()
    }
    if (value === 'error') toast.show(content.error, { tone: 'error' })
  },
)

onMounted(async () => {
  if (!session.ready) await session.start()
  if (!session.isAdmin) return
  admin.load()
})

function goHome() {
  router.push('/')
}
</script>

<template>
  <section class="admin">
    <SectionHeading :eyebrow="content.eyebrow" :title="content.title" :text="content.hint" />

    <EmptyState v-if="session.ready && !session.isAdmin" icon="shield" :title="content.denied.title" :text="content.denied.text">
      <BaseButton variant="ghost" @click="goHome">На «Сегодня»</BaseButton>
    </EmptyState>

    <template v-else-if="session.isAdmin">
      <div class="admin__tabs">
        <button type="button" :class="['admin__tab', { 'admin__tab--on': tab === 'shows' }]" @click="tab = 'shows'">{{ content.tabs.shows }}</button>
        <button type="button" :class="['admin__tab', { 'admin__tab--on': tab === 'promo' }]" @click="tab = 'promo'">{{ content.tabs.promo }}</button>
      </div>

      <AsyncState :status="admin.status" @retry="admin.load">
        <div v-if="tab === 'shows' && admin.schedule" class="admin__panel">
          <article v-for="(show, index) in admin.schedule.shows" :key="`${show.id}-${index}`" class="editor">
            <header class="editor__head">
              <label class="field">
                <span class="field__label">ID</span>
                <input v-model="show.id" class="field__input" :placeholder="content.shows.idHint" />
              </label>
              <label class="switch">
                <input v-model="show.enabled" type="checkbox" />
                <span>{{ content.shows.fields.enabled }}</span>
              </label>
            </header>

            <div class="editor__grid">
              <label class="field">
                <span class="field__label">{{ content.shows.fields.title }}</span>
                <input v-model="show.title" class="field__input" />
              </label>
              <label class="field">
                <span class="field__label">{{ content.shows.fields.translator }}</span>
                <input v-model="show.translator" class="field__input" />
              </label>
              <label class="field">
                <span class="field__label">{{ content.shows.fields.day }}</span>
                <select v-model="show.day" class="field__input">
                  <option v-for="day in days" :key="day.id" :value="day.id">{{ day.label }}</option>
                </select>
              </label>
              <label class="field">
                <span class="field__label">{{ content.shows.fields.platform }}</span>
                <select v-model="show.platform" class="field__input">
                  <option v-for="platform in platforms" :key="platform.id" :value="platform.id">{{ platform.title }}</option>
                </select>
              </label>
              <label class="field">
                <span class="field__label">{{ content.shows.fields.icon }}</span>
                <select v-model="show.icon" class="field__input">
                  <option v-for="icon in ICON_OPTIONS" :key="icon" :value="icon">{{ icon }}</option>
                </select>
              </label>
              <label class="field">
                <span class="field__label">{{ content.shows.fields.repeat }}</span>
                <input v-model="show.times.repeat" class="field__input" type="time" />
              </label>
              <label class="field">
                <span class="field__label">{{ content.shows.fields.premiere }}</span>
                <input v-model="show.times.premiere" class="field__input" type="time" />
              </label>
            </div>

            <BaseButton variant="ghost" size="sm" icon="close" @click="admin.removeShow(index)">{{ content.shows.remove }}</BaseButton>
          </article>

          <div class="admin__actions">
            <BaseButton variant="ghost" icon="sparkle" @click="admin.addShow">{{ content.shows.add }}</BaseButton>
            <BaseButton icon="check" :disabled="admin.saving" @click="admin.saveSchedule">{{ content.shows.save }}</BaseButton>
          </div>
        </div>

        <div v-else-if="tab === 'promo' && admin.promo" class="admin__panel promo-edit">
          <label class="field">
            <span class="field__label">{{ content.promo.eyebrow }}</span>
            <input v-model="admin.promo.eyebrow" class="field__input" />
          </label>
          <label class="field">
            <span class="field__label">{{ content.promo.text }}</span>
            <textarea v-model="admin.promo.text" class="field__input field__input--area" rows="4" />
          </label>
          <label class="switch">
            <input v-model="admin.promo.enabled" type="checkbox" />
            <span>{{ content.promo.enabled }}</span>
          </label>
          <div class="admin__actions">
            <BaseButton icon="check" :disabled="admin.saving" @click="admin.savePromo">{{ content.promo.save }}</BaseButton>
          </div>
        </div>
      </AsyncState>
    </template>
  </section>
</template>

<style lang="scss">
.admin {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
    padding: var(--space-1);
    border-radius: var(--radius-lg);
    background: var(--color-surface-muted);
  }

  &__tab {
    @include button-reset;
    @include press(0.97);
    height: 42px;
    border-radius: var(--radius-md);
    font-size: var(--fs-sm);
    font-weight: 700;
    color: var(--color-ink-muted);

    &--on {
      background: var(--color-surface);
      color: var(--color-ink);
      box-shadow: 0 8px 18px -14px var(--color-shadow);
    }
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    justify-content: flex-end;
  }
}

.editor {
  @include card;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);

  &__head {
    display: flex;
    align-items: end;
    gap: var(--space-3);
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  &__label {
    @include eyebrow;
    color: var(--color-ink-muted);
  }

  &__input {
    width: 100%;
    min-height: 44px;
    padding: 0 var(--space-3);
    border: var(--border-hairline) solid var(--color-line);
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);
    color: var(--color-ink);
    font: inherit;

    &--area {
      min-height: 110px;
      padding: var(--space-3);
      resize: vertical;
    }
  }
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 2px;
  font-size: var(--fs-sm);
  font-weight: 600;
  white-space: nowrap;
}

.promo-edit {
  @include card;
  padding: var(--space-4);
}

@media (max-width: 420px) {
  .editor__grid {
    grid-template-columns: 1fr;
  }

  .editor__head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
