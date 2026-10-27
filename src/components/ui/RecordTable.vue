<script setup lang="ts" generic="T extends { id: string }">
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import TablePagination from '@/components/TablePagination.vue'
import EmptyState from './EmptyState.vue'

export interface Column { key: string; label: string; width?: string }

const props = defineProps<{
  title: string
  columns: Column[]
  rows: T[]
  emptyText: string
  pageSize?: number
}>()
const emit = defineEmits<{ add: []; view: [row: T]; edit: [row: T] }>()

const size = computed(() => props.pageSize ?? 5)
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(props.rows.length / size.value)))
watch(totalPages, (n) => { if (page.value > n) page.value = n })

const visible = computed(() => props.rows.slice((page.value - 1) * size.value, page.value * size.value))
const start = computed(() => (props.rows.length ? (page.value - 1) * size.value + 1 : 0))
const end = computed(() => Math.min(page.value * size.value, props.rows.length))

const template = computed(() => [...props.columns.map((c) => c.width ?? '1fr'), '84px'].join(' '))
const cell = (row: T, key: string) => (row as unknown as Record<string, unknown>)[key]
const iconBtn = 'grid h-7 w-7 place-items-center rounded border border-line bg-white hover:bg-surface'
</script>

<template>
  <section class="rounded-xl border border-line bg-white p-6">
    <div class="flex items-center justify-between gap-3 border-b border-line pb-4">
      <h2 class="text-sm font-semibold">{{ title }}</h2>
      <button type="button" class="btn btn-primary" @click="emit('add')">
        <AppIcon name="plus" :size="14" /> Tambah
      </button>
    </div>

    <div class="mt-4 overflow-x-auto rounded-lg border border-line">
      <div class="min-w-[760px]" role="table" :aria-label="title">
        <div
          role="row"
          class="grid h-10 items-center gap-x-3 border-b border-line bg-surface px-3 text-xs font-semibold"
          :style="{ gridTemplateColumns: template }"
        >
          <div v-for="c in columns" :key="c.key" role="columnheader">{{ c.label }}</div>
          <div role="columnheader" class="text-right">Aksi</div>
        </div>

        <EmptyState v-if="rows.length === 0" title="Belum ada data" :description="emptyText">
          <button type="button" class="btn btn-primary" @click="emit('add')">
            <AppIcon name="plus" :size="14" /> Tambah
          </button>
        </EmptyState>

        <template v-else>
          <div
            v-for="row in visible"
            :key="row.id"
            role="row"
            class="grid min-h-[44px] items-center gap-x-3 border-b border-line px-3 py-2 text-sm last:border-b-0 hover:bg-brand-50/40"
            :style="{ gridTemplateColumns: template }"
          >
            <div v-for="c in columns" :key="c.key" role="cell" class="min-w-0">
              <slot :name="`cell-${c.key}`" :row="row">
                <span class="block truncate">{{ cell(row, c.key) || '-' }}</span>
              </slot>
            </div>
            <div role="cell" class="flex justify-end gap-1.5">
              <button type="button" :class="iconBtn" aria-label="Ubah" @click="emit('edit', row)">
                <AppIcon name="pencil" :size="13" />
              </button>
              <button type="button" :class="iconBtn" aria-label="Lihat detail" @click="emit('view', row)">
                <AppIcon name="eye" :size="13" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs text-ink-soft" aria-live="polite">
        {{ rows.length ? `Menampilkan ${start}-${end} dari ${rows.length} entri` : 'Menampilkan 0 dari 0 entri' }}
      </p>
      <TablePagination :page="page" :total-pages="totalPages" :disabled="rows.length === 0" @change="page = $event" />
    </div>
  </section>
</template>
