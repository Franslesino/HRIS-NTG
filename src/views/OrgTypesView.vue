<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import OrgNav from '@/components/org/OrgNav.vue'
import TypeMaster from '@/components/org/TypeMaster.vue'
import type { TypeKind } from '@/types/organization'

const route = useRoute()
const router = useRouter()

const KINDS: { key: string; kind: TypeKind; label: string; title: string; noun: string; usedBy: string }[] = [
  { key: 'unit', kind: 'UNIT', label: 'Jenis Unit', title: 'Daftar Jenis Unit Organisasi', noun: 'jenis unit', usedBy: 'unit organisasi' },
  { key: 'kantor', kind: 'OFFICE', label: 'Jenis Kantor', title: 'Daftar Jenis Kantor', noun: 'jenis kantor', usedBy: 'kantor' },
  { key: 'jabatan', kind: 'POSITION', label: 'Jenis Jabatan', title: 'Daftar Jenis Jabatan', noun: 'jenis jabatan', usedBy: 'jabatan' },
]
const active = computed(() => KINDS.find((k) => k.key === route.query.jenis) ?? KINDS[0])
const select = (key: string) => router.replace({ query: { ...route.query, jenis: key } })
</script>

<template>
  <AppHeader title="Organisasi & Jabatan" :breadcrumb="[{ label: 'Organisasi & Jabatan', to: '/organisasi' }, { label: 'Jenis & Referensi' }]" />
  <div class="mt-6"><OrgNav /></div>

  <div class="mt-5 inline-flex gap-1 rounded-lg border border-line bg-white p-1" role="tablist" aria-label="Jenis data referensi">
    <button
      v-for="k in KINDS"
      :id="`jenis-${k.key}`"
      :key="k.key"
      type="button"
      role="tab"
      :aria-selected="active.key === k.key"
      class="h-9 rounded-md px-4 text-sm transition-colors"
      :class="active.key === k.key ? 'bg-brand-50 font-semibold text-brand-600' : 'text-ink-soft hover:text-ink'"
      @click="select(k.key)"
    >
      {{ k.label }}
    </button>
  </div>

  <div class="mt-4" role="tabpanel" :aria-labelledby="`jenis-${active.key}`">
    <TypeMaster :key="active.key" :kind="active.kind" :title="active.title" :noun="active.noun" :used-by="active.usedBy" />
  </div>
</template>
