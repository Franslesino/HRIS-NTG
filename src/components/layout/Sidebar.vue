<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Briefcase,
  Users,
  CalendarPlus,
  CalendarCheck,
  FileCheck2,
  ChevronDown,
  UserCheck
} from 'lucide-vue-next';

const route = useRoute();
const isRosterOpen = ref(true);
const isAttendanceOpen = ref(true);

const currentRole = ref('admin');

const loadRole = () => {
  try {
    const raw = localStorage.getItem('bmis_user');
    if (raw) {
      const u = JSON.parse(raw);
      currentRole.value = u.role || 'admin';
    }
  } catch {
    currentRole.value = 'admin';
  }
};

loadRole();
watch(() => route.fullPath, () => {
  loadRole();
});

if (typeof window !== 'undefined') {
  window.addEventListener('bmis-role-changed', loadRole);
  window.addEventListener('storage', loadRole);
}

const isSuperAdmin = computed(() => currentRole.value === 'admin');
const isActive = (path: string) => route.path === path;
const isSubActive = (prefix: string) => route.path.startsWith(prefix);
</script>

<template>
  <aside class="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 min-h-screen">
    <!-- Brand Logo (Persis Sidebar.vue BMIS) -->
    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-center">
      <router-link :to="isSuperAdmin ? '/presensi/admin' : '/presensi/user'" class="flex items-center justify-center">
        <img
          src="/images/logo-bmis.webp"
          alt="Logo BMIS"
          class="h-10 w-auto object-contain"
        />
      </router-link>
    </div>

    <!-- Nav List -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <!-- Dashboard (Khusus Admin) -->
      <router-link
        v-if="isSuperAdmin"
        to="/dashboard"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
          isActive('/dashboard')
            ? 'bg-blue-50 text-bmis-blue font-bold shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-bmis-blue'
        ]"
      >
        <LayoutDashboard :size="18" />
        <span>Dashboard</span>
      </router-link>

      <!-- Kehadiran & Presensi (Admin: Accordion Dropdown) -->
      <div v-if="isSuperAdmin">
        <button
          type="button"
          @click="isAttendanceOpen = !isAttendanceOpen"
          :class="[
            'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
            isSubActive('/presensi')
              ? 'text-bmis-blue font-bold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-bmis-blue'
          ]"
        >
          <div class="flex items-center gap-3">
            <Clock :size="18" />
            <span>Kehadiran & Presensi</span>
          </div>
          <ChevronDown
            :size="16"
            :class="['transition-transform duration-200', isAttendanceOpen ? 'rotate-180' : '']"
          />
        </button>

        <div v-show="isAttendanceOpen" class="pl-9 pr-2 py-1 space-y-1">
          <router-link
            to="/presensi/admin"
            :class="[
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              isActive('/presensi/admin')
                ? 'bg-blue-50 text-bmis-blue font-bold'
                : 'text-slate-500 hover:text-bmis-blue hover:bg-slate-50'
            ]"
          >
            <Clock :size="14" />
            <span>Monitoring Kehadiran</span>
          </router-link>
          <router-link
            to="/presensi/user"
            :class="[
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              isActive('/presensi/user')
                ? 'bg-blue-50 text-bmis-blue font-bold'
                : 'text-slate-500 hover:text-bmis-blue hover:bg-slate-50'
            ]"
          >
            <UserCheck :size="14" />
            <span>Presensi Mandiri</span>
          </router-link>
        </div>
      </div>

      <!-- Kehadiran & Presensi (Pegawai: Menu Tunggal Tanpa Dropdown) -->
      <router-link
        v-else
        to="/presensi/user"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
          isActive('/presensi/user')
            ? 'bg-blue-50 text-bmis-blue font-bold shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-bmis-blue'
        ]"
      >
        <Clock :size="18" />
        <span>Kehadiran & Presensi</span>
      </router-link>

      <!-- Cuti (Admin vs Karyawan) -->
      <router-link
        :to="isSuperAdmin ? '/cuti/admin' : '/cuti'"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
          isSubActive('/cuti')
            ? 'bg-blue-50 text-bmis-blue font-bold shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-bmis-blue'
        ]"
      >
        <CalendarCheck :size="18" />
        <span>Cuti</span>
      </router-link>

      <!-- Roster Section (Admin vs Karyawan) -->
      <div v-if="isSuperAdmin">
        <button
          type="button"
          @click="isRosterOpen = !isRosterOpen"
          :class="[
            'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
            isSubActive('/roster')
              ? 'text-bmis-blue font-bold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-bmis-blue'
          ]"
        >
          <div class="flex items-center gap-3">
            <CalendarDays :size="18" />
            <span>Roster</span>
          </div>
          <ChevronDown
            :size="16"
            :class="['transition-transform duration-200', isRosterOpen ? 'rotate-180' : '']"
          />
        </button>

        <div v-show="isRosterOpen" class="pl-9 pr-2 py-1 space-y-1">
          <router-link
            to="/roster/tim"
            :class="[
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              isActive('/roster/tim')
                ? 'bg-blue-50 text-bmis-blue font-bold'
                : 'text-slate-500 hover:text-bmis-blue hover:bg-slate-50'
            ]"
          >
            <Users :size="14" />
            <span>Rotasi & Tim Kerja</span>
          </router-link>
          <router-link
            to="/roster/admin"
            :class="[
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              isActive('/roster/admin')
                ? 'bg-blue-50 text-bmis-blue font-bold'
                : 'text-slate-500 hover:text-bmis-blue hover:bg-slate-50'
            ]"
          >
            <CalendarDays :size="14" />
            <span>Data Roster Karyawan</span>
          </router-link>
          <router-link
            to="/roster/tambah"
            :class="[
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              isActive('/roster/tambah')
                ? 'bg-blue-50 text-bmis-blue font-bold'
                : 'text-slate-500 hover:text-bmis-blue hover:bg-slate-50'
            ]"
          >
            <CalendarPlus :size="14" />
            <span>+ Tambah Jadwal Shift</span>
          </router-link>
          <router-link
            to="/roster/user"
            :class="[
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              isActive('/roster/user')
                ? 'bg-blue-50 text-bmis-blue font-bold'
                : 'text-slate-500 hover:text-bmis-blue hover:bg-slate-50'
            ]"
          >
            <Briefcase :size="14" />
            <span>Jadwal Roster Saya</span>
          </router-link>
        </div>
      </div>

      <!-- Jika Role Pegawai: Hanya Jadwal Roster Saya (BIRU saat aktif) -->
      <router-link
        v-else
        to="/roster/user"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
          isActive('/roster/user')
            ? 'bg-blue-50 text-bmis-blue font-bold shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-bmis-blue'
        ]"
      >
        <CalendarDays :size="18" />
        <span>Jadwal Roster</span>
      </router-link>

      <!-- Lembur / SPKL (BIRU saat aktif) -->
      <router-link
        to="/lembur"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
          isActive('/lembur')
            ? 'bg-blue-50 text-bmis-blue font-bold shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-bmis-blue'
        ]"
      >
        <FileCheck2 :size="18" />
        <span>Manajemen Lembur</span>
      </router-link>
    </nav>

    <!-- Footer Sidebar -->
    <div class="p-4 border-t border-slate-100 bg-slate-50/50">
      <div class="flex items-center justify-between text-[11px] text-slate-500">
        <span>Akses: {{ isSuperAdmin ? 'Admin / HR' : 'Karyawan' }}</span>
        <span class="inline-flex items-center gap-1 text-emerald-600 font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Aktif
        </span>
      </div>
    </div>
  </aside>
</template>
