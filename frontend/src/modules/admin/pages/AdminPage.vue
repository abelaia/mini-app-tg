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
import BaseField from '@/shared/ui/BaseField.vue'
import { useFormValidation } from '@/shared/composables/useFormValidation'
import { ICON_OPTIONS, validatePromo, validateSchedule } from '../validation'
import ArtworkEditor from '../components/ArtworkEditor.vue'


const session = useSessionStore()
const admin = useAdminStore()
const schedule = useScheduleStore()
const toast = useToast()
const router = useRouter()
const tab = ref('shows')
const showsForm = ref(null)
const promoForm = ref(null)
const imageUploads = ref(0)
const showsValidation = useFormValidation(() => ({ ...admin.fieldErrors, ...validateSchedule(admin.schedule) }))
const promoValidation = useFormValidation(() => ({ ...admin.fieldErrors, ...validatePromo(admin.promo) }))
watch(() => [admin.schedule, admin.promo], () => { admin.fieldErrors = {} }, { deep: true })
watch(tab, () => { admin.fieldErrors = {}; showsValidation.reset(); promoValidation.reset() })

async function saveSchedule() {
  if (imageUploads.value) return
  if (await showsValidation.check(showsForm.value)) {
    await admin.saveSchedule()
    if (Object.keys(admin.fieldErrors).length) await showsValidation.check(showsForm.value)
  }
}
async function savePromo() {
  if (await promoValidation.check(promoForm.value)) {
    await admin.savePromo()
    if (Object.keys(admin.fieldErrors).length) await promoValidation.check(promoForm.value)
  }
}
function removeShow(index) { admin.removeShow(index); showsValidation.reset() }

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

async function retryAdmin() {
  await session.start()
  if (session.isAdmin) await admin.load()
}
</script>

