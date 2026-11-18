import content from './content.json'
import { useAdminStore } from './store'

export default {
  name: 'admin',
  routes: [{ path: '/admin', name: 'admin', component: () => import('./pages/AdminPage.vue') }],
  nav: [{ to: '/admin', label: content.nav, icon: 'shield', order: 35, adminOnly: true }],
  init: () => undefined,
  store: useAdminStore,
}
