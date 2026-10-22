<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  Clock,
  FileCheck2,
  LayoutDashboard,
  PanelLeft,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const route = useRoute()
const { toggleSidebar } = useSidebar()

const isAttendanceOpen = ref(route.path.startsWith('/presensi'))
const isRosterOpen = ref(route.path.startsWith('/roster'))

// Keep the active section expanded on deep links / client-side navigation.
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/presensi')) isAttendanceOpen.value = true
    if (path.startsWith('/roster')) isRosterOpen.value = true
  },
)

const currentRole = ref('admin')
const userName = ref('Lucia Maria')
const userRoleLabel = ref('Building Admin')

const loadRole = () => {
  try {
    const raw = localStorage.getItem('bmis_user')
    if (raw) {
      const u = JSON.parse(raw)
      currentRole.value = u.role || 'admin'
      userName.value = u.name || 'Lucia Maria'
      userRoleLabel.value = u.roleLabel || 'Building Admin'
    }
  } catch {
    currentRole.value = 'admin'
  }
}

loadRole()
watch(() => route.fullPath, () => loadRole())

if (typeof window !== 'undefined') {
  window.addEventListener('bmis-role-changed', loadRole)
  window.addEventListener('storage', loadRole)
}

const isSuperAdmin = computed(() => currentRole.value === 'admin')
const isActive = (path: string) => route.path === path
const isSubActive = (prefix: string) => route.path.startsWith(prefix)

