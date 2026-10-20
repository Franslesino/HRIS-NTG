<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Eye, EyeOff } from 'lucide-vue-next';

const router = useRouter();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loadingSubmit = ref(false);
const errorMessage = ref('');
const currentYear = new Date().getFullYear();

const fillDemoAccount = (role: 'admin' | 'employee') => {
  errorMessage.value = '';
  if (role === 'admin') {
    username.value = 'admin_bmis';
    password.value = 'admin123';
  } else {
    username.value = 'asep_milo';
    password.value = 'pegawai123';
  }
};

const handleLogin = () => {
  errorMessage.value = '';

  if (!username.value || username.value.trim().length < 4) {
    errorMessage.value = 'Username wajib diisi (minimal 4 karakter).';
    return;
  }
  if (!password.value || password.value.length < 6) {
    errorMessage.value = 'Password wajib diisi (minimal 6 karakter).';
    return;
  }

  loadingSubmit.value = true;

  setTimeout(() => {
    loadingSubmit.value = false;
    const uname = username.value.trim().toLowerCase();

    // Penentuan Role berdasarkan akun login
    const isEmployee = uname.includes('pegawai') || uname.includes('user') || uname.includes('asep') || uname.includes('ahmad');
    const role = isEmployee ? 'employee' : 'admin';

    const userData = isEmployee
      ? {
          username: uname,
          name: 'Asep Milo',
          initials: 'AM',
          role: 'employee',
          roleLabel: 'Karyawan / Engineering',
          superadmin: 0,
          id: 'usr-employee-asep',
          nip: 'CS.50101',
          divisi: 'Engineering',
        }
      : {
          username: uname,
          name: 'Lucia Maria',
          initials: 'LM',
          role: 'admin',
          roleLabel: 'Building Admin',
          superadmin: 1,
          id: 'usr-admin-1',
          nip: 'ADM.001',
          divisi: 'Manajemen Operasional',
        };

    localStorage.setItem('authenticated', 'true');
    localStorage.setItem('bmis_user', JSON.stringify(userData));

    // Redirect sesuai role (persis logic goToDashboard / RBAC)
    if (role === 'admin') {
      router.push('/presensi/admin');
    } else {
      router.push('/presensi/user');
    }
  }, 450);
};
</script>

<template>
  <div class="login-page relative w-screen h-screen bg-white overflow-hidden select-none">
    <!-- Divider Wave SVG (Persis Login.scss BMIS) -->
    <div
      class="hidden md:block absolute top-0 left-0 h-full w-full max-w-[52%] z-[1] pointer-events-none"
      style="
        background-image: url('/images/login-divider.svg');
        background-size: cover;
        background-position: right;
        background-repeat: no-repeat;
      "
    ></div>

    <div class="flex flex-col md:flex-row w-full h-full">
      <!-- Kolom Kiri (col1 - Form Login) -->
      <div class="w-full md:w-5/12 h-full relative z-[2] flex flex-col items-center justify-center px-6 md:px-0 bg-white md:bg-transparent">
        <!-- Logo BMIS -->
        <img
          src="/images/logo-bmis.webp"
          alt="Logo BMIS"
          class="w-1/2 md:w-[30%] h-auto mb-4 md:mb-0 md:absolute md:top-[3%] md:left-[10%]"
          onerror="this.style.display='none'"
        />

        <!-- Heading Welcome -->
        <h1 class="text-[2rem] font-bold text-[#3F57B6] text-center leading-tight">
          Welcome!
        </h1>
        <h2 class="text-[1.45rem] font-normal text-[#3F57B6] text-center mt-1">
          Login in to your Account
        </h2>

        <!-- Form Login -->
        <form @submit.prevent="handleLogin" class="w-full md:w-[70%] pt-8 space-y-4">
          <!-- Alert Error Validasi -->
          <div
            v-if="errorMessage"
            class="px-3.5 py-2.5 rounded bg-red-50 border border-red-200 text-red-600 text-xs font-medium"
          >
            {{ errorMessage }}
          </div>

          <!-- Input Username -->
          <div>
            <label for="username" class="block text-sm font-normal text-black mb-1.5">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Username"
              class="w-full h-10 px-3.5 rounded bg-[#f4f6fa] border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#3F57B6] focus:bg-white transition-all"
            />
          </div>

          <!-- Input Password -->
          <div>
            <label for="password" class="block text-sm font-normal text-black mb-1.5">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password"
                class="w-full h-10 pl-3.5 pr-10 rounded bg-[#f4f6fa] border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#3F57B6] focus:bg-white transition-all"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <EyeOff v-if="showPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <!-- Tombol Submit Pill Biru (#3F57B6) -->
          <div class="pt-5">
            <button
              type="submit"
              :disabled="loadingSubmit"
              class="w-full py-2.5 px-4 rounded-full bg-[#3F57B6] hover:bg-[#324696] text-white font-semibold text-lg shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              {{ loadingSubmit ? 'Memproses...' : 'Login' }}
            </button>
          </div>

          <!-- Pintasan Akun Demo Multi-Role untuk Pengujian -->
          <div class="pt-4 border-t border-slate-100">
            <span class="block text-[11px] text-slate-400 text-center mb-2">
              Klik untuk isi cepat akun simulasi Role:
            </span>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="fillDemoAccount('admin')"
                class="py-1.5 px-2.5 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-[#3F57B6] text-[11px] font-semibold text-slate-700 transition-colors"
              >
                Role: Admin Gedung
              </button>
              <button
                type="button"
                @click="fillDemoAccount('employee')"
                class="py-1.5 px-2.5 rounded border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-bmis-teal text-[11px] font-semibold text-slate-700 transition-colors"
              >
                Role: Karyawan
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Kolom Kanan (col2 - Background Gedung BTN BMIS) -->
      <div
        class="hidden md:flex md:w-7/12 h-full items-center justify-center z-0"
        style="
          background-image: url('/images/login-office-btn.png');
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
        "
      ></div>
    </div>

    <!-- Footer Copyright -->
    <footer class="fixed bottom-0 left-0 right-0 z-10 ml-3 mb-2.5 text-[13px] text-black text-left pointer-events-none">
      {{ currentYear }} &copy; Building Management Information System.
    </footer>
  </div>
</template>
