import about from './about'
import admin from './admin'
import reminders from './reminders'
import schedule from './schedule'

export const modules = [schedule, reminders, admin, about]

export const routes = modules.flatMap((module) => module.routes ?? [])

export const allNavigation = modules.flatMap((module) => module.nav ?? []).sort((a, b) => a.order - b.order)

export const navigationFor = (isAdmin = false) =>
  allNavigation.filter((item) => !item.adminOnly || isAdmin || import.meta.env.DEV)

export const navigation = allNavigation.filter((item) => !item.adminOnly)

export const initModules = () => Promise.allSettled(modules.map((module) => module.init?.()))
