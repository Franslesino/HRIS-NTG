import { ref, watch } from 'vue'
import { api, errorMessage } from '@/api'
import type { EmployeeDetail } from '@/types/employee'

/** Memuat detail pegawai; reload() dipanggil setelah ada perubahan data */
export function useEmployeeDetail(getId: () => string) {
  const employee = ref<EmployeeDetail | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  let requestId = 0

  async function load() {
    const current = ++requestId
    // skeleton hanya pada pemuatan pertama; reload setelah simpan tidak mengedipkan halaman
    if (!employee.value || employee.value.id !== getId()) {
      employee.value = null
      loading.value = true
    }
    error.value = null
    try {
      const res = await api.getEmployee(getId())
      if (current !== requestId) return
      employee.value = res
    } catch (err) {
      if (current !== requestId) return
      error.value = errorMessage(err)
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  watch(getId, load, { immediate: true })
  return { employee, loading, error, reload: load }
}
