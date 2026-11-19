<script setup>
    import { computed, onMounted } from 'vue'
    import { initModules, navigationFor } from '@/modules'
    import { setupTelegram } from '@/shared/telegram/telegram'
    import { useBackButton } from '@/shared/telegram/useBackButton'
    import { useTelegramTheme } from '@/shared/telegram/useTelegramTheme'
    import AppHeader from '@/shared/ui/AppHeader.vue'
    import AppBackground from '@/shared/ui/AppBackground.vue'
    import TabBar from '@/shared/ui/TabBar.vue'
    import ToastHost from '@/shared/ui/ToastHost.vue'
    import { useSessionStore } from './sessionStore'
    import { startSession } from './session'

    useTelegramTheme()
    useBackButton()

    const session = useSessionStore()
    // В локальном Vite админ-вкладка всегда в таббаре; в проде — только при isAdmin.
    const navigation = computed(() => navigationFor(session.isAdmin || import.meta.env.DEV))

    onMounted(() => {
        setupTelegram()
        startSession()
        initModules()
    })
</script>

<template>
    <div class="app">
        <AppBackground />
        <AppHeader />
        <main class="app__main">
            <RouterView v-slot="{ Component }">
                <Transition
                    name="page"
                    mode="out-in"
                >
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
        isolation: isolate;
        min-height: var(--tg-viewport-stable-height, 100vh);

        &__main {
            max-width: 520px;
            margin: 0 auto;
            padding: var(--space-4) var(--gutter)
                calc(var(--safe-bottom) + var(--tabbar-height) + var(--space-8));
        }
    }
</style>
