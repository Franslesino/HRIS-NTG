<script setup lang="ts">
import { Wallet } from 'lucide-vue-next';
import PageHeader from '@/components/shared/PageHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Payroll"
      description="Pengelolaan gaji, tunjangan, dan rekapitulasi pembayaran karyawan."
      badge="Modul Payroll"
      badge-variant="info"
      :breadcrumbs="[{ label: 'Payroll' }]"
    />

    <EmptyState
      title="Modul payroll belum diisi"
      description="Halaman ini siap dikembangkan untuk daftar slip gaji dan proses payroll."
      :icon="Wallet"
    />
  </div>
</template>
