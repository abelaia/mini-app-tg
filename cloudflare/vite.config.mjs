import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import frontend from '../frontend/vite.config.js'

export default defineConfig(({ mode }) => ({
    ...frontend,
    root: fileURLToPath(new URL('.', import.meta.url)),
    publicDir: fileURLToPath(new URL('../frontend/public', import.meta.url)),
    base: '/',
    define: {
        'import.meta.env.VITE_APP_ENV': JSON.stringify(mode),
    },
    plugins: [...frontend.plugins, cloudflare()],
    server: {
        host: '127.0.0.1',
    },
}))
