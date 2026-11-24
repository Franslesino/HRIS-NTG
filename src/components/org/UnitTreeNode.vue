<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { UnitNode } from '@/types/organization'

withDefaults(defineProps<{ node: UnitNode; selectedId: string | null; depth?: number }>(), { depth: 0 })
const emit = defineEmits<{ select: [id: string] }>()
const open = ref(true)
</script>

<template>
  <li role="treeitem" :aria-expanded="node.children.length ? open : undefined" :aria-selected="selectedId === node.id">
    <div
      class="flex items-center gap-1 rounded-lg"
      :class="selectedId === node.id ? 'bg-brand-50' : 'hover:bg-surface'"
      :style="{ paddingLeft: `${depth * 16}px` }"
    >
      <button
        v-if="node.children.length"
        type="button"
        class="grid h-7 w-7 shrink-0 place-items-center text-ink-soft"
        :aria-label="open ? `Ciutkan ${node.name}` : `Buka ${node.name}`"
        @click="open = !open"
      >
        <AppIcon :name="open ? 'chevron-down' : 'chevron-right'" :size="14" />
      </button>
      <span v-else class="h-7 w-7 shrink-0" aria-hidden="true" />
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left text-sm"
        @click="emit('select', node.id)"
      >
        <span class="truncate" :class="[selectedId === node.id && 'font-semibold', !node.isActive && 'text-ink-soft']">{{ node.name }}</span>
        <span class="shrink-0 text-[11px] text-ink-soft">{{ node.unitTypeName }}</span>
        <StatusBadge v-if="!node.isActive" label="Nonaktif" tone="off" />
      </button>
    </div>
    <ul v-if="node.children.length && open" role="group">
      <UnitTreeNode
        v-for="c in node.children"
        :key="c.id"
        :node="c"
        :selected-id="selectedId"
        :depth="depth + 1"
        @select="emit('select', $event)"
      />
    </ul>
  </li>
</template>
