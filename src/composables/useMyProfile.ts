import { onMounted, ref } from "vue"
import { fetchMyProfile } from "@/data/profile"
import type { EmployeeDetail } from "@/types/employee"

export function useMyProfile() {
  const profile = ref<EmployeeDetail | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      profile.value = await fetchMyProfile()
    } catch {
      error.value = "Profil gagal dimuat. Periksa koneksi Anda lalu coba lagi."
    } finally {
      loading.value = false
    }
  }

  onMounted(load)
  return { profile, loading, error, reload: load }
}
