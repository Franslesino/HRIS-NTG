<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const router = useRouter()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loadingSubmit = ref(false)
const errorMessage = ref('')
const currentYear = new Date().getFullYear()

const fillDemoAccount = (role: 'admin' | 'employee') => {
  errorMessage.value = ''
  if (role === 'admin') {
    username.value = 'admin_bmis'
    password.value = 'admin123'
  }
  else {
    username.value = 'asep_milo'
    password.value = 'pegawai123'
  }
}

const handleLogin = () => {
  errorMessage.value = ''

  if (!username.value || username.value.trim().length < 4) {
    errorMessage.value = 'Username wajib diisi (minimal 4 karakter).'
    return
  }
  if (!password.value || password.value.length < 6) {
    errorMessage.value = 'Password wajib diisi (minimal 6 karakter).'
    return
  }

  loadingSubmit.value = true

  setTimeout(() => {
    loadingSubmit.value = false
    const uname = username.value.trim().toLowerCase()

    // Penentuan Role berdasarkan akun login
    const isEmployee = uname.includes('pegawai') || uname.includes('user') || uname.includes('asep') || uname.includes('ahmad')
    const role = isEmployee ? 'employee' : 'admin'

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
        }

    localStorage.setItem('authenticated', 'true')
    localStorage.setItem('bmis_user', JSON.stringify(userData))

    // Redirect sesuai role (persis logic goToDashboard / RBAC)
    if (role === 'admin')
      router.push('/presensi/admin')
    else
      router.push('/presensi/user')
  }, 450)
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
    <div class="mb-6 flex items-center gap-2.5">
      <img
        src="/images/logo-bmis.webp"
        alt="Logo BMIS"
        class="h-9 w-auto object-contain"
        onerror="this.style.display='none'"
      />
      <span class="text-lg font-semibold tracking-tight">HRIS</span>
    </div>

    <Card class="w-full max-w-4xl overflow-hidden p-0 shadow-sm">
      <div class="grid md:grid-cols-2">
        <!-- Form -->
        <div class="flex flex-col justify-center px-6 py-8 sm:px-10 md:min-h-[500px]">
          <div class="mb-6 space-y-1.5 text-center md:text-left">
            <h1 class="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p class="text-sm text-muted-foreground">
              Login to your HRIS account
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="handleLogin">
            <Alert v-if="errorMessage" variant="destructive" class="py-2.5">
              <AlertDescription class="text-xs font-medium">
                {{ errorMessage }}
              </AlertDescription>
            </Alert>

            <div class="space-y-1.5">
              <Label for="username">Username</Label>
              <Input
                id="username"
                v-model="username"
                type="text"
                placeholder="Username"
                autocomplete="username"
                class="h-10"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label for="password">Password</Label>
                <button
                  type="button"
                  class="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  @click="errorMessage = 'Silakan hubungi Admin / HR untuk reset password.'"
                >
                  Forgot password?
                </button>
              </div>
              <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Password"
                  autocomplete="current-password"
                  class="h-10 pr-10"
                />
                <button
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="size-4" />
                  <Eye v-else class="size-4" />
                </button>
              </div>
            </div>

            <Button type="submit" class="h-10 w-full" :disabled="loadingSubmit">
              <Loader2 v-if="loadingSubmit" class="animate-spin" />
              {{ loadingSubmit ? 'Memproses...' : 'Login' }}
            </Button>

            <div class="rounded-lg border border-dashed p-3">
              <p class="mb-2 text-center text-[11px] text-muted-foreground">
                Akun simulasi untuk pengujian role:
              </p>
              <div class="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" type="button" @click="fillDemoAccount('admin')">
                  Admin Gedung
                </Button>
                <Button variant="outline" size="sm" type="button" @click="fillDemoAccount('employee')">
                  Karyawan
                </Button>
              </div>
            </div>
          </form>
        </div>

        <!-- Visual -->
        <div
          class="relative hidden bg-cover bg-center md:block"
          style="background-image: url('/images/login-office-btn.png')"
        >
          <div class="absolute inset-0 bg-gradient-to-t from-primary/40 via-slate-900/10 to-transparent" />
        </div>
      </div>
    </Card>

    <p class="mt-6 text-center text-xs text-muted-foreground">
      {{ currentYear }} &copy; Building Management Information System.
    </p>
  </div>
</template>
