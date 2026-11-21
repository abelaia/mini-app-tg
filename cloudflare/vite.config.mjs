import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import frontend from '../frontend/vite.config.js'

export default defineConfig({
    ...frontend,
    root: fileURLToPath(new URL('.', import.meta.url)),
    publicDir: fileURLToPath(new URL('../frontend/public', import.meta.url)),
    base: '/',
    plugins: [...frontend.plugins, cloudflare()],
    server: {
        host: '127.0.0.1',
    },
})
