<script setup lang="ts">
import InfoCard from './InfoCard.vue'
import { useProfileFields } from '@/composables/useProfileFields'
import type { EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const { identitas, kontak, alamat, jabatan, kepegawaian } = useProfileFields(() => props.employee, { domicile: true })
</script>

<template>
  <section class="rounded-xl border border-line bg-white p-6">
    <h2 class="border-b border-line pb-4 text-sm font-semibold">Data Pribadi</h2>

    <div class="mt-5 grid gap-4 lg:grid-cols-2">
      <div class="space-y-4">
        <InfoCard title="Identitas Diri" :fields="identitas" />
        <InfoCard title="Kontak" :fields="kontak" />
      </div>
      <div class="space-y-4">
        <InfoCard title="Alamat" :fields="alamat" />
        <InfoCard title="Jabatan & Unit Kerja" :fields="jabatan" />
      </div>
    </div>
    <InfoCard class="mt-4" title="Status Kepegawaian" :fields="kepegawaian" />
  </section>
</template>
