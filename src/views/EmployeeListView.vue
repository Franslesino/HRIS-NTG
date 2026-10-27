<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import EmployeeToolbar from '@/components/EmployeeToolbar.vue'
import EmployeeTable from '@/components/EmployeeTable.vue'
import TablePagination from '@/components/TablePagination.vue'
import { PAGE_SIZE, useEmployees } from '@/composables/useEmployees'
import type { Employee } from '@/types/employee'

const router = useRouter()
const {
  search, debouncedSearch, department, status, type, page,
  employees, total, loading, error,
  totalPages, rangeStart, rangeEnd, isFiltering,
  clearSearch,
} = useEmployees()

const summary = computed(() => {
  if (loading.value) return 'Memuat data pegawai...'
  if (total.value === 0) return 'Menampilkan 0 dari 0 hasil pencarian'
  const label = isFiltering.value ? 'hasil pencarian' : 'entri pegawai'
  return `Menampilkan ${rangeStart.value}-${rangeEnd.value} dari ${total.value} ${label}`
})

const noResult = computed(() => !loading.value && total.value === 0)

const onView = (e: Employee) => router.push(`/kepegawaian/${e.id}`)
const onEdit = (e: Employee) => router.push(`/kepegawaian/${e.id}/edit`)
const onAdd = () => router.push('/kepegawaian/tambah')

</script>

<template>
  <AppHeader title="Daftar Pegawai" :breadcrumb="[{ label: 'Kepegawaian' }, { label: 'Daftar Pegawai' }]" />
  <div class="mt-8 space-y-6">
    <EmployeeToolbar
      v-model:search="search"
      v-model:department="department"
      v-model:status="status"
      v-model:type="type"
      @clear-search="clearSearch"
      @add="onAdd"
    />

    <section class="rounded-xl border border-line bg-white p-6">
      <p
        v-if="error"
        class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        role="alert"
      >
        {{ error }}
      </p>

      <EmployeeTable
        :employees="employees"
        :loading="loading"
        :keyword="debouncedSearch"
        :skeleton-rows="PAGE_SIZE"
        @view="onView"
        @edit="onEdit"
      />

      <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-ink-soft" aria-live="polite">{{ summary }}</p>
        <TablePagination
          :page="page"
          :total-pages="totalPages"
          :disabled="loading || noResult"
          @change="page = $event"
        />
      </div>
    </section>
  </div>
</template>
