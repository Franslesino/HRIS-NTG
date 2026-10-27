<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ProfileHeaderCard from '@/components/profile/ProfileHeaderCard.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import DataPegawaiTab from '@/components/profile/DataPegawaiTab.vue'
import JobHistoryTab from '@/components/profile/JobHistoryTab.vue'
import EducationTab from '@/components/profile/EducationTab.vue'
import FamilyTab from '@/components/profile/FamilyTab.vue'
import BankTab from '@/components/profile/BankTab.vue'
import { PROFILE_TABS, isProfileTab, type ProfileTab } from '@/components/profile/profileTabs'
import { employeeStore } from '@/stores/employeeStore'

const props = defineProps<{ id: string }>()
const route = useRoute()
const router = useRouter()

const employee = computed(() => employeeStore.find(props.id))
const tab = computed<ProfileTab>({
  get: () => (isProfileTab(route.query.tab) ? route.query.tab : 'data'),
  set: (key) => router.replace({ query: { ...route.query, tab: key } }),
})
const tabLabel = computed(() => PROFILE_TABS.find((t) => t.key === tab.value)?.label ?? 'Data Pegawai')
</script>

<template>
  <AppHeader
    title="Profil Pegawai"
    :breadcrumb="[{ label: 'Kepegawaian', to: '/kepegawaian' }, { label: tabLabel }]"
  />

  <div v-if="employee" class="mt-8 space-y-5">
    <ProfileHeaderCard :employee="employee" @edit="router.push(`/kepegawaian/${employee.id}/edit`)" />
    <ProfileTabs v-model="tab" />
    <div :id="`panel-${tab}`" role="tabpanel" :aria-labelledby="`tab-${tab}`">
      <DataPegawaiTab v-if="tab === 'data'" :employee="employee" />
      <JobHistoryTab v-else-if="tab === 'jabatan'" :employee="employee" />
      <EducationTab v-else-if="tab === 'pendidikan'" :employee="employee" />
      <FamilyTab v-else-if="tab === 'keluarga'" :employee="employee" />
      <BankTab v-else :employee="employee" />
    </div>
  </div>

  <div v-else class="mt-8 rounded-xl border border-line bg-white">
    <EmptyState title="Pegawai tidak ditemukan" description="ID pegawai tidak terdaftar atau datanya sudah dihapus.">
      <RouterLink to="/kepegawaian" class="btn btn-primary">Kembali ke daftar pegawai</RouterLink>
    </EmptyState>
  </div>
</template>
