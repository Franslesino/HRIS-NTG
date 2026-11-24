<script setup lang="ts">
export interface InfoField { label: string; value: string; wide?: boolean; slot?: string }
defineProps<{ title: string; fields: InfoField[] }>()
</script>

<template>
  <section class="rounded-lg border border-line bg-slate-50/60 p-4">
    <h3 class="text-sm font-semibold">{{ title }}</h3>
    <dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
      <div v-for="f in fields" :key="f.label" class="min-w-0" :class="f.wide && 'col-span-2'">
        <dt class="text-xs text-ink-soft">{{ f.label }}</dt>
        <dd class="break-words text-sm">
          <slot v-if="f.slot" :name="f.slot" :value="f.value">{{ f.value }}</slot>
          <template v-else>{{ f.value }}</template>
        </dd>
      </div>
    </dl>
  </section>
</template>
