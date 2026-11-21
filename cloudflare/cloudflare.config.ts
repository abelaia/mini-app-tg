import { bindings, defineConfig, triggers } from 'cf/config'

export default defineConfig(({ mode }) => {
    const production = mode === 'production'
    const name = production ? 'turkdizi-staging' : 'turkdizi-preview'

    return {
        accountId: '98e33c9871ec96f44663107d50d8abf3',
        worker: {
            name,
            entrypoint: './src/index.mjs',
            compatibilityDate: '2026-11-21',
            env: {
                DB: bindings.d1({
                    name,
                    id: production
                        ? 'fa0d59c1-0a8b-4371-8bb7-f8a6b69f2731'
                        : 'b4b04659-0059-4cbd-9b17-cf83cc62d3cb',
                }),
                ...(production ? { BOT_TOKEN: bindings.secret() } : {}),
                ADMIN_IDS: bindings.text('6313177223,1042683920'),
                ASSETS: bindings.assets(),
                ...(production
                    ? {
                          DELIVERIES: bindings.queue({ name: 'turkdizi-staging-deliveries' }),
                      }
                    : {}),
                REMINDERS_ENABLED: bindings.text(production ? 'true' : 'false'),
                WEBAPP_URL: bindings.text(`https://${name}.turkdizi-online.workers.dev`),
            },
            triggers: production
                ? [
                      triggers.scheduled({ schedule: '* * * * *' }),
                      triggers.queue({
                          name: 'turkdizi-staging-deliveries',
                          maxBatchSize: 10,
                          maxBatchTimeout: 1,
                          maxConcurrency: 1,
                          maxRetries: 5,
                          retryDelay: 60,
                      }),
                  ]
                : [],
            assets: {
                notFoundHandling: 'single-page-application',
                runWorkerFirst: ['/api/*'],
            },
            observability: {
                enabled: true,
                traces: {
                    enabled: true,
                },
            },
        },
    }
})
