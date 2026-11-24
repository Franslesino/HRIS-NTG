<script setup lang="ts">
import { PROFILE_TABS, type ProfileTab } from './profileTabs'

const model = defineModel<ProfileTab>({ required: true })
</script>

<template>
  <div class="overflow-x-auto print:hidden">
    <div class="grid min-w-[760px] grid-cols-5 gap-2 px-1" role="tablist" aria-label="Bagian profil pegawai">
      <button
        v-for="t in PROFILE_TABS"
        :id="`tab-${t.key}`"
        :key="t.key"
        type="button"
        role="tab"
        :aria-selected="model === t.key"
        :aria-controls="`panel-${t.key}`"
        class="h-10 rounded-lg px-3 text-sm transition-colors"
        :class="model === t.key ? 'bg-white font-semibold text-brand-600 shadow-sm' : 'text-ink-soft hover:text-ink'"
        @click="model = t.key"
      >
        {{ t.label }}
      </button>
    </div>
  </div>
</template>
