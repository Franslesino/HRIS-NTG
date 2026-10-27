<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import EmployeeTableSkeleton from './EmployeeTableSkeleton.vue'
import EmployeeEmptyState from './EmployeeEmptyState.vue'
import { ROW_GRID } from './tableLayout'
import type { Employee } from '@/types/employee'

defineProps<{
  employees: Employee[]
  loading: boolean
  keyword: string
  skeletonRows: number
}>()
const emit = defineEmits<{ view: [employee: Employee]; edit: [employee: Employee] }>()

const actionBtn =
  'grid h-9 w-9 place-items-center rounded-md border border-line bg-white transition-colors hover:bg-surface'
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-line">
    <div class="min-w-[880px]" role="table" aria-label="Daftar pegawai" :aria-busy="loading">
      <div role="row" :class="[ROW_GRID, 'h-10 border-b border-line bg-surface text-xs font-semibold']">
        <div role="columnheader">Nama Pegawai / ID Pegawai</div>
        <div role="columnheader">Departemen / Unit Kerja</div>
        <div role="columnheader">Jabatan</div>
        <div role="columnheader">Jenis</div>
        <div role="columnheader">Status</div>
        <div role="columnheader" class="text-right">Aksi</div>
      </div>

      <EmployeeTableSkeleton v-if="loading" :rows="skeletonRows" />
      <EmployeeEmptyState v-else-if="employees.length === 0" :keyword="keyword" />

      <template v-else>
        <div
          v-for="e in employees"
          :key="e.id"
          role="row"
          :class="[ROW_GRID, 'h-16 border-b border-line bg-white text-sm last:border-b-0 hover:bg-brand-50/40']"
        >
          <div role="cell" class="flex items-center gap-3">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-700">
              <AppIcon name="user" :size="16" />
            </span>
            <div class="min-w-0">
              <p class="truncate font-semibold">{{ e.name }}</p>
              <p class="truncate text-xs text-ink-soft">{{ e.id }}</p>
            </div>
          </div>
          <div role="cell" class="truncate">{{ e.department }}</div>
          <div role="cell" class="truncate">{{ e.position }}</div>
          <div role="cell" class="truncate">{{ e.type }}</div>
          <div role="cell"><StatusBadge :status="e.status" /></div>
          <div role="cell" class="flex justify-end gap-2">
            <button type="button" :class="actionBtn" :aria-label="`Lihat ${e.name}`" @click="emit('view', e)">
              <AppIcon name="eye" :size="16" />
            </button>
            <button type="button" :class="actionBtn" :aria-label="`Ubah ${e.name}`" @click="emit('edit', e)">
              <AppIcon name="pencil" :size="16" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
