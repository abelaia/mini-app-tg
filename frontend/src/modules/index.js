import about from './about'
import reminders from './reminders'
import schedule from './schedule'

export const modules = [schedule, reminders, about]

export const routes = modules.flatMap((module) => module.routes ?? [])

export const navigation = modules.flatMap((module) => module.nav ?? []).sort((a, b) => a.order - b.order)

export const initModules = () => Promise.allSettled(modules.map((module) => module.init?.()))
