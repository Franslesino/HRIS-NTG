import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { fetchEmployees } from '@/data/employees'
import type { Employee } from '@/types/employee'

export const PAGE_SIZE = 6

export function useEmployees() {
  const search = ref('')
  const debouncedSearch = ref('')
  const department = ref('Semua')
  const status = ref('Semua')
  const type = ref('Semua')
  const page = ref(1)

  const employees = ref<Employee[]>([])
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
      const res = await fetchEmployees({
        search: debouncedSearch.value,
        department: department.value,
        status: status.value,
        type: type.value,
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
  watch([debouncedSearch, department, status, type], () => {
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
      department.value !== 'Semua' ||
      status.value !== 'Semua' ||
      type.value !== 'Semua',
  )

  function clearSearch() {
    clearTimeout(timer)
    search.value = ''
    debouncedSearch.value = ''
  }

  return {
    search, debouncedSearch, department, status, type, page,
    employees, total, loading, error,
    totalPages, rangeStart, rangeEnd, isFiltering,
    clearSearch,
  }
}
