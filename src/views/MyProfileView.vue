<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ProfileHeaderCard from '@/components/profile/ProfileHeaderCard.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import PersonalDataTab from '@/components/profile/PersonalDataTab.vue'
import JobHistoryTab from '@/components/profile/JobHistoryTab.vue'
import EducationTab from '@/components/profile/EducationTab.vue'
import FamilyTab from '@/components/profile/FamilyTab.vue'
import BankTab from '@/components/profile/BankTab.vue'
import { PROFILE_TABS, isProfileTab, type ProfileTab } from '@/components/profile/profileTabs'
import { useMyProfile } from '@/composables/useMyProfile'
import { displayName } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const { profile, loading, error, reload } = useMyProfile()

const tab = computed<ProfileTab>({
  get: () => (isProfileTab(route.query.tab) ? route.query.tab : 'data'),
  set: (key) => router.replace({ query: { ...route.query, tab: key } }),
})
const tabLabel = computed(() => PROFILE_TABS.find((t) => t.key === tab.value)?.label ?? 'Data Pribadi')
const user = computed(() =>
  profile.value ? { name: displayName(profile.value), role: profile.value.position } : undefined,
)
</script>

<template>
  <AppHeader title="Profil Saya" :breadcrumb="['Kepegawaian', tabLabel]" :user="user" />

  <!-- Memuat -->
  <div v-if="loading" class="mt-8 animate-pulse space-y-5" role="status" aria-label="Memuat profil">
    <div class="h-[88px] rounded-xl border border-line bg-white" />
    <div class="h-10 rounded-lg bg-gray-100" />
    <div class="h-[420px] rounded-xl border border-line bg-white" />
  </div>

  <!-- Gagal -->
  <div v-else-if="error" class="mt-8 rounded-xl border border-line bg-white">
    <EmptyState title="Profil gagal dimuat" :description="error">
      <button type="button" class="btn btn-primary" @click="reload">
        <AppIcon name="chevron-right" :size="14" /> Coba lagi
      </button>
    </EmptyState>
  </div>

  <!-- Profil -->
  <div v-else-if="profile" class="mt-8 space-y-5">
    <ProfileHeaderCard :employee="profile" />
    <ProfileTabs v-model="tab" />
    <div :id="`panel-${tab}`" role="tabpanel" :aria-labelledby="`tab-${tab}`">
      <PersonalDataTab v-if="tab === 'data'" :employee="profile" />
      <JobHistoryTab v-else-if="tab === 'jabatan'" :employee="profile" />
      <EducationTab v-else-if="tab === 'pendidikan'" :employee="profile" />
      <FamilyTab v-else-if="tab === 'keluarga'" :employee="profile" />
      <BankTab v-else :employee="profile" />
    </div>
  </div>
</template>