<template>
  <section class="admin">
    <SectionHeading :eyebrow="content.eyebrow" :title="content.title" :text="content.hint" />

    <EmptyState v-if="session.ready && !session.isAdmin" icon="shield" :title="content.denied.title" :text="content.denied.text">
      <BaseButton variant="ghost" @click="goHome">На «Сегодня»</BaseButton>
    </EmptyState>

    <EmptyState
      v-else-if="session.isAdmin && admin.status === 'error'"
      icon="shield"
      :title="content.offline.title"
      :text="content.offline.text"
    >
      <BaseButton icon="repeat" @click="retryAdmin">{{ content.offline.action }}</BaseButton>
    </EmptyState>

    <template v-else-if="session.isAdmin">
      <div class="admin__tabs">
        <button type="button" :disabled="admin.saving || imageUploads > 0" :class="['admin__tab', { 'admin__tab--on': tab === 'shows' }]" @click="tab = 'shows'">{{ content.tabs.shows }}</button>
        <button type="button" :disabled="admin.saving || imageUploads > 0" :class="['admin__tab', { 'admin__tab--on': tab === 'promo' }]" @click="tab = 'promo'">{{ content.tabs.promo }}</button>
      </div>

      <AsyncState :status="admin.status" @retry="admin.load">
        <form v-if="tab === 'shows' && admin.schedule" ref="showsForm" class="admin__panel" novalidate @submit.prevent="saveSchedule">
          <p v-if="showsValidation.error('shows')" class="field__help field__help--error" role="alert">{{ showsValidation.error('shows') }}</p>
          <fieldset v-for="(show, index) in admin.schedule.shows" :key="index" class="editor" :disabled="admin.saving" :aria-label="show.title || 'Новый сериал'">
            <header class="editor__head">
              <BaseField v-slot="{ attrs }" label="ID" :error="showsValidation.error(`shows.${index}.id`)" @blur="showsValidation.touch(`shows.${index}.id`)">
                <input v-bind="attrs" v-model="show.id" class="field__input" :placeholder="content.shows.idHint" required />
              </BaseField>
              <label class="switch">
                <input v-model="show.enabled" type="checkbox" />
                <span>{{ content.shows.fields.enabled }}</span>
              </label>
            </header>

            <div class="editor__grid">
              <BaseField v-slot="{ attrs }" :label="content.shows.fields.title" :error="showsValidation.error(`shows.${index}.title`)" @blur="showsValidation.touch(`shows.${index}.title`)">
                <input v-bind="attrs" v-model="show.title" class="field__input" required />
              </BaseField>
              <BaseField v-slot="{ attrs }" :label="content.shows.fields.translator" :error="showsValidation.error(`shows.${index}.translator`)" @blur="showsValidation.touch(`shows.${index}.translator`)">
                <input v-bind="attrs" v-model="show.translator" class="field__input" required />
              </BaseField>
              <BaseField v-slot="{ attrs }" :label="content.shows.fields.day" :error="showsValidation.error(`shows.${index}.day`)" @blur="showsValidation.touch(`shows.${index}.day`)">
                <select v-bind="attrs" v-model="show.day" class="field__input" required>
                  <option v-for="day in days" :key="day.id" :value="day.id">{{ day.label }}</option>
                </select>
              </BaseField>
              <BaseField v-slot="{ attrs }" :label="content.shows.fields.platform" :error="showsValidation.error(`shows.${index}.platform`)" @blur="showsValidation.touch(`shows.${index}.platform`)">
                <select v-bind="attrs" v-model="show.platform" class="field__input" required>
                  <option v-for="platform in platforms" :key="platform.id" :value="platform.id">{{ platform.title }}</option>
                </select>
              </BaseField>
              <BaseField v-slot="{ attrs }" :label="content.shows.fields.icon" :error="showsValidation.error(`shows.${index}.icon`)" @blur="showsValidation.touch(`shows.${index}.icon`)">
                <select v-bind="attrs" v-model="show.icon" class="field__input" required>
                  <option v-for="icon in ICON_OPTIONS" :key="icon" :value="icon">{{ icon }}</option>
                </select>
              </BaseField>
              <BaseField v-slot="{ attrs }" :label="content.shows.fields.repeat" :error="showsValidation.error(`shows.${index}.times.repeat`)" @blur="showsValidation.touch(`shows.${index}.times.repeat`)">
                <input v-bind="attrs" v-model="show.times.repeat" class="field__input" type="time" required />
              </BaseField>
              <BaseField v-slot="{ attrs }" :label="content.shows.fields.premiere" :error="showsValidation.error(`shows.${index}.times.premiere`)" @blur="showsValidation.touch(`shows.${index}.times.premiere`)">
                <input v-bind="attrs" v-model="show.times.premiere" class="field__input" type="time" required />
              </BaseField>
            </div>

            <ArtworkEditor v-model="show.artwork" @uploading="imageUploads += $event ? 1 : -1" />
            <p v-if="showsValidation.error(`shows.${index}.artwork`)" class="field__help field__help--error">{{ showsValidation.error(`shows.${index}.artwork`) }}</p>
            <BaseButton variant="ghost" size="sm" icon="close" :disabled="imageUploads > 0" @click="removeShow(index)">{{ content.shows.remove }}</BaseButton>
          </fieldset>

          <div class="admin__actions">
            <BaseButton variant="ghost" icon="sparkle" :disabled="admin.saving || imageUploads > 0" @click="admin.addShow">{{ content.shows.add }}</BaseButton>
            <BaseButton type="submit" icon="check" :disabled="admin.saving || imageUploads > 0">{{ content.shows.save }}</BaseButton>
          </div>
        </form>

        <form v-else-if="tab === 'promo' && admin.promo" ref="promoForm" class="admin__panel promo-edit" novalidate @submit.prevent="savePromo">
          <BaseField v-slot="{ attrs }" :label="content.promo.eyebrow" :error="promoValidation.error('eyebrow')" @blur="promoValidation.touch('eyebrow')">
            <input v-bind="attrs" v-model="admin.promo.eyebrow" class="field__input" :disabled="admin.saving" required />
          </BaseField>
          <BaseField v-slot="{ attrs }" :label="content.promo.text" :error="promoValidation.error('text')" @blur="promoValidation.touch('text')">
            <textarea v-bind="attrs" v-model="admin.promo.text" class="field__input field__input--area" rows="4" :disabled="admin.saving" required />
          </BaseField>
          <label class="switch">
            <input v-model="admin.promo.enabled" type="checkbox" :disabled="admin.saving" />
            <span>{{ content.promo.enabled }}</span>
          </label>
          <div class="admin__actions">
            <BaseButton type="submit" icon="check" :disabled="admin.saving">{{ content.promo.save }}</BaseButton>
          </div>
        </form>
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
  min-width: 0;
  margin: 0;
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
