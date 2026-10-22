<script setup lang="ts">
import type { BadgeVariants } from '@/components/ui/badge'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  status: string
  label?: string
}>()

const map: Record<string, { variant: BadgeVariants['variant'], label: string }> = {
  ON_TIME: { variant: 'success', label: 'Tepat Waktu' },
  LATE: { variant: 'warning', label: 'Terlambat' },
  ABSENT: { variant: 'destructive', label: 'Tidak Hadir' },
  LEAVE: { variant: 'info', label: 'Cuti / Izin' },
  SICK: { variant: 'warning', label: 'Sakit' },
  PENDING: { variant: 'warning', label: 'Menunggu' },
  PENDING_APPROVAL: { variant: 'warning', label: 'Menunggu' },
  APPROVED: { variant: 'success', label: 'Disetujui' },
  ACCEPTED: { variant: 'success', label: 'Disetujui' },
  REJECTED: { variant: 'destructive', label: 'Ditolak' },
  ACTIVE: { variant: 'success', label: 'Aktif' },
  INACTIVE: { variant: 'muted', label: 'Nonaktif' },
  OFF: { variant: 'muted', label: 'Libur' },
  PAGI: { variant: 'warning', label: 'Pagi' },
  SIANG: { variant: 'info', label: 'Siang' },
  MALAM: { variant: 'secondary', label: 'Malam' },
}

const resolved = computed(() => {
  const key = props.status?.toUpperCase?.() ?? ''
  return map[key] ?? { variant: 'outline' as const, label: props.status }
})
</script>

<template>
  <Badge :variant="resolved.variant">
    {{ label ?? resolved.label }}
  </Badge>
</template>
