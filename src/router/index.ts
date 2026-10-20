import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/login/Login.vue'),
  },
  {
    path: '/',
    redirect: () => {
      const auth = localStorage.getItem('authenticated') === 'true';
      if (!auth) return '/login';
      try {
        const u = JSON.parse(localStorage.getItem('bmis_user') || '{}');
        return u.role === 'employee' || u.role === 'user' ? '/presensi/user' : '/dashboard';
      } catch {
        return '/dashboard';
      }
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/dashboard/Dashboard.vue'),
    meta: { requiresAdmin: true },
  },
  // Modul Presensi
  {
    path: '/presensi/user',
    name: 'UserPresensi',
    component: () => import('../pages/attendance/UserPresensi.vue'),
  },
  {
    path: '/presensi/admin',
    name: 'AdminPresensi',
    component: () => import('../pages/attendance/AdminPresensi.vue'),
    meta: { requiresAdmin: true },
  },
  // Modul Roster
  {
    path: '/roster/tim',
    name: 'RotasiJadwal',
    component: () => import('../pages/roster/RotasiJadwal.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/roster/admin',
    name: 'AdminRoster',
    component: () => import('../pages/roster/AdminRoster.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/roster/tambah',
    name: 'TambahJadwal',
    component: () => import('../pages/roster/TambahJadwal.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/roster/user',
    name: 'UserRoster',
    component: () => import('../pages/roster/UserRoster.vue'),
  },
  // Modul Cuti
  {
    path: '/cuti',
    name: 'UserCuti',
    component: () => import('../pages/cuti/UserCuti.vue'),
  },
  {
    path: '/cuti/admin',
    name: 'AdminCuti',
    component: () => import('../pages/cuti/AdminCuti.vue'),
    meta: { requiresAdmin: true },
  },
  // Modul Lembur
  {
    path: '/lembur',
    name: 'Overtime',
    component: () => import('../pages/overtime/Overtime.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const isAuthenticated = localStorage.getItem('authenticated') === 'true';

  if (to.path !== '/login' && !isAuthenticated) {
    return next('/login');
  }

  if (to.path === '/login' && isAuthenticated) {
    try {
      const u = JSON.parse(localStorage.getItem('bmis_user') || '{}');
      return next(u.role === 'employee' || u.role === 'user' ? '/presensi/user' : '/dashboard');
    } catch {
      return next('/dashboard');
    }
  }

  if (to.meta.requiresAdmin) {
    try {
      const raw = localStorage.getItem('bmis_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.role === 'employee' || u.role === 'user') {
          return next('/presensi/user');
        }
      } else {
        return next('/login');
      }
    } catch {
      return next('/login');
    }
  }

  next();
});

export default router;
