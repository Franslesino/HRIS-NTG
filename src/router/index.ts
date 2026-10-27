import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/kepegawaian' },
    { path: '/kepegawaian', component: () => import('@/views/EmployeeListView.vue') },
    { path: '/kepegawaian/tambah', component: () => import('@/views/EmployeeFormView.vue') },
    { path: '/kepegawaian/:id', component: () => import('@/views/EmployeeProfileView.vue'), props: true },
    { path: '/kepegawaian/:id/edit', component: () => import('@/views/EmployeeFormView.vue'), props: true },
    { path: '/:pathMatch(.*)*', redirect: '/kepegawaian' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
