import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { api } from '@/api'
import type { EmployeeListItem } from '@/types/employee'

export const PAGE_SIZE = 6

export function useEmployees() {
  const search = ref('')
  const debouncedSearch = ref('')
  // '' = semua
  const unitId = ref('')
  const statusId = ref('')
  const typeId = ref('')
  const page = ref(1)

  const employees = ref<EmployeeListItem[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)

  let requestId = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  async function load() {
    const current = ++requestId
    loading.value = true
    error.value = null
    try {
      const res = await api.listEmployees({
        search: debouncedSearch.value,
        unitId: unitId.value,
        statusId: statusId.value,
        typeId: typeId.value,
        page: page.value,
        pageSize: PAGE_SIZE,
      })
      if (current !== requestId) return // abaikan respons lama
      employees.value = res.data
      total.value = res.total
    } catch {
      if (current !== requestId) return
      error.value = 'Data pegawai gagal dimuat. Coba muat ulang halaman.'
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  watch(search, (v) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedSearch.value = v
    }, 350)
  })

  // Filter berubah → kembali ke halaman 1
  watch([debouncedSearch, unitId, statusId, typeId], () => {
    if (page.value !== 1) page.value = 1
    else load()
  })
  watch(page, load)

  load()
  onBeforeUnmount(() => clearTimeout(timer))

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
  const rangeStart = computed(() => (total.value === 0 ? 0 : (page.value - 1) * PAGE_SIZE + 1))
  const rangeEnd = computed(() => Math.min(page.value * PAGE_SIZE, total.value))
  const isFiltering = computed(
    () =>
      debouncedSearch.value.trim() !== '' ||
      unitId.value !== '' ||
      statusId.value !== '' ||
      typeId.value !== '',
  )

  function clearSearch() {
    clearTimeout(timer)
    search.value = ''
    debouncedSearch.value = ''
  }

  return {
    search, debouncedSearch, unitId, statusId, typeId, page,
    employees, total, loading, error,
    totalPages, rangeStart, rangeEnd, isFiltering,
    clearSearch,
  }
}
