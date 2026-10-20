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
  Calendar
} from 'lucide-vue-next';
import { mockRosterTeams, mockOffices, mockDivisions } from '../../data/mockData';
import type { RosterTeam } from '../../types/roster';

const router = useRouter();

// State Kartu Tim
const teams = ref<RosterTeam[]>([...mockRosterTeams]);

// Filter & Search State
const searchQuery = ref('');
const selectedGedung = ref('');
const selectedDivisi = ref('');

// Modal State
const isModalOpen = ref(false);
const modalTitle = ref('');
const modalGedung = ref('');
const modalLantai = ref('');
const modalDivisi = ref('');
const modalStartDate = ref('2026-11-01');
const modalEndDate = ref('2026-11-30');
const modalQuota = ref(1);

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
  modalStartDate.value = '2026-11-01';
  modalEndDate.value = '2026-11-30';
  modalQuota.value = 1;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

// Simpan Tim Baru
const handleCreateTeam = () => {
  if (!modalTitle.value || !modalGedung.value || !modalLantai.value || !modalDivisi.value) {
    alert('Harap isi semua kolom wajib!');
    return;
  }

  const newTeam: RosterTeam = {
    id: `team-${Date.now()}`,
    orderNum: teams.value.length + 1,
    title: modalTitle.value,
    divisi: modalDivisi.value,
    gedung: modalGedung.value,
    lantai: modalLantai.value,
    startDate: modalStartDate.value,
    status: 'Draft',
    personelCount: 0,
    quotaMax: modalQuota.value,
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

// Navigasi ke Matriks 31 Hari
const goToRosterMatrix = (team: RosterTeam) => {
  showToast(`Membuka Papan Matriks Shift untuk ${team.title}...`);
  router.push({
    name: 'AdminRoster',
    query: {
      team: team.title,
      gedung: team.gedung,
      divisi: team.divisi,
    }
  });
};
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 text-xs text-slate-500">
      <router-link to="/dashboard" class="hover:text-bmis-teal">Roster</router-link>
      <span class="text-slate-300">&gt;</span>
      <span class="text-bmis-teal font-semibold">Jadwal Kerja</span>
    </nav>

    <!-- Header Row -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Rotasi & Jadwal Kerja</h1>
        <p class="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Atur siklus rotasi shift (contoh pola PPSSMM-Libur) dan titik mulainya (cycle anchor date) untuk tiap jadwal kerja, agar seluruh shift terisi 24/7.
        </p>
      </div>

      <!-- Tombol Hijau Tambah Jadwal Baru -->
      <button
        type="button"
        @click="openModal"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-bmis-green text-white text-xs font-bold rounded-lg hover:bg-bmis-green-hover shadow-md shadow-emerald-600/20 transition-all self-start md:self-auto"
      >
        <PlusCircle :size="16" />
        <span>Tambah Jadwal Baru</span>
      </button>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Search Box -->
      <div class="relative flex-1 min-w-[260px] max-w-md">
        <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama personel atau NIK..."
          class="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-bmis-teal focus:ring-2 focus:ring-emerald-500/15 transition-all"
        />
      </div>

      <!-- Filter Gedung -->
      <div class="relative min-w-[180px]">
        <Building2 :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          v-model="selectedGedung"
          class="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-bmis-teal focus:ring-2 focus:ring-emerald-500/15 cursor-pointer transition-all"
        >
          <option value="">Semua Gedung</option>
          <option v-for="g in mockOffices" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>

      <!-- Filter Divisi -->
      <div class="relative min-w-[180px]">
        <Layers :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          v-model="selectedDivisi"
          class="w-full h-10 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-bmis-teal focus:ring-2 focus:ring-emerald-500/15 cursor-pointer transition-all"
        >
          <option value="">Semua Divisi</option>
          <option v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>

      <!-- Reset Filter -->
      <button
        type="button"
        @click="resetFilters"
        class="h-10 px-3.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-500 hover:border-red-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
        title="Reset Filter"
      >
        <RotateCcw :size="14" />
        <span>Reset</span>
      </button>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="team in filteredTeams"
        :key="team.id"
        class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-bmis-teal transition-all flex flex-col justify-between gap-4 group"
      >
        <!-- Card Header -->
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm text-white flex-shrink-0',
                  team.status === 'Aktif' ? 'bg-bmis-teal' : 'bg-slate-700'
                ]"
              >
                {{ team.orderNum }}
              </div>
              <h3 class="text-sm font-bold text-slate-800 truncate" :title="team.title">
                {{ team.title }}
              </h3>
              <button type="button" class="text-slate-400 hover:text-bmis-teal p-1 rounded transition-colors">
                <Pencil :size="13" />
              </button>
            </div>

            <span
              :class="[
                'text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize',
                team.status === 'Aktif'
                  ? 'bg-bmis-teal-light text-bmis-teal border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              ]"
            >
              {{ team.status }}
            </span>
          </div>

          <!-- Metadata Rows -->
          <div class="space-y-2 py-1 text-xs">
            <div class="flex items-center justify-between text-slate-600">
              <span class="flex items-center gap-2 text-slate-400 font-medium">
                <Layers :size="14" /> Divisi
              </span>
              <span class="font-bold text-slate-800">{{ team.divisi }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600">
              <span class="flex items-center gap-2 text-slate-400 font-medium">
                <Building2 :size="14" /> Penugasan
              </span>
              <span class="font-bold text-slate-800">{{ team.gedung }}, {{ team.lantai }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600">
              <span class="flex items-center gap-2 text-slate-400 font-medium">
                <Calendar :size="14" /> Tanggal Mulai
              </span>
              <span class="font-bold text-slate-800">{{ team.startDate }}</span>
            </div>
          </div>
        </div>

        <!-- Personel Section -->
        <div class="border-t border-slate-100 pt-3 space-y-2">
          <div class="flex items-center justify-between text-[11px] font-bold">
            <span class="text-slate-400 uppercase tracking-wider">
              {{ team.personelCount }} Personel Aktif
            </span>
            <span
              :class="[
                'font-bold',
                team.personelCount >= team.quotaMax ? 'text-bmis-teal' : 'text-amber-600'
              ]"
            >
              Kuota ({{ team.personelCount }}/{{ team.quotaMax }})
            </span>
          </div>

          <!-- Overlapping Avatars -->
          <div class="flex items-center gap-2">
            <div v-if="team.members.length > 0" class="flex items-center -space-x-2 overflow-hidden py-1">
              <div
                v-for="(member, mIdx) in team.members"
                :key="mIdx"
                :class="[
                  'w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0',
                  member.bgClass
                ]"
                :title="member.name"
              >
                {{ member.initials }}
              </div>
            </div>
            <span v-else class="text-xs text-slate-400 italic">
              Belum ada personel dialokasikan
            </span>
            <span v-if="team.members.length > 0" class="text-[11px] text-slate-500 truncate max-w-[160px]">
              {{ team.members.map(m => m.name.split(' ')[0]).join(', ') }}...
            </span>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center gap-2 pt-2">
          <button
            type="button"
            @click="goToRosterMatrix(team)"
            class="flex-1 h-9 bg-bmis-green text-white text-xs font-bold rounded-lg hover:bg-bmis-green-hover flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Users :size="14" />
            <span>Lihat Detail & Atur Personel</span>
          </button>
          <button
            type="button"
            @click="deleteTeam(team.id, team.title)"
            class="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-colors"
            title="Hapus Jadwal"
          >
            <Trash2 :size="15" />
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
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
    >
      <div class="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-bmis-teal-light text-bmis-teal flex items-center justify-center">
              <CalendarDays :size="20" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-extrabold text-slate-800">Buat Jadwal Shift Baru</h3>
                <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-bmis-teal border border-emerald-200">
                  JADWAL BARU
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Kelompokkan personel ke dalam siklus pola rotasi kerja otomatis</p>
            </div>
          </div>
          <button
            type="button"
            @click="closeModal"
            class="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Modal Body Form -->
        <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <!-- Section 1: Identitas & Lokasi Gardu -->
          <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-bmis-teal"></span>
                Identitas & Lokasi Gardu
              </span>
              <span class="text-[10px] font-semibold text-slate-400">*Wajib diisi</span>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Judul Jadwal</label>
              <input
                v-model="modalTitle"
                type="text"
                placeholder="Contoh: Tim 1 (Alpha)"
                class="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-bmis-teal focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Lokasi Penugasan</label>
              <div class="grid grid-cols-2 gap-2">
                <select
                  v-model="modalGedung"
                  class="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-bmis-teal"
                >
                  <option value="">-- Pilih Gedung --</option>
                  <option v-for="g in mockOffices" :key="g" :value="g">{{ g }}</option>
                </select>
                <select
                  v-model="modalLantai"
                  class="h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-bmis-teal"
                >
                  <option value="">-- Pilih Lantai --</option>
                  <option value="Lantai Basement P1">Lantai Basement P1</option>
                  <option value="Lantai GF">Lantai GF (Ground Floor)</option>
                  <option value="Lantai 1">Lantai 1</option>
                  <option value="Lantai 2">Lantai 2</option>
                  <option value="Lantai 3">Lantai 3</option>
                  <option value="Lantai 4">Lantai 4</option>
                  <option value="Lantai 5">Lantai 5</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Section 2: Pola Siklus & Anchor Date -->
          <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-bmis-teal"></span>
                Pola Siklus & Titik Mulai (Anchor Date)
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">Divisi</label>
                <select
                  v-model="modalDivisi"
                  class="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-bmis-teal"
                >
                  <option value="">-- Divisi --</option>
                  <option v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">Mulai Siklus</label>
                <input
                  v-model="modalStartDate"
                  type="date"
                  class="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-bmis-teal"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">Berakhir</label>
                <input
                  v-model="modalEndDate"
                  type="date"
                  class="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-bmis-teal"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Kuota Minimum per Shift</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="modalQuota"
                  type="number"
                  min="1"
                  max="50"
                  class="w-20 h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-800 focus:outline-none focus:border-bmis-teal"
                />
                <span class="text-xs text-slate-500 font-semibold">orang / shift</span>
              </div>
            </div>
          </div>

          <!-- Callout Info -->
          <div class="p-3 rounded-xl bg-bmis-teal-light border border-bmis-teal-border text-emerald-900 text-xs flex items-start gap-2.5">
            <Info :size="16" class="text-bmis-teal flex-shrink-0 mt-0.5" />
            <span>
              Pratinjau rotasi dan alokasi personel dikelola di halaman <strong>Detail Jadwal</strong> setelah disimpan.
            </span>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleCreateTeam"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-bmis-green text-white text-xs font-bold rounded-lg hover:bg-bmis-green-hover shadow-sm transition-all"
          >
            <Save :size="14" />
            <span>Simpan & Buat Jadwal</span>
          </button>
        </div>
      </div>
    </div>

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
