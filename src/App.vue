<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';

const route = useRoute();
const isLoginPage = computed(() => route.path === '/login');
</script>

<template>
  <!-- Full Screen Login -->
  <div v-if="isLoginPage" class="w-screen h-screen overflow-hidden">
    <router-view />
  </div>

  <!-- Main App Layout (Authenticated) -->
  <div v-else class="flex h-screen bg-bmis-bg overflow-hidden text-slate-800">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Navbar -->
      <Navbar />

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
