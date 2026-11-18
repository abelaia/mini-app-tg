import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/500.css'
import '@fontsource/source-sans-3/600.css'
import '@fontsource/source-sans-3/700.css'
import '@fontsource/great-vibes/400.css'
import '@/shared/styles/global.scss'
import App from './app/App.vue'
import { router } from './app/router'

createApp(App).use(createPinia()).use(router).mount('#app')
