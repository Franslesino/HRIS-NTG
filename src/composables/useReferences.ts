import { ref } from 'vue'
import { api } from '@/api'
import type { References } from '@/types/employee'

/** Data referensi (master) dimuat sekali lalu dipakai bersama semua halaman */
const refs = ref<References | null>(null)
const error = ref<string | null>(null)
let pending: Promise<void> | null = null

export function loadReferences(): Promise<void> {
  if (!pending) {
    pending = api
      .getReferences()
      .then((r) => { refs.value = r; error.value = null })
      .catch(() => { error.value = 'Data referensi gagal dimuat. Muat ulang halaman.'; pending = null })
  }
  return pending
}

/** Panggil setelah data master (unit/jabatan/kantor) berubah agar form pegawai ikut terbarui */
export function reloadReferences(): Promise<void> {
  pending = null
  return loadReferences()
}

export function useReferences() {
  void loadReferences()
  return { refs, error }
}
