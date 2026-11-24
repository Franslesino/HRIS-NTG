<script setup lang="ts">
import AssignmentSection from './AssignmentSection.vue'
import WorkHistorySection from './WorkHistorySection.vue'
import type { EmployeeDetail } from '@/types/employee'

defineProps<{ employee: EmployeeDetail }>()
const emit = defineEmits<{ refresh: [] }>()
</script>

<template>
  <div class="space-y-5">
    <AssignmentSection :employee="employee" @refresh="emit('refresh')" />
    <WorkHistorySection :employee="employee" @refresh="emit('refresh')" />
  </div>
</template>
