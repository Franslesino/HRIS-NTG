<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftRight,
  Bell,
  ChevronDown,
  LogOut,
  ShieldCheck,
} from 'lucide-vue-next'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

const route = useRoute()
const router = useRouter()

const userName = ref('Lucia Maria')
const userRoleLabel = ref('Building Admin')
const userRole = ref('admin')

const syncUser = () => {
  try {
    const raw = localStorage.getItem('bmis_user')
    if (raw) {
      const u = JSON.parse(raw)
      userName.value = u.name || 'Lucia Maria'
      userRoleLabel.value = u.roleLabel || 'Building Admin'
      userRole.value = u.role || 'admin'
    }
  } catch {
    // fallback
  }
}

onMounted(syncUser)

const initials = computed(() =>
  userName.value
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase(),
)

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/presensi/user': 'Presensi Mandiri',
  '/presensi/admin': 'Monitoring Kehadiran',
  '/cuti': 'Cuti',
  '/cuti/admin': 'Approval Cuti',
  '/roster/tim': 'Rotasi & Tim Kerja',
  '/roster/admin': 'Data Roster',
  '/roster/tambah': 'Tambah Jadwal',
  '/roster/user': 'Jadwal Roster',
  '/lembur': 'Manajemen Lembur',
  '/payroll': 'Payroll',
}

const currentPage = computed(() => pageLabels[route.path] ?? 'Dashboard')

const switchToAdmin = () => {
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
  }
  localStorage.setItem('bmis_user', JSON.stringify(newU))
  syncUser()
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event('bmis-role-changed'))
  router.push('/presensi/admin')
}

const switchToEmployee = () => {
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
  }
  localStorage.setItem('bmis_user', JSON.stringify(newU))
  syncUser()
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event('bmis-role-changed'))
  router.push('/presensi/user')
}

const switchRole = () => {
  if (userRole.value === 'admin')
    switchToEmployee()
  else
    switchToAdmin()
}

const handleLogout = () => {
  localStorage.removeItem('authenticated')
  localStorage.removeItem('bmis_user')
  router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
    <SidebarTrigger class="-ml-1" />
    <Separator orientation="vertical" class="mr-2 h-4" />

    <Breadcrumb class="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem class="text-muted-foreground">
          <ShieldCheck class="size-4" />
          <span class="font-medium">BMIS</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{{ currentPage }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <span class="text-sm font-medium sm:hidden">{{ currentPage }}</span>

    <div class="ml-auto flex items-center gap-1.5">
      <Badge variant="secondary" class="hidden gap-1.5 md:inline-flex">
        <span class="size-1.5 rounded-full bg-primary" />
        {{ userRole === 'admin' ? 'Mode Admin' : 'Mode Pegawai' }}
      </Badge>

      <Button
        variant="outline"
        size="sm"
        class="hidden lg:inline-flex"
        @click="switchRole"
      >
        <ArrowLeftRight />
        Ganti Role
      </Button>

      <Button variant="ghost" size="icon" class="relative" title="Pemberitahuan Mendesak">
        <Bell />
        <span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
      </Button>

      <Button variant="ghost" size="icon" class="relative hidden sm:inline-flex" title="Peringatan Shift">
        <Bell />
        <span class="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning ring-2 ring-background" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="h-9 gap-2 px-1.5 sm:px-2">
            <Avatar class="size-8">
              <AvatarFallback class="bg-primary text-xs font-semibold text-primary-foreground">
                {{ initials }}
              </AvatarFallback>
            </Avatar>
            <div class="hidden flex-col items-start text-left sm:flex">
              <span class="max-w-[140px] truncate text-xs font-semibold leading-tight">{{ userName }}</span>
              <span class="text-[11px] text-muted-foreground">{{ userRoleLabel }}</span>
            </div>
            <ChevronDown class="hidden size-4 text-muted-foreground sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuLabel class="font-normal">
            <span class="block text-xs text-muted-foreground">Login sebagai</span>
            <span class="block truncate text-sm font-semibold">{{ userName }}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @select="switchRole">
            <ArrowLeftRight class="text-primary" />
            <span>Ganti ke Role {{ userRole === 'admin' ? 'Pegawai' : 'Admin' }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem @select="switchToAdmin">
            <ShieldCheck />
            <span>Mode Admin</span>
          </DropdownMenuItem>
          <DropdownMenuItem @select="switchToEmployee">
            <ArrowLeftRight />
            <span>Mode Pegawai</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive focus:text-destructive" @select="handleLogout">
            <LogOut />
            <span>Keluar (Logout)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
