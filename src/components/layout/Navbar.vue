<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, ChevronDown, ShieldCheck, LogOut, ArrowLeftRight } from 'lucide-vue-next';

const router = useRouter();

const userName = ref('Lucia Maria');
const userRoleLabel = ref('Building Admin');
const userRole = ref('admin');
const isDropdownOpen = ref(false);

const syncUser = () => {
  try {
    const raw = localStorage.getItem('bmis_user');
    if (raw) {
      const u = JSON.parse(raw);
      userName.value = u.name || 'Lucia Maria';
      userRoleLabel.value = u.roleLabel || 'Building Admin';
      userRole.value = u.role || 'admin';
    }
  } catch {
    // fallback
  }
};

onMounted(() => {
  syncUser();
});

const switchToAdmin = () => {
  isDropdownOpen.value = false;
  const newU = {
    username: 'admin_bmis',
    name: 'Lucia Maria',
    initials: 'LM',
    role: 'admin',
    roleLabel: 'Building Admin',
    superadmin: 1,
    id: 'usr-admin-1',
    nip: 'ADM.001',
    divisi: 'Manajemen Operasional',
  };
  localStorage.setItem('bmis_user', JSON.stringify(newU));
  syncUser();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bmis-role-changed'));
  }
  router.push('/presensi/admin');
};

const switchToEmployee = () => {
  isDropdownOpen.value = false;
  const newU = {
    username: 'asep_milo',
    name: 'Asep Milo',
    initials: 'AM',
    role: 'employee',
    roleLabel: 'Karyawan / Engineering',
    superadmin: 0,
    id: 'usr-employee-asep',
    nip: 'CS.50101',
    divisi: 'Engineering',
  };
  localStorage.setItem('bmis_user', JSON.stringify(newU));
  syncUser();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bmis-role-changed'));
  }
  router.push('/presensi/user');
};

const switchRole = () => {
  if (userRole.value === 'admin') {
    switchToEmployee();
  } else {
    switchToAdmin();
  }
};

const handleLogout = () => {
  isDropdownOpen.value = false;
  localStorage.removeItem('authenticated');
  localStorage.removeItem('bmis_user');
  router.push('/login');
};
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 relative z-30">
    <!-- Left breadcrumb / page indicator with 1-click Quick Mode Switcher -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
          <ShieldCheck :size="14" class="text-bmis-blue" />
          BMIS Presensi
        </span>
      </div>

      <!-- Quick Role Toggle Button Group -->
      <div class="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
        <button
          type="button"
          @click="switchToAdmin"
          :class="[
            'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer',
            userRole === 'admin'
              ? 'bg-[#547fff] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Mode Admin
        </button>
        <button
          type="button"
          @click="switchToEmployee"
          :class="[
            'px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer',
            userRole === 'employee'
              ? 'bg-[#547fff] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          Mode Pegawai (Asep Milo)
        </button>
      </div>
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-4">
      <!-- Notification Bells -->
      <button
        type="button"
        class="w-9 h-9 rounded-full border border-red-200 bg-red-50 text-red-500 flex items-center justify-center relative hover:bg-red-100 transition-colors cursor-pointer"
        title="Pemberitahuan Mendesak"
      >
        <Bell :size="16" />
        <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          2
        </span>
      </button>

      <button
        type="button"
        class="w-9 h-9 rounded-full border border-amber-200 bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors cursor-pointer"
        title="Peringatan Shift"
      >
        <Bell :size="16" />
      </button>

      <!-- User Profile Chip with Dropdown (Avatar Biru) -->
      <div class="relative">
        <button
          type="button"
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-3 pl-2 pr-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <div class="w-8 h-8 rounded-full bg-bmis-blue text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {{ userName.split(' ').map(n => n[0]).join('').substring(0, 2) }}
          </div>
          <div class="flex flex-col text-left">
            <span class="text-xs font-bold text-slate-800 leading-tight">{{ userName }}</span>
            <span class="text-[10px] text-slate-500">{{ userRoleLabel }}</span>
          </div>
          <ChevronDown :size="14" class="text-slate-400" />
        </button>

        <!-- Profile Menu Dropdown -->
        <div
          v-if="isDropdownOpen"
          class="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs"
        >
          <div class="px-3.5 py-2 border-b border-slate-100">
            <span class="text-[11px] text-slate-400 block font-semibold">Login sebagai</span>
            <span class="font-bold text-slate-800 block text-xs truncate">{{ userName }}</span>
          </div>

          <button
            type="button"
            @click="switchRole"
            class="w-full text-left px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeftRight :size="14" class="text-bmis-blue" />
            <span>Ganti ke Role {{ userRole === 'admin' ? 'Pegawai' : 'Admin' }}</span>
          </button>

          <button
            type="button"
            @click="handleLogout"
            class="w-full text-left px-3.5 py-2.5 text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold border-t border-slate-100 transition-colors cursor-pointer"
          >
            <LogOut :size="14" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
