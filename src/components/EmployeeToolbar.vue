<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import FilterSelect from './FilterSelect.vue'
import { DEPARTMENTS, STATUSES, TYPES } from '@/data/employees'

const search = defineModel<string>('search', { required: true })
const department = defineModel<string>('department', { required: true })
const status = defineModel<string>('status', { required: true })
const type = defineModel<string>('type', { required: true })

const emit = defineEmits<{ add: []; 'clear-search': [] }>()
</script>

<template>
  <section class="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-6">
    <label
      class="flex h-16 w-full min-w-[260px] items-center gap-3 rounded-lg border border-line px-4 text-ink-soft focus-within:outline focus-within:outline-2 focus-within:outline-brand-500 md:w-[296px]"
    >
      <AppIcon name="search" :size="22" />
      <span class="sr-only">Cari pegawai</span>
      <input
        v-model="search"
        type="text"
        placeholder="Cari berdasarkan nama, departemen, atau ID Pegawai..."
        class="w-full resize-none bg-transparent text-sm leading-snug text-ink outline-none placeholder:text-ink-soft"
      />
      <button
        v-if="search"
        type="button"
        class="text-ink hover:text-brand-600"
        aria-label="Hapus pencarian"
        @click="emit('clear-search')"
      >
        <AppIcon name="close" :size="16" />
      </button>
    </label>

    <FilterSelect v-model="department" label="Unit Kerja" :options="DEPARTMENTS" />
    <FilterSelect v-model="status" label="Status" :options="STATUSES" />
    <FilterSelect v-model="type" label="Jenis Kepegawaian" :options="TYPES" />

    <button
      type="button"
      class="inline-flex h-[42px] items-center gap-2 rounded-md bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 md:ml-auto"
      @click="emit('add')"
    >
      <AppIcon name="plus" :size="16" /> Tambah Pegawai
    </button>
  </section>
</template>
