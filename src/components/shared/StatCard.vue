<script setup lang="ts">
import type { Component } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

withDefaults(defineProps<{
  title: string
  value: string | number
  hint?: string
  icon?: Component
  iconClass?: string
}>(), {
  iconClass: 'size-4 text-muted-foreground',
})
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium text-muted-foreground">
        {{ title }}
      </CardTitle>
      <component :is="icon" v-if="icon" :class="iconClass" />
    </CardHeader>
    <CardContent>
      <div class="flex items-baseline gap-2">
        <span class="text-2xl font-semibold tracking-tight">{{ value }}</span>
        <slot name="meta" />
      </div>
      <p v-if="hint" class="mt-1 text-xs text-muted-foreground">{{ hint }}</p>
    </CardContent>
    <div v-if="$slots.footer" class="border-t px-6 py-3 text-xs text-muted-foreground">
      <slot name="footer" />
    </div>
  </Card>
</template>
