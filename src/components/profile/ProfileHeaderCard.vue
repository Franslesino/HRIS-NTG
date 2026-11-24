<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { displayName } from '@/utils/format'
import { displayAssignment, statusTone } from '@/utils/employee'
import type { EmployeeDetail } from '@/types/employee'

const props = defineProps<{ employee: EmployeeDetail }>()
const emit = defineEmits<{ edit: [] }>()
const cur = computed(() => displayAssignment(props.employee.assignments))
</script>

<template>
  <section class="flex items-center justify-between gap-4 rounded-xl border border-line bg-white px-6 py-4">
    <div class="flex min-w-0 items-center gap-4">
      <span class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-purple-100 text-purple-700">
        <AppIcon name="user" :size="28" />
      </span>
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-sm font-semibold">{{ displayName(employee.person) }}</h2>
          <StatusBadge :label="employee.employmentStatus.name" :tone="statusTone(employee.employmentStatus)" />
        </div>
        <p class="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
          <span>{{ employee.employeeNumber }}</span><span aria-hidden="true">|</span>
          <span class="font-semibold text-ink">{{ cur?.positionName ?? '-' }}</span><span aria-hidden="true">|</span>
          <span>{{ cur?.unitName ?? '-' }}</span>
        </p>
      </div>
    </div>
    <button type="button" class="btn btn-outline print:hidden" @click="emit('edit')">
      <AppIcon name="pencil" :size="14" /> Edit
    </button>
  </section>
</template>
