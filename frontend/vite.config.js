import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    base: './',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@fontsource/cormorant-garamond': fileURLToPath(
                new URL('./node_modules/@fontsource/cormorant-garamond', import.meta.url),
            ),
            '@fontsource/manrope': fileURLToPath(
                new URL('./node_modules/@fontsource/manrope', import.meta.url),
            ),
            '@fontsource/great-vibes': fileURLToPath(
                new URL('./node_modules/@fontsource/great-vibes', import.meta.url),
            ),
        },
    },
    css: {
        preprocessorOptions: {
            scss: { additionalData: '@use "@/shared/styles/tools" as *;\n' },
        },
    },
    server: {
        host: true,
        proxy: { '/api': 'http://localhost:8080' },
    },
})
