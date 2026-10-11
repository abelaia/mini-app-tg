import content from './content.json'

export default {
  name: 'about',
  routes: [{ path: '/about', name: 'about', component: () => import('./pages/AboutPage.vue') }],
  nav: [{ to: '/about', label: content.nav, icon: 'feather', order: 90 }],
}
