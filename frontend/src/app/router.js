import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from '@/modules'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [...routes, { path: '/:pathMatch(.*)*', redirect: '/' }],
  scrollBehavior: () => ({ top: 0 }),
})
