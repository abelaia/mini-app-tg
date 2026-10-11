import content from './content.json'
import { useRemindersStore } from './store'

export default {
  name: 'reminders',
  routes: [{ path: '/reminders', name: 'reminders', component: () => import('./pages/RemindersPage.vue') }],
  nav: [{ to: '/reminders', label: content.nav, icon: 'bell', order: 30, badge: () => useRemindersStore().count }],
  init: () => useRemindersStore().load(),
}
