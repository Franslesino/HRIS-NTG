<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { displayName } from '@/utils/format'
import type { EmployeeDetail } from '@/types/employee'

defineProps<{ employee: EmployeeDetail }>()
</script>

<template>
  <section class="flex items-center gap-4 rounded-xl border border-line bg-white px-6 py-4">
    <span class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-purple-100 text-purple-700">
      <img v-if="employee.photo" :src="employee.photo" :alt="`Foto ${employee.name}`" class="h-full w-full object-cover" />
      <AppIcon v-else name="user" :size="28" />
    </span>
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-sm font-semibold">{{ displayName(employee) }}</h2>
        <StatusBadge :status="employee.status" />
      </div>
      <p class="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
        <span>{{ employee.id }}</span><span aria-hidden="true">|</span>
        <span class="font-semibold text-ink">{{ employee.position }}</span><span aria-hidden="true">|</span>
        <span>{{ employee.division || employee.department }}</span>
      </p>
    </div>
  </section>
</template>
