<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormModal from '@/components/ui/FormModal.vue'
import FormField from '@/components/ui/FormField.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { api } from '@/api'
import { useApiErrors } from '@/composables/useApiErrors'
import { useRecordModal } from '@/composables/useRecordModal'
import { useReferences } from '@/composables/useReferences'
import { useToast } from '@/composables/useToast'
import { maskLast4 } from '@/utils/format'
import { isAccountNumber, isBlank } from '@/utils/validators'
import type { BankAccount, BankInput, EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const emit = defineEmits<{ refresh: [] }>()
const { show } = useToast()
const { apply } = useApiErrors()
const { refs } = useReferences()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<BankAccount>()

const columns = [
  { key: 'bankName', label: 'Nama Bank', width: '1.2fr' },
  { key: 'accountNumberLast4', label: 'No. Rekening', width: '1.6fr' },
  { key: 'accountHolderName', label: 'Nama Pemilik', width: '1.4fr' },
  { key: 'isPrimary', label: 'Status', width: '1.2fr' },
]
const rows = computed(() => props.employee.banks)

const blank = (): BankInput => ({ bankId: '', accountNumber: '', accountHolderName: '', isPrimary: false })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const isEdit = computed(() => mode.value === 'edit')

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    // nomor rekening penuh tidak pernah dikembalikan server → kosong saat edit = tidak diubah
    Object.assign(form, r
      ? { bankId: r.bankId, accountNumber: '', accountHolderName: r.accountHolderName, isPrimary: r.isPrimary }
      : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (!form.bankId) e.bankId = 'Bank wajib dipilih.'
  if (!isEdit.value || form.accountNumber) {
    if (!isAccountNumber(form.accountNumber)) e.accountNumber = 'Nomor rekening harus berupa angka, 6-20 digit.'
  }
  if (isBlank(form.accountHolderName)) e.accountHolderName = 'Nama pemilik rekening wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  if (saving.value || !validate()) return
  saving.value = true
  try {
    await api.saveBank(
      props.employee.id,
      { ...form, accountNumber: form.accountNumber.replace(/[\s-]/g, '') },
      record.value?.id,
    )
    show(mode.value === 'create' ? 'Data pegawai berhasil disimpan' : 'Data pegawai berhasil diperbarui')
    close()
    emit('refresh')
  } catch (err) {
    apply(err, errors)
  } finally {
    saving.value = false
  }
}

const detail = computed(() => {
  const r = record.value
  return r
    ? [
        { label: 'Bank', value: r.bankName },
        { label: 'Nomor Rekening', value: maskLast4(r.accountNumberLast4) },
        { label: 'Nama Pemilik Rekening', value: r.accountHolderName },
        { label: 'Status Rekening Utama', value: r.isPrimary ? 'Rekening Utama' : 'Cadangan' },
      ]
    : []
})
const isForm = computed(() => mode.value === 'create' || mode.value === 'edit')
</script>

<template>
  <RecordTable
    title="Daftar Rekening Bank Pegawai"
    :columns="columns"
    :rows="rows"
    empty-text="Rekening bank pegawai belum ditambahkan."
    @add="openCreate" @view="openView" @edit="openEdit"
  >
    <template #cell-bankName="{ row }"><span :class="row.isPrimary && 'font-semibold'">{{ row.bankName }}</span></template>
    <template #cell-accountNumberLast4="{ row }">{{ maskLast4(row.accountNumberLast4) }}</template>
    <template #cell-isPrimary="{ row }">
      <span
        class="inline-block rounded border px-2 py-0.5 text-xs"
        :class="row.isPrimary ? 'border-brand-100 bg-brand-50 font-semibold text-brand-700' : 'border-line bg-surface text-ink-soft'"
      >
        {{ row.isPrimary ? 'Rekening Utama' : 'Cadangan' }}
      </span>
    </template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Rekening Bank" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="isEdit ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'"
    :submit-label="isEdit ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <FormField label="Bank" for-id="bk-bank" required select :error="errors.bankId">
      <select id="bk-bank" v-model="form.bankId" class="select" :aria-invalid="!!errors.bankId">
        <option value="" disabled>Pilih bank</option>
        <option v-for="b in refs?.banks ?? []" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>
    </FormField>
    <FormField
      label="Nomor Rekening" for-id="bk-no" :required="!isEdit" :error="errors.accountNumber"
      :hint="isEdit ? `Tersimpan: ${maskLast4(record?.accountNumberLast4 ?? '')}. Kosongkan jika tidak diubah.` : undefined"
    >
      <input id="bk-no" v-model="form.accountNumber" class="input" inputmode="numeric" placeholder="Masukkan nomor rekening" :aria-invalid="!!errors.accountNumber" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Nama Pemilik Rekening" for-id="bk-owner" required :error="errors.accountHolderName">
        <input id="bk-owner" v-model="form.accountHolderName" class="input" placeholder="Masukkan nama sesuai rekening" :aria-invalid="!!errors.accountHolderName" />
      </FormField>
    </div>
    <div class="flex items-center justify-between gap-4 sm:col-span-2">
      <div>
        <p class="text-sm font-semibold">Jadikan Rekening Utama</p>
        <p class="text-xs text-ink-soft">Rekening ini digunakan sebagai tujuan utama pembayaran gaji.</p>
      </div>
      <ToggleSwitch v-model="form.isPrimary" label="Jadikan rekening utama" />
    </div>
  </FormModal>
</template>
