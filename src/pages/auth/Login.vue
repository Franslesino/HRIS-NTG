<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../../composables/useAuth';
import type { UserAccount } from '../../types/auth';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  HardHat
} from 'lucide-vue-next';

const router = useRouter();
const { login, loginAs, mockUsers } = useAuth();

// Default form value
const identifier = ref('admin@bmis.id');
const password = ref('admin123');
const showPassword = ref(false);
const errorMessage = ref('');

// Filter khusus 2 akun demo utama sesuai instruksi user
const adminUser = mockUsers.find(u => u.role === 'admin') || mockUsers[0];
const employeeUser = mockUsers.find(u => u.nama.includes('Asep')) || mockUsers[1];

const handleLogin = () => {
  errorMessage.value = '';
  if (!identifier.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Silakan isi Username/NIP dan kata sandi.';
    return;
  }

  const res = login(identifier.value, password.value);
  if (res.success && res.user) {
    if (res.user.role === 'admin') {
      router.push('/presensi/admin');
    } else {
      router.push('/presensi/user');
    }
  } else {
    errorMessage.value = res.message || 'Login gagal. Periksa kembali NIP dan password.';
  }
};

const handleQuickLogin = (user: UserAccount) => {
  loginAs(user);
  if (user.role === 'admin') {
    router.push('/presensi/admin');
  } else {
    router.push('/presensi/user');
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#f3f6f9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-800">
    <!-- Header Brand Logo -->
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
      <div class="inline-flex flex-col items-center justify-center">
        <!-- Logo BMIS Identik -->
        <div class="flex items-center gap-1.5 mb-1">
          <span class="text-4xl font-black text-[#00a389] tracking-tight leading-none">bmis</span>
          <span class="w-3 h-3 rounded-full bg-[#3abf94] mb-2.5"></span>
        </div>
        <span class="text-[11px] font-bold tracking-widest text-[#00a389] uppercase">
          by binayasa operasional
        </span>
      </div>
      <h2 class="text-lg font-bold text-slate-700 mt-3">
        Sistem Manajemen &amp; Monitoring Presensi Gedung
      </h2>
      <p class="text-xs text-slate-500 mt-0.5">
        Multi-Role Access Control (Building Admin &bull; Pegawai Operasional)
      </p>
    </div>

    <!-- Card Login di Tengah Layar -->
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200/80">
        <!-- Form Login Utama -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- 1. Username / NIP -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username atau NIP
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User :size="16" />
              </div>
              <input
                v-model="identifier"
                type="text"
                required
                placeholder="Contoh: ADM.001 / CS.50101 / admin@bmis.id"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00a389] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- 2. Password with Toggle -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kata Sandi
              </label>
              <span class="text-[11px] text-slate-400">Demo: admin123 / user123</span>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock :size="16" />
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00a389] focus:border-transparent transition-all"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title="Tampilkan / Sembunyikan Password"
              >
                <EyeOff v-if="showPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <!-- Alert Error -->
          <div
            v-if="errorMessage"
            class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in duration-150"
          >
            <AlertCircle :size="15" class="flex-shrink-0 text-red-600" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Tombol Masuk Bertema BMIS Teal (#00a389 / #3abf94) -->
          <button
            type="submit"
            class="w-full py-2.5 px-4 rounded-xl bg-[#00a389] hover:bg-[#008f77] text-white font-bold text-xs shadow-md shadow-teal-700/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Masuk ke Sistem</span>
            <ArrowRight :size="15" />
          </button>
        </form>

        <!-- Divider Pintasan Akun Demo -->
        <div class="my-6 relative flex items-center justify-center">
          <div class="border-t border-slate-200 w-full"></div>
          <span class="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute">
            Atau Akun Demo Cepat (1-Klik)
          </span>
        </div>

        <!-- 2 Pilihan Akun Demo Sesuai Permintaan User -->
        <div class="space-y-2.5">
          <!-- a) Akun Admin: Lucia Maria (Building Admin / HR) -->
          <button
            type="button"
            @click="handleQuickLogin(adminUser)"
            class="w-full text-left p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 hover:border-[#00a389] transition-all group flex items-center justify-between cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#00a389] text-white flex items-center justify-center font-black text-xs shadow-xs">
                LM
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-slate-800 group-hover:text-[#00a389] transition-colors">
                    Lucia Maria
                  </span>
                  <span class="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#00a389] text-white uppercase tracking-wider">
                    ADMIN
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Briefcase :size="11" class="text-slate-400" />
                  <span>Building Admin / HR &bull; NIP: ADM.001</span>
                </div>
              </div>
            </div>
            <div class="text-[#00a389] group-hover:translate-x-1 transition-transform">
              <ArrowRight :size="16" />
            </div>
          </button>

          <!-- b) Akun Pegawai: Asep Milo (Pegawai Operasional / Engineering) -->
          <button
            type="button"
            @click="handleQuickLogin(employeeUser)"
            class="w-full text-left p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-sky-50/80 hover:border-[#0084c4] transition-all group flex items-center justify-between cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-xs shadow-xs">
                AM
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-slate-800 group-hover:text-[#0084c4] transition-colors">
                    Asep Milo
                  </span>
                  <span class="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-700 text-white uppercase tracking-wider">
                    PEGAWAI
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <HardHat :size="11" class="text-slate-400" />
                  <span>Pegawai Operasional (Engineering) &bull; NIP: CS.50101</span>
                </div>
              </div>
            </div>
            <div class="text-slate-500 group-hover:text-[#0084c4] group-hover:translate-x-1 transition-all">
              <ArrowRight :size="16" />
            </div>
          </button>
        </div>

        <!-- Footer Info -->
        <div class="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          <span>BMIS Standalone Application &bull; Role-Based Access Control</span>
        </div>
      </div>
    </div>
  </div>
</template>
