<script setup lang="ts">
import type { EmployeeStatus } from '@/types/employee'

defineProps<{ status: EmployeeStatus }>()

const styles: Record<EmployeeStatus, string> = {
  Aktif: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  Cuti: 'border-amber-400 bg-amber-50 text-amber-600',
  Nonaktif: 'border-red-500 bg-red-50 text-red-600',
}
</script>

<template>
  <span
    class="inline-block rounded border px-2 py-0.5 text-xs font-semibold leading-tight"
    :class="styles[status]"
  >
    {{ status }}
  </span>
</template>
