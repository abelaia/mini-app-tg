import { useSessionStore } from './sessionStore'

export const startSession = () => useSessionStore().start()
