<script setup lang="ts">
import type { BadgeVariants } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

interface Crumb {
  label: string
  to?: string
}

withDefaults(defineProps<{
  title: string
  description?: string
  badge?: string
  badgeVariant?: BadgeVariants['variant']
  breadcrumbs?: Crumb[]
}>(), {
  badgeVariant: 'secondary',
})
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-1.5">
      <nav v-if="breadcrumbs?.length" class="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.label">
          <ChevronRight v-if="index > 0" class="size-3 opacity-60" />
          <router-link
            v-if="crumb.to"
            :to="crumb.to"
            class="transition-colors hover:text-foreground"
          >
            {{ crumb.label }}
          </router-link>
          <span v-else class="font-medium text-foreground">{{ crumb.label }}</span>
        </template>
      </nav>

      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">
          {{ title }}
        </h1>
        <Badge v-if="badge" :variant="badgeVariant">
          {{ badge }}
        </Badge>
      </div>

      <p v-if="description" class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
