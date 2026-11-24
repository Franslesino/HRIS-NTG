<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { useSidebar } from '@/composables/useSidebar'

/** crumbs: label terakhir = halaman aktif; crumb sebelumnya boleh punya `to` */
defineProps<{ title: string; breadcrumb: { label: string; to?: string }[] }>()
const { toggle } = useSidebar()
</script>

<template>
  <header class="flex items-start justify-between gap-4 print:hidden">
    <div class="flex items-start gap-3">
      <button
        type="button"
        class="mt-1 rounded-lg border border-line bg-white p-2 lg:hidden"
        aria-label="Buka menu"
        @click="toggle"
      >
        <AppIcon name="menu" />
      </button>
      <div>
        <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs text-ink-soft">
          <template v-for="(crumb, i) in breadcrumb" :key="crumb.label">
            <AppIcon v-if="i > 0" name="chevron-right" :size="12" />
            <RouterLink v-if="crumb.to && i < breadcrumb.length - 1" :to="crumb.to" class="hover:text-brand-600">
              {{ crumb.label }}
            </RouterLink>
            <span v-else :class="i === breadcrumb.length - 1 && 'font-semibold text-brand-500'">{{ crumb.label }}</span>
          </template>
        </nav>
        <h1 class="mt-1 text-[28px] font-bold leading-tight">{{ title }}</h1>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button
        type="button"
        class="grid h-8 w-8 place-items-center rounded-full border border-amber-400 bg-amber-50 text-amber-500"
        aria-label="Notifikasi"
      >
        <AppIcon name="bell" :size="16" />
      </button>
      <div class="flex items-center gap-3">
        <span class="grid h-10 w-10 place-items-center rounded-full bg-purple-100 text-purple-700">
          <AppIcon name="user" :size="20" />
        </span>
        <div class="hidden text-left sm:block">
          <p class="text-sm font-semibold leading-tight">Lucia Maria</p>
          <p class="text-xs text-ink-soft">Administrator HR</p>
        </div>
        <AppIcon name="chevron-down" :size="16" />
      </div>
    </div>
  </header>
</template>
