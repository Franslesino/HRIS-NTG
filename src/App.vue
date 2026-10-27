<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <AppSidebar />
  <main class="min-h-full px-4 py-6 sm:px-6 lg:pl-[calc(16rem+1.5rem)]">
    <RouterView />
  </main>
</template>
