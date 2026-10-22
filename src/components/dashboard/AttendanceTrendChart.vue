<script setup lang="ts">
import { computed, useId } from 'vue'

interface AttendanceTrendPoint {
  hadir: number
  terlambat: number
}

const props = withDefaults(defineProps<{
  points: AttendanceTrendPoint[]
  labels: string[]
  height?: number
}>(), {
  height: 260,
})

const gradientId = `attendance-trend-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 220
const PADDING_TOP = 14
const PADDING_BOTTOM = 6
const PLOT_HEIGHT = VIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM
const GRID_LINES = [0, 25, 50, 75, 100]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const yFor = (value: number) => PADDING_TOP + (1 - clamp(value, 0, 100) / 100) * PLOT_HEIGHT

const smoothPath = (values: number[]) => {
  if (values.length === 0) return ''
  if (values.length === 1) {
    const y = yFor(values[0])
    return `M 0 ${y.toFixed(2)} L ${VIEW_WIDTH} ${y.toFixed(2)}`
  }

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * VIEW_WIDTH
    return [x, yFor(value)] as const
  })

  let path = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index]
    const current = points[index]
    const next = points[index + 1]
    const afterNext = points[index + 2] ?? next

    const controlOneX = current[0] + (next[0] - previous[0]) / 6
    const controlOneY = current[1] + (next[1] - previous[1]) / 6
    const controlTwoX = next[0] - (afterNext[0] - current[0]) / 6
    const controlTwoY = next[1] - (afterNext[1] - current[1]) / 6

    path += ` C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)}, ${controlTwoX.toFixed(2)} ${controlTwoY.toFixed(2)}, ${next[0].toFixed(2)} ${next[1].toFixed(2)}`
  }

  return path
}

const hadirPath = computed(() => smoothPath(props.points.map((point) => point.hadir)))
const terlambatPath = computed(() => smoothPath(props.points.map((point) => point.terlambat)))
const areaPath = computed(
  () => `${hadirPath.value} L ${VIEW_WIDTH} ${VIEW_HEIGHT} L 0 ${VIEW_HEIGHT} Z`,
)
</script>

<template>
  <div class="w-full">
    <svg
      :viewBox="`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`"
      :style="{ height: `${height}px` }"
      class="w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Grafik tren kehadiran dan keterlambatan"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="hsl(var(--chart-1))" stop-opacity="0.16" />
          <stop offset="100%" stop-color="hsl(var(--chart-1))" stop-opacity="0.015" />
        </linearGradient>
      </defs>

      <g stroke="hsl(var(--border))" stroke-width="1" vector-effect="non-scaling-stroke">
        <line
          v-for="line in GRID_LINES"
          :key="line"
          x1="0"
          :x2="VIEW_WIDTH"
          :y1="yFor(line)"
          :y2="yFor(line)"
        />
      </g>

      <path :d="areaPath" :fill="`url(#${gradientId})`" />
      <path
        :d="terlambatPath"
        fill="none"
        stroke="hsl(var(--chart-2))"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-opacity="0.6"
        vector-effect="non-scaling-stroke"
      />
      <path
        :d="hadirPath"
        fill="none"
        stroke="hsl(var(--chart-1))"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="mt-3 flex justify-between gap-2 text-[11px] text-muted-foreground">
      <span v-for="label in labels" :key="label">{{ label }}</span>
    </div>
  </div>
</template>
