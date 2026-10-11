import content from './content.json'
import { useScheduleStore } from './store'

export default {
  name: 'schedule',
  routes: [
    { path: '/', name: 'today', component: () => import('./pages/TodayPage.vue') },
    { path: '/week', name: 'week', component: () => import('./pages/WeekPage.vue') },
  ],
  nav: [
    { to: '/', label: content.nav.today, icon: 'sun', order: 10 },
    { to: '/week', label: content.nav.week, icon: 'calendar', order: 20 },
  ],
  init: () => useScheduleStore().load(),
}