const initials = computed(() =>
  userName.value
    .split(' ')
    .map((name) => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase(),
)
</script>

<template>
  <Sidebar collapsible="icon" class="border-r border-sidebar-border">
    <SidebarHeader class="border-b border-sidebar-border/70 p-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            as-child
            tooltip="BMIS HRIS"
            class="h-auto p-1.5 hover:bg-transparent data-[state=open]:hover:bg-transparent"
          >
            <router-link :to="isSuperAdmin ? '/presensi/admin' : '/presensi/user'">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-white shadow-sm">
                <img
                  src="/images/logo-bmis.webp"
                  alt="Logo BMIS"
                  class="h-4 w-auto object-contain"
                />
              </div>
              <div class="grid flex-1 text-left leading-tight">
                <span class="truncate text-[13px] font-semibold tracking-tight">BMIS HRIS</span>
                <span class="mt-0.5 truncate text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  Human Resource
                </span>
              </div>
            </router-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent class="gap-0 py-2">
      <SidebarGroup class="px-2 py-1">
        <SidebarGroupLabel class="h-7 px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">
          Utama
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu class="gap-0.5">
            <SidebarMenuItem v-if="isSuperAdmin">
              <SidebarMenuButton
                as-child
                :is-active="isActive('/dashboard')"
                tooltip="Dashboard"
                class="h-8 gap-2.5 px-2.5 text-[13px]"
              >
                <router-link to="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible v-if="isSuperAdmin" v-model:open="isAttendanceOpen" as-child>
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton
                    :is-active="isSubActive('/presensi')"
                    tooltip="Kehadiran & Presensi"
                    class="h-8 gap-2.5 px-2.5 text-[13px]"
                  >
                    <Clock />
                    <span>Kehadiran &amp; Presensi</span>
                    <ChevronDown
                      class="ml-auto size-3.5 transition-transform duration-200"
                      :class="isAttendanceOpen ? 'rotate-180' : ''"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub class="ml-4 gap-0.5 border-sidebar-border/80 py-1">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive('/presensi/admin')"
                        class="h-7 px-2.5 text-[12.5px]"
                      >
                        <router-link to="/presensi/admin">
                          <Clock class="size-3.5" />
                          <span>Monitoring Kehadiran</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive('/presensi/user')"
                        class="h-7 px-2.5 text-[12.5px]"
                      >
                        <router-link to="/presensi/user">
                          <UserCheck class="size-3.5" />
                          <span>Presensi Mandiri</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem v-else>
              <SidebarMenuButton
                as-child
                :is-active="isActive('/presensi/user')"
                tooltip="Kehadiran & Presensi"
                class="h-8 gap-2.5 px-2.5 text-[13px]"
              >
                <router-link to="/presensi/user">
                  <Clock />
                  <span>Kehadiran &amp; Presensi</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :is-active="isSubActive('/cuti')"
                :tooltip="isSuperAdmin ? 'Approval Cuti' : 'Cuti'"
                class="h-8 gap-2.5 px-2.5 text-[13px]"
              >
                <router-link :to="isSuperAdmin ? '/cuti/admin' : '/cuti'">
                  <CalendarCheck />
                  <span>Cuti</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup class="px-2 py-1">
        <SidebarGroupLabel class="h-7 px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">
          Roster
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu class="gap-0.5">
            <Collapsible v-if="isSuperAdmin" v-model:open="isRosterOpen" as-child>
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton
                    :is-active="isSubActive('/roster')"
                    tooltip="Roster"
                    class="h-8 gap-2.5 px-2.5 text-[13px]"
                  >
                    <CalendarDays />
                    <span>Roster</span>
                    <ChevronDown
                      class="ml-auto size-3.5 transition-transform duration-200"
                      :class="isRosterOpen ? 'rotate-180' : ''"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub class="ml-4 gap-0.5 border-sidebar-border/80 py-1">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive('/roster/tim')"
                        class="h-7 px-2.5 text-[12.5px]"
                      >
                        <router-link to="/roster/tim">
                          <Users class="size-3.5" />
                          <span>Rotasi &amp; Tim Kerja</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive('/roster/admin')"
                        class="h-7 px-2.5 text-[12.5px]"
                      >
                        <router-link to="/roster/admin">
                          <CalendarDays class="size-3.5" />
                          <span>Data Roster Karyawan</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive('/roster/tambah')"
                        class="h-7 px-2.5 text-[12.5px]"
                      >
                        <router-link to="/roster/tambah">
                          <CalendarPlus class="size-3.5" />
                          <span>Tambah Jadwal Shift</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive('/roster/user')"
                        class="h-7 px-2.5 text-[12.5px]"
                      >
                        <router-link to="/roster/user">
                          <Briefcase class="size-3.5" />
                          <span>Jadwal Roster Saya</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem v-else>
              <SidebarMenuButton
                as-child
                :is-active="isActive('/roster/user')"
                tooltip="Jadwal Roster"
                class="h-8 gap-2.5 px-2.5 text-[13px]"
              >
                <router-link to="/roster/user">
                  <CalendarDays />
                  <span>Jadwal Roster</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup class="px-2 py-1">
        <SidebarGroupLabel class="h-7 px-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">
          Payroll
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu class="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :is-active="isActive('/lembur')"
                tooltip="Manajemen Lembur"
                class="h-8 gap-2.5 px-2.5 text-[13px]"
              >
                <router-link to="/lembur">
                  <FileCheck2 />
                  <span>Manajemen Lembur</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :is-active="isActive('/payroll')"
                tooltip="Payroll"
                class="h-8 gap-2.5 px-2.5 text-[13px]"
              >
                <router-link to="/payroll">
                  <Wallet />
                  <span>Payroll</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="border-t border-sidebar-border/70 p-2">
      <div class="flex items-center gap-2 rounded-lg border border-sidebar-border bg-card p-1.5 shadow-sm group-data-[collapsible=icon]:hidden">
        <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white">
          {{ initials }}
        </div>
        <div class="min-w-0 flex-1 leading-tight">
          <p class="truncate text-[12px] font-medium">{{ userName }}</p>
          <p class="truncate text-[10px] text-muted-foreground">{{ userRoleLabel }}</p>
        </div>
        <button
          type="button"
          class="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Ciutkan sidebar"
          @click="toggleSidebar"
        >
          <PanelLeft class="size-3.5" />
        </button>
      </div>

      <button
        type="button"
        class="mx-auto hidden size-7 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white group-data-[collapsible=icon]:flex"
        :title="`${userName} · ${userRoleLabel}`"
        @click="toggleSidebar"
      >
        {{ initials }}
      </button>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
