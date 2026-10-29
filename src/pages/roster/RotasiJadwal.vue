<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  CalendarDays,
  PlusCircle,
  Search,
  Building2,
  Layers,
  RotateCcw,
  Pencil,
  Trash2,
  Users,
  Info,
  X,
  Save,
  CheckCircle2,
  Calendar,
  MapPin,
  ChevronDown,
  Filter,
  Folder,
  AlertCircle
} from 'lucide-vue-next';
import { mockRosterTeams, mockOffices, mockDivisions } from '../../data/mockData';
import type { RosterTeam } from '../../types/roster';

const router = useRouter();

const formatTeamMemberSummary = (team: RosterTeam) => {
  if (team.orderNum === 1) return 'A. Subagja, Budi, Dimas...';
  if (team.orderNum === 2) return 'Asep Milo, Farhan, Danang...';
  if (team.orderNum === 3) return 'Irfan Fadhiil, Citra, Rian...';
  return team.members.slice(0, 3).map(m => m.name).join(', ') + '...';
};

// State Kartu Tim
const teams = ref<RosterTeam[]>([...mockRosterTeams]);

// Filter & Search State
const searchQuery = ref('');
const selectedGedung = ref('');
const selectedDivisi = ref('');

// Modal State & Validation
const isModalOpen = ref(false);
const modalTitle = ref('');
const modalGedung = ref('');
const modalLantai = ref('');
const modalDivisi = ref('');
const modalStartDate = ref('');
const modalEndDate = ref('');
const modalQuota = ref<number | string>('');
const hasAttemptedSubmit = ref(false);

const isTitleInvalid = computed(() => hasAttemptedSubmit.value && !modalTitle.value.trim());
const isLocationInvalid = computed(() => hasAttemptedSubmit.value && (!modalGedung.value || !modalLantai.value));
const isDivisiInvalid = computed(() => hasAttemptedSubmit.value && !modalDivisi.value);
const isStartDateInvalid = computed(() => hasAttemptedSubmit.value && !modalStartDate.value);
const isEndDateInvalid = computed(() => hasAttemptedSubmit.value && !modalEndDate.value);
const isQuotaInvalid = computed(() => {
  if (!hasAttemptedSubmit.value) return false;
  if (modalQuota.value === '' || modalQuota.value === null || modalQuota.value === undefined) return true;
  return Number(modalQuota.value) < 1;
});

const isFormInvalid = computed(() => {
  return (
    !modalTitle.value.trim() ||
    !modalGedung.value ||
    !modalLantai.value ||
    !modalDivisi.value ||
    !modalStartDate.value ||
    !modalEndDate.value ||
    modalQuota.value === '' ||
    modalQuota.value === null ||
    modalQuota.value === undefined ||
    Number(modalQuota.value) < 1
  );
});

// Toast State
const toastMessage = ref('');
const isToastVisible = ref(false);

const showToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
};

// Filtered Teams
const filteredTeams = computed(() => {
  return teams.value.filter(team => {
    const q = searchQuery.value.toLowerCase().trim();
    const matchQuery = !q ||
      team.title.toLowerCase().includes(q) ||
      team.divisi.toLowerCase().includes(q) ||
      team.gedung.toLowerCase().includes(q) ||
      team.members.some(m => m.name.toLowerCase().includes(q));

    const matchGedung = !selectedGedung.value || team.gedung === selectedGedung.value;
    const matchDivisi = !selectedDivisi.value || team.divisi === selectedDivisi.value;

    return matchQuery && matchGedung && matchDivisi;
  });
});

const resetFilters = () => {
  searchQuery.value = '';
  selectedGedung.value = '';
  selectedDivisi.value = '';
  showToast('Filter pencarian telah direset.');
};

// Buka Modal
const openModal = () => {
  modalTitle.value = '';
  modalGedung.value = '';
  modalLantai.value = '';
  modalDivisi.value = '';
  modalStartDate.value = '';
  modalEndDate.value = '';
  modalQuota.value = '';
  hasAttemptedSubmit.value = false;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  hasAttemptedSubmit.value = false;
};

