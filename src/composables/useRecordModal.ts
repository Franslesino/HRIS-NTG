import { ref, type Ref } from 'vue'

export type ModalMode = 'view' | 'create' | 'edit'

/** State modal untuk satu jenis data (lihat / tambah / ubah) */
export function useRecordModal<T>() {
  const mode = ref<ModalMode | null>(null)
  const record = ref<T | null>(null) as Ref<T | null>
  return {
    mode,
    record,
    openView: (r: T) => { record.value = r; mode.value = 'view' },
    openEdit: (r: T) => { record.value = r; mode.value = 'edit' },
    openCreate: () => { record.value = null; mode.value = 'create' },
    close: () => { mode.value = null },
  }
}
