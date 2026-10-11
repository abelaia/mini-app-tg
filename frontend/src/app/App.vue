<script setup>
import { onMounted } from 'vue'
import { initModules, navigation } from '@/modules'
import { setupTelegram } from '@/shared/telegram/telegram'
import { useBackButton } from '@/shared/telegram/useBackButton'
import { useTelegramTheme } from '@/shared/telegram/useTelegramTheme'
import AppHeader from '@/shared/ui/AppHeader.vue'
import TabBar from '@/shared/ui/TabBar.vue'
import ToastHost from '@/shared/ui/ToastHost.vue'
import { startSession } from './session'

useTelegramTheme()
useBackButton()

onMounted(() => {
  setupTelegram()
  startSession()
  initModules()
})
</script>

<template>
  <div class="app">
    <AppHeader />
    <main class="app__main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <TabBar :items="navigation" />
    <ToastHost />
  </div>
</template>

<style lang="scss">
.app {
  min-height: var(--tg-viewport-stable-height, 100vh);

  &__main {
    max-width: 520px;
    margin: 0 auto;
    padding: var(--space-4) var(--gutter) calc(var(--safe-bottom) + var(--tabbar-height) + var(--space-8));
  }
}
</style>