// Simpan Tim Baru
const handleCreateTeam = () => {
  hasAttemptedSubmit.value = true;

  if (isFormInvalid.value) {
    return;
  }

  const newTeam: RosterTeam = {
    id: `team-${Date.now()}`,
    orderNum: teams.value.length + 1,
    title: modalTitle.value.trim(),
    divisi: modalDivisi.value,
    gedung: modalGedung.value,
    lantai: modalLantai.value,
    startDate: modalStartDate.value,
    status: 'Draft',
    personelCount: 0,
    quotaMax: Number(modalQuota.value) || 1,
    members: [],
  };

  teams.value.push(newTeam);
  closeModal();
  showToast(`Jadwal "${newTeam.title}" berhasil dibuat dan disimpan!`);
};

// Hapus Tim
const deleteTeam = (id: string, title: string) => {
  if (confirm(`Apakah Anda yakin ingin menghapus jadwal "${title}"?`)) {
    teams.value = teams.value.filter(t => t.id !== id);
    showToast(`Jadwal "${title}" berhasil dihapus.`);
  }
};

// Navigasi ke Matriks Shift
const goToRosterMatrix = (team: RosterTeam) => {
  showToast(`Membuka Atur Personel dan Shift untuk ${team.title}...`);
  router.push({
    name: 'AdminRoster',
    query: {
      team: team.title,
      gedung: team.gedung,
      lantai: team.lantai,
      divisi: team.divisi,
      startDate: team.startDate,
      quotaMax: team.quotaMax
    }
  });
};
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500">
      <span>Roster</span>
      <span class="text-slate-300">&gt;</span>
      <span class="text-bmis-blue font-semibold">Jadwal Kerja</span>
    </nav>

    <!-- Header Row -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Rotasi & Jadwal Kerja</h1>
        <p class="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Atur siklus rotasi shift (contoh pola PPSSMM-Libur) dan titik mulainya (cycle anchor date) untuk tiap jadwal kerja, agar seluruh shift terisi 24/7.
        </p>
      </div>

      <!-- Tombol Tambah Jadwal Baru -->
      <button
        type="button"
        @click="openModal"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0084CC] text-white text-xs font-bold rounded-lg hover:bg-[#0074B5] shadow-xs transition-all self-start md:self-auto cursor-pointer"
      >
        <PlusCircle :size="16" />
        <span>Tambah Jadwal Baru</span>
      </button>
    </div>

    <!-- Form Filter Putih -->
    <div class="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
      <!-- Header Form Filter -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-[#0084CC]/10 text-[#0084CC] flex items-center justify-center">
            <Filter :size="13" />
          </div>
          <span class="text-xs font-bold text-slate-800 tracking-wide uppercase">Filter & Pencarian Jadwal</span>
          <span class="text-[11px] text-slate-400 font-medium">({{ filteredTeams.length }} jadwal ditemukan)</span>
        </div>

        <button
          v-if="searchQuery || selectedGedung || selectedDivisi"
          type="button"
          @click="resetFilters"
          class="inline-flex items-center gap-1.5 text-xs text-[#0084CC] hover:text-[#0074B5] font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw :size="12" />
          <span>Reset Filter</span>
        </button>
      </div>

      <!-- Form Grid Fields -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <!-- Search Box -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Cari Personel / NIK / Jadwal</label>
          <div class="relative">
            <Search :size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama personel atau NIK..."
              class="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-[#0084CC] focus:ring-2 focus:ring-[#0084CC]/15 rounded-md text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        <!-- Filter Gedung -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Gedung</label>
          <div class="relative">
            <Building2 :size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              v-model="selectedGedung"
              class="w-full h-11 pl-10 pr-9 bg-white border border-slate-300 hover:border-slate-400 focus:border-[#0084CC] focus:ring-2 focus:ring-[#0084CC]/15 rounded-md text-xs font-medium text-slate-700 focus:outline-none cursor-pointer transition-all appearance-none text-left shadow-2xs"
            >
              <option value="">Semua Gedung</option>
              <option v-for="g in mockOffices" :key="g" :value="g">{{ g }}</option>
            </select>
            <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <!-- Filter Divisi -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Divisi / Bagian</label>
          <div class="relative">
            <Layers :size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              v-model="selectedDivisi"
              class="w-full h-11 pl-10 pr-9 bg-white border border-slate-300 hover:border-slate-400 focus:border-[#0084CC] focus:ring-2 focus:ring-[#0084CC]/15 rounded-md text-xs font-medium text-slate-700 focus:outline-none cursor-pointer transition-all appearance-none text-left shadow-2xs"
            >
              <option value="">Semua Divisi</option>
              <option v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</option>
            </select>
            <ChevronDown :size="14" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="team in filteredTeams"
        :key="team.id"
        class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-[#0084CC] transition-all flex flex-col justify-between gap-4 group"
      >
        <!-- Card Header -->
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white shrink-0',
                  team.status === 'Aktif' ? 'bg-[#0084CC]' : 'bg-[#000000]'
                ]"
              >
                {{ team.orderNum }}
              </div>
              <h3 class="text-sm font-bold text-slate-900 whitespace-nowrap" :title="team.title">
                {{ team.title }}
              </h3>
              <button
                type="button"
                @click="openModal"
                class="text-[#0084CC] border border-[#bae6fd] hover:bg-sky-50 p-1 rounded transition-colors shrink-0 cursor-pointer"
                title="Edit Jadwal"
              >
                <Pencil :size="12" />
              </button>
            </div>

            <span
              :class="[
                'text-[11px] font-semibold px-2.5 py-0.5 rounded capitalize shrink-0',
                team.status === 'Aktif'
                  ? 'bg-[#e0f2fe] text-[#0284c7]'
                  : 'bg-[#f1f5f9] text-slate-600'
              ]"
            >
              {{ team.status }}
            </span>
          </div>

          <!-- Metadata Rows -->
          <div class="space-y-2 py-1 text-xs">
            <div class="flex items-center justify-between text-slate-600">
              <span class="flex items-center gap-2 text-slate-400 font-medium">
                <Calendar :size="14" class="text-slate-400" /> Divisi
              </span>
              <span class="font-bold text-slate-900">{{ team.divisi }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600">
              <span class="flex items-center gap-2 text-slate-400 font-medium">
                <MapPin :size="14" class="text-slate-400" /> Penugasan
              </span>
              <span class="font-bold text-slate-900">{{ team.gedung }}, {{ team.lantai }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600">
              <span class="flex items-center gap-2 text-slate-400 font-medium">
                <CalendarDays :size="14" class="text-slate-400" /> Tanggal Mulai
              </span>
              <span class="font-bold text-slate-900">{{ team.startDate }}</span>
            </div>
          </div>
        </div>

        <!-- Personel Section -->
        <div class="border-t border-slate-100 pt-3 space-y-2">
          <div class="flex items-center justify-between text-[11px] font-bold">
            <span class="text-slate-500 uppercase tracking-wider">
              {{ team.orderNum === 2 ? 'PERSONEL AKTIF' : `${team.personelCount} PERSONEL AKTIF` }}
            </span>
            <span v-if="team.orderNum === 2" class="text-[#0084CC] font-bold">
              (6/6)
            </span>
            <span v-else-if="team.orderNum === 3" class="text-[#0084CC] font-bold">
              Kuota Terjaga (6/6)
            </span>
          </div>

          <!-- Overlapping Avatars -->
          <div class="flex items-center gap-2">
            <div v-if="team.members.length > 0" class="flex items-center -space-x-2 overflow-hidden py-1">
              <div
                v-for="(member, mIdx) in team.members"
                :key="mIdx"
                :class="[
                  'w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs shrink-0',
                  member.bgClass || 'bg-slate-700 text-white'
                ]"
                :title="member.name"
              >
                {{ member.initials }}
              </div>
            </div>
            <span v-else class="text-xs text-slate-400 italic">
              Belum ada personel dialokasikan
            </span>
            <span v-if="team.members.length > 0" class="text-[11px] text-slate-500 truncate">
              {{ formatTeamMemberSummary(team) }}
            </span>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center gap-2 pt-1">
          <button
            type="button"
            @click="goToRosterMatrix(team)"
            class="flex-1 h-9 bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Users :size="14" />
            <span>Lihat Detail & Atur Personel</span>
          </button>
          <button
            type="button"
            @click="deleteTeam(team.id, team.title)"
            class="w-9 h-9 rounded-lg bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Hapus Jadwal"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredTeams.length === 0"
      class="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3"
    >
      <Users :size="36" class="mx-auto text-slate-300" />
      <h3 class="text-base font-bold text-slate-700">Tidak ada jadwal yang cocok</h3>
      <p class="text-xs text-slate-400">Silakan ubah filter gedung atau kata kunci pencarian Anda.</p>
    </div>

    <!-- MODAL FORM: BUAT JADWAL SHIFT BARU -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all"
        @click.self="closeModal"
      >
        <div class="bg-white w-full max-w-[672px] rounded-lg shadow-2xl border border-[#C6C6CD]/40 overflow-hidden flex flex-col">
          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-[#C6C6CD]/30 flex items-center justify-between bg-white">
            <div class="flex items-center gap-3.5">
              <svg viewBox="63 36 40 40" class="w-10 h-10 rounded shrink-0">
                <rect x="63" y="36" width="40" height="40" rx="4" fill="#0058BE" fill-opacity="0.15"/>
                <rect x="63.5" y="36.5" width="39" height="39" rx="3.5" stroke="#0058BE" stroke-opacity="0.3"/>
                <path d="M82.083 62.8518L77.4997 60.2163C77.2094 60.0483 76.984 59.8268 76.8236 59.5518C76.6632 59.2768 76.583 58.9712 76.583 58.6351V53.3643C76.583 53.0281 76.6632 52.7226 76.8236 52.4476C76.984 52.1726 77.2094 51.9511 77.4997 51.783L82.083 49.1476C82.3733 48.9795 82.6788 48.8955 82.9997 48.8955C83.3205 48.8955 83.6261 48.9795 83.9163 49.1476L88.4997 51.783C88.79 51.9511 89.0153 52.1726 89.1757 52.4476C89.3361 52.7226 89.4163 53.0281 89.4163 53.3643V58.6351C89.4163 58.9712 89.3361 59.2768 89.1757 59.5518C89.0153 59.8268 88.79 60.0483 88.4997 60.2163L83.9163 62.8518C83.6261 63.0198 83.3205 63.1038 82.9997 63.1038C82.6788 63.1038 82.3733 63.0198 82.083 62.8518V62.8518M82.083 60.7434V56.5268L78.4163 54.3955V58.6351V58.6351V58.6351L82.083 60.7434V60.7434M83.9163 60.7434L87.583 58.6351V58.6351V58.6351V54.3955L83.9163 56.5268V60.7434V60.7434M73.833 51.4163V48.6663C73.833 48.1622 74.0125 47.7306 74.3715 47.3715C74.7306 47.0125 75.1622 46.833 75.6663 46.833H78.4163V48.6663H75.6663V48.6663V48.6663V51.4163H73.833V51.4163M78.4163 65.1663H75.6663C75.1622 65.1663 74.7306 64.9868 74.3715 64.6278C74.0125 64.2688 73.833 63.8372 73.833 63.333V60.583H75.6663V63.333V63.333V63.333H78.4163V65.1663V65.1663M87.583 65.1663V63.333H90.333V63.333V63.333V60.583H92.1663V63.333C92.1663 63.8372 91.9868 64.2688 91.6278 64.6278C91.2688 64.9868 90.8372 65.1663 90.333 65.1663H87.583V65.1663M90.333 51.4163V48.6663V48.6663V48.6663H87.583V46.833H90.333C90.8372 46.833 91.2688 47.0125 91.6278 47.3715C91.9868 47.7306 92.1663 48.1622 92.1663 48.6663V51.4163H90.333V51.4163M82.9997 54.9455L86.6205 52.8143L82.9997 50.7288V50.7288V50.7288L79.3788 52.8143L82.9997 54.9455V54.9455M82.9997 55.9768V55.9768V55.9768V55.9768V55.9768V55.9768V55.9768V55.9768V55.9768V55.9768V55.9768V55.9768V55.9768V55.9768M82.9997 54.9455V54.9455V54.9455V54.9455V54.9455V54.9455M83.9163 56.5268V56.5268V56.5268V56.5268V56.5268V56.5268M82.083 56.5268V56.5268V56.5268V56.5268V56.5268V56.5268" fill="#0058BE"/>
              </svg>
              <div>
                <div class="flex items-center gap-2.5">
                  <h3 class="text-base font-bold text-[#171C1F]">Buat Jadwal Shift Baru</h3>
                  <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAEEF2] text-[#45464D] border border-[#C6C6CD]/40 tracking-wider">
                    JADWAL BARU
                  </span>
                </div>
                <p class="text-xs text-[#45464D] mt-0.5">Kelompokkan personel ke dalam siklus pola rotasi kerja otomatis</p>
              </div>
            </div>
            <button
              type="button"
              @click="closeModal"
              class="text-[#45464D] hover:text-slate-800 p-1.5 transition-colors cursor-pointer"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- Modal Body Form -->
          <div class="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-white">
            <!-- Alert Banner Validasi Gagal -->
            <div
              v-if="hasAttemptedSubmit && isFormInvalid"
              class="p-3.5 sm:p-4 rounded-lg bg-[#FEECEE] border border-[#FCA5A5] flex items-center gap-3 text-xs"
            >
              <AlertCircle :size="20" class="text-[#DC2626] flex-shrink-0" />
              <p class="leading-relaxed">
                <strong class="font-bold text-[#DC2626]">Formulir Belum Lengkap.</strong>
                <span class="text-[#DC2626]"> Silakan isi semua sebelum melakukan penambahan Jadwal Baru</span>
              </p>
            </div>

            <!-- Section 1: Identitas & Lokasi Penugasan -->
            <div class="p-5 sm:p-6 rounded-lg border border-[#C6C6CD]/40 bg-[#F0F4F8] space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#C6C6CD]/30">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-[#0058BE]"></span>
                  <span class="text-xs font-bold text-[#171C1F]">Identitas &amp; Lokasi Penugasan</span>
                </div>
                <span class="text-xs text-[#45464D] font-normal">Wajib diisi</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#45464D] mb-1.5">Judul Jadwal</label>
                <input
                  v-model="modalTitle"
                  type="text"
                  placeholder="Contoh: Tim 1 (Alpha)"
                  class="w-full h-10 px-3.5 bg-white border border-[#C6C6CD]/50 hover:border-slate-400 focus:border-[#0058BE] rounded text-xs font-normal text-[#171C1F] placeholder-[#45464D]/60 focus:outline-none focus:ring-1 focus:ring-[#0058BE] transition-all"
                />
                <p v-if="isTitleInvalid" class="text-xs text-[#DC2626] mt-1.5 font-normal">Judul Wajib diisi.</p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#45464D] mb-1.5">Lokasi Penugasan</label>
                <div class="grid grid-cols-2 gap-3.5">
                  <div class="relative">
                    <select
                      v-model="modalGedung"
                      class="w-full h-10 pl-3 pr-8 bg-white border border-[#C6C6CD]/50 hover:border-slate-400 focus:border-[#0058BE] rounded text-xs font-normal text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0058BE] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- Pilih Gedung --</option>
                      <option v-for="g in mockOffices" :key="g" :value="g">{{ g }}</option>
                    </select>
                    <ChevronDown :size="15" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                  </div>
                  <div class="relative">
                    <select
                      v-model="modalLantai"
                      class="w-full h-10 pl-3 pr-8 bg-white border border-[#C6C6CD]/50 hover:border-slate-400 focus:border-[#0058BE] rounded text-xs font-normal text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0058BE] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- Pilih Lantai --</option>
                      <option value="Lantai Basement P1">Lantai Basement P1</option>
                      <option value="Lantai GF">Lantai GF</option>
                      <option value="Lantai 1">Lantai 1</option>
                      <option value="Lantai 2">Lantai 2</option>
                      <option value="Lantai 3">Lantai 3</option>
                      <option value="Lantai 4">Lantai 4</option>
                      <option value="Lantai 5">Lantai 5</option>
                    </select>
                    <ChevronDown :size="15" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                  </div>
                </div>
                <p v-if="isLocationInvalid" class="text-xs text-[#DC2626] mt-1.5 font-normal">Lokasi Penugasan Wajib diisi.</p>
              </div>
            </div>

            <!-- Section 2: Pola Siklus & Titik Mulai (Anchor Date) -->
            <div class="p-5 sm:p-6 rounded-lg border border-[#C6C6CD]/40 bg-[#F0F4F8] space-y-4">
              <div class="flex items-center gap-2 pb-3 border-b border-[#C6C6CD]/30">
                <span class="w-2 h-2 rounded-full bg-[#0058BE]"></span>
                <span class="text-xs font-bold text-[#171C1F]">Pola Siklus &amp; Titik Mulai (Anchor Date)</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label class="block text-xs font-semibold text-[#45464D] mb-1.5">Divisi</label>
                  <div class="relative">
                    <select
                      v-model="modalDivisi"
                      class="w-full h-10 pl-3 pr-8 bg-white border border-[#C6C6CD]/50 hover:border-slate-400 focus:border-[#0058BE] rounded text-xs font-normal text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0058BE] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- Pilih Divisi --</option>
                      <option v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</option>
                    </select>
                    <ChevronDown :size="15" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                  </div>
                  <p v-if="isDivisiInvalid" class="text-xs text-[#DC2626] mt-1.5 font-normal">Divisi Wajib dipilih.</p>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#45464D] mb-1.5">Tanggal Mulai Siklus</label>
                  <input
                    v-model="modalStartDate"
                    type="date"
                    class="w-full h-10 px-3 bg-white border border-[#C6C6CD]/50 hover:border-slate-400 focus:border-[#0058BE] rounded text-xs font-normal text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0058BE] transition-all cursor-pointer"
                  />
                  <p v-if="isStartDateInvalid" class="text-xs text-[#DC2626] mt-1.5 font-normal">Tanggal Mulai dipilih.</p>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-[#45464D] mb-1.5">Berakhir / Masa Berlaku</label>
                  <input
                    v-model="modalEndDate"
                    type="date"
                    class="w-full h-10 px-3 bg-white border border-[#C6C6CD]/50 hover:border-slate-400 focus:border-[#0058BE] rounded text-xs font-normal text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0058BE] transition-all cursor-pointer"
                  />
                  <p v-if="isEndDateInvalid" class="text-xs text-[#DC2626] mt-1.5 font-normal">Tanggal Berakhir dipilih.</p>
                </div>
              </div>

              <div>
                <div class="flex items-center gap-3 pt-1.5">
                  <span class="text-xs font-semibold text-[#171C1F]">Kuota Minimum Personel per Shift</span>
                  <input
                    v-model="modalQuota"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="1"
                    class="w-16 h-9.5 px-2 bg-white border border-[#C6C6CD]/50 hover:border-slate-400 focus:border-[#0058BE] rounded text-xs font-semibold text-center text-[#171C1F] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0058BE] transition-all"
                  />
                  <span class="text-xs text-[#45464D] font-normal">orang / shift</span>
                </div>
                <p v-if="isQuotaInvalid" class="text-xs text-[#DC2626] mt-2 font-normal">Jumlah minimum personel wajib diisi.</p>
              </div>
            </div>

            <!-- Callout Info -->
            <div class="p-4 rounded-lg bg-[#0058BE]/10 border border-[#0058BE]/20 text-[#334155] text-xs flex items-center gap-3">
              <Info :size="18" class="text-[#0058BE] flex-shrink-0" />
              <span class="text-xs text-[#45464D] leading-relaxed">
                Pratinjau rotasi dan alokasi personel dikelola di halaman <strong class="text-[#171C1F] font-bold">Detail Jadwal</strong> setelah disimpan.
              </span>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 bg-[#F8FAFC] border-t border-[#C6C6CD]/30 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="closeModal"
              class="px-5 py-2.5 bg-[#EAEEF2] hover:bg-[#dfe5ec] text-[#45464D] text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-[#C6C6CD]/40"
            >
              Batal
            </button>
            <button
              type="button"
              @click="handleCreateTeam"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0058BE] hover:bg-[#004ba3] active:bg-[#003e87] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Folder :size="16" class="text-white fill-white/20" />
              <span>Simpan &amp; Buat Jadwal</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast Notification BMIS -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 border-l-4 border-l-bmis-teal rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 text-xs font-bold text-slate-800 transition-all animate-bounce"
    >
      <CheckCircle2 :size="18" class="text-bmis-teal flex-shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
