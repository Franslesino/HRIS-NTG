<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/layout/Sidebar.vue'
import Navbar from './components/layout/Navbar.vue'
import { SidebarInset, SidebarProvider } from './components/ui/sidebar'
import { Toaster } from './components/ui/sonner'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <div v-if="isLoginPage" class="min-h-screen bg-background">
    <router-view />
  </div>

  <SidebarProvider v-else>
    <AppSidebar />
    <SidebarInset class="flex h-svh min-w-0 flex-col overflow-hidden">
      <Navbar />
      <main class="flex-1 overflow-y-auto bg-background p-4 md:p-6">
        <div class="mx-auto w-full max-w-7xl">
          <router-view />
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>

  <Toaster position="top-right" rich-colors close-button />
</template>
