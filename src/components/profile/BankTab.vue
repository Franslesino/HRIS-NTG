<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import RecordTable from '@/components/ui/RecordTable.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import FormModal from '@/components/ui/FormModal.vue'
import FormField from '@/components/ui/FormField.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { useRecordModal } from '@/composables/useRecordModal'
import { useToast } from '@/composables/useToast'
import { employeeStore } from '@/stores/employeeStore'
import { BANKS } from '@/data/options'
import { maskAccount } from '@/utils/format'
import { isAccountNumber, isBlank } from '@/utils/validators'
import { uid } from '@/utils/id'
import type { BankAccount, EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const { show } = useToast()
const { mode, record, openView, openEdit, openCreate, close } = useRecordModal<BankAccount>()

const columns = [
  { key: 'bank', label: 'Nama Bank', width: '1.2fr' },
  { key: 'accountNumber', label: 'No. Rekening', width: '1.6fr' },
  { key: 'ownerName', label: 'Nama Pemilik', width: '1.4fr' },
  { key: 'primary', label: 'Status', width: '1.2fr' },
]
const rows = computed(() => props.employee.banks)

const revealed = ref<Set<string>>(new Set())
function toggleReveal(id: string) {
  const next = new Set(revealed.value)
  if (!next.delete(id)) next.add(id)
  revealed.value = next
}

const blank = () => ({ bank: '', accountNumber: '', ownerName: '', primary: false })
const form = reactive(blank())
const errors = ref<Record<string, string>>({})

watch(mode, (m) => {
  errors.value = {}
  if (m === 'create' || m === 'edit') {
    const r = record.value
    Object.assign(form, r ? { bank: r.bank, accountNumber: r.accountNumber, ownerName: r.ownerName, primary: r.primary } : blank())
  }
})

function validate() {
  const e: Record<string, string> = {}
  if (!form.bank) e.bank = 'Bank wajib dipilih.'
  if (!isAccountNumber(form.accountNumber)) e.accountNumber = 'Nomor rekening harus berupa angka, 6-20 digit.'
  if (isBlank(form.ownerName)) e.ownerName = 'Nama pemilik rekening wajib diisi.'
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return
  employeeStore.saveRecord(props.employee.id, 'banks', {
    id: record.value?.id ?? uid(),
    bank: form.bank,
    accountNumber: form.accountNumber.replace(/[\s-]/g, ''),
    ownerName: form.ownerName.trim(),
    primary: form.primary,
  })
  show(mode.value === 'create' ? 'Data pegawai berhasil disimpan' : 'Data pegawai berhasil diperbarui')
  close()
}

const detail = computed(() => {
  const r = record.value
  return r
    ? [
        { label: 'Bank', value: r.bank },
        { label: 'Nomor Rekening', value: r.accountNumber },
        { label: 'Nama Pemilik Rekening', value: r.ownerName },
        { label: 'Status Rekening Utama', value: r.primary ? 'Rekening Utama' : 'Cadangan' },
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
    <template #cell-bank="{ row }"><span :class="row.primary && 'font-semibold'">{{ row.bank }}</span></template>
    <template #cell-accountNumber="{ row }">
      <span class="flex items-center gap-2">
        {{ revealed.has(row.id) ? row.accountNumber : maskAccount(row.accountNumber) }}
        <button
          type="button"
          class="text-ink-soft hover:text-brand-600"
          :aria-label="revealed.has(row.id) ? 'Sembunyikan nomor rekening' : 'Tampilkan nomor rekening'"
          @click="toggleReveal(row.id)"
        >
          <AppIcon :name="revealed.has(row.id) ? 'eye-off' : 'eye'" :size="14" />
        </button>
      </span>
    </template>
    <template #cell-primary="{ row }">
      <span
        class="inline-block rounded border px-2 py-0.5 text-xs"
        :class="row.primary ? 'border-brand-100 bg-brand-50 font-semibold text-brand-700' : 'border-line bg-surface text-ink-soft'"
      >
        {{ row.primary ? 'Rekening Utama' : 'Cadangan' }}
      </span>
    </template>
  </RecordTable>

  <DetailModal :open="mode === 'view'" title="Detail Rekening Bank" :items="detail" @close="close" />

  <FormModal
    :open="isForm"
    :title="mode === 'edit' ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'"
    :submit-label="mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'"
    @close="close" @submit="submit"
  >
    <FormField label="Bank" for-id="bk-bank" required select :error="errors.bank">
      <select id="bk-bank" v-model="form.bank" class="select" :aria-invalid="!!errors.bank">
        <option value="" disabled>Pilih bank</option>
        <option v-for="b in BANKS" :key="b" :value="b">{{ b }}</option>
      </select>
    </FormField>
    <FormField label="Nomor Rekening" for-id="bk-no" required :error="errors.accountNumber">
      <input id="bk-no" v-model="form.accountNumber" class="input" inputmode="numeric" placeholder="Masukkan nomor rekening" :aria-invalid="!!errors.accountNumber" />
    </FormField>
    <div class="sm:col-span-2">
      <FormField label="Nama Pemilik Rekening" for-id="bk-owner" required :error="errors.ownerName">
        <input id="bk-owner" v-model="form.ownerName" class="input" placeholder="Masukkan nama sesuai rekening" :aria-invalid="!!errors.ownerName" />
      </FormField>
    </div>
    <div class="flex items-center justify-between gap-4 sm:col-span-2">
      <div>
        <p class="text-sm font-semibold">Jadikan Rekening Utama</p>
        <p class="text-xs text-ink-soft">Rekening ini digunakan sebagai tujuan utama pembayaran gaji.</p>
      </div>
      <ToggleSwitch v-model="form.primary" label="Jadikan rekening utama" />
    </div>
  </FormModal>
</template>
