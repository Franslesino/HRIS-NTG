import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/profil-saya' },
    { path: '/profil-saya', component: () => import('@/views/MyProfileView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/profil-saya' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
