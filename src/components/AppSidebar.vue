<script setup lang="ts">
import { useRoute } from "vue-router"
import AppIcon, { type IconName } from "./AppIcon.vue"
import AppLogo from "./AppLogo.vue"
import { useSidebar } from "@/composables/useSidebar"

const { menuOpen, close } = useSidebar()
const route = useRoute()

interface NavItem { label: string; icon: IconName; to?: string }
const items: NavItem[] = [
  { label: "Dashboard", icon: "home" },
  { label: "Profil Saya", icon: "user", to: "/profil-saya" },
  { label: "Kehadiran", icon: "calendar" },
  { label: "Cuti", icon: "file" },
  { label: "Roster", icon: "clock" },
  { label: "Lembur", icon: "clock" },
]
const isActive = (item: NavItem) => !!item.to && route.path.startsWith(item.to)
const cls = (item: NavItem) => [
  "flex h-[46px] items-center gap-3 rounded-lg px-3.5 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50",
  isActive(item) && "bg-brand-50 font-semibold",
]
</script>

<template>
  <div v-if="menuOpen" class="fixed inset-0 z-30 bg-black/30 lg:hidden" @click="close" />

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-dashed border-gray-400 bg-white transition-transform lg:translate-x-0"
    :class="menuOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="px-6 pb-4 pt-5"><AppLogo /></div>

    <nav class="mt-3 flex-1 space-y-1 px-2" aria-label="Menu utama">
      <template v-for="item in items" :key="item.label">
        <RouterLink v-if="item.to" :to="item.to" :class="cls(item)" :aria-current="isActive(item) ? 'page' : undefined" @click="close">
          <AppIcon :name="item.icon" :size="22" />
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="isActive(item)" class="h-4 w-[3px] rounded-full bg-brand-500" />
        </RouterLink>
        <a v-else href="#" :class="cls(item)" @click.prevent>
          <AppIcon :name="item.icon" :size="22" />
          <span class="flex-1">{{ item.label }}</span>
        </a>
      </template>
    </nav>

    <div class="border-t border-dashed border-gray-400 px-2 py-4 text-sm font-medium">
      <a href="#" class="flex h-11 items-center gap-3 rounded-lg px-4 hover:bg-surface" @click.prevent>
        <AppIcon name="logout" :size="16" /> Logout
      </a>
    </div>
  </aside>
</template>
