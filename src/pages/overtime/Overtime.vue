<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  FileCheck2,
  Clock,
  PlusCircle,
  Building2,
  Layers,
  Search,
  CheckCircle2,
  DollarSign,
  X,
  Save
} from 'lucide-vue-next';
import { mockOffices, mockDivisions } from '../../data/mockData';
import type { OvertimeRequest } from '../../types/overtime';
import { useOvertimeStore } from '../../composables/useOvertimeStore';

const { requests } = useOvertimeStore();

// Filters
const activeTab = ref<'all' | 'rencana' | 'realisasi'>('all');
const selectedGedung = ref('');
const selectedDivisi = ref('');
const searchQuery = ref('');

// Modal Pengajuan SPKL Baru
const isModalOpen = ref(false);
const formEmployeeName = ref('');
const formNip = ref('');
const formDivision = ref('Engineering');
const formOffice = ref('Menara 1 BTN');
const formDate = ref('2026-10-16');
const formStartTime = ref('17:00');
const formEndTime = ref('20:00');
const formPurpose = ref('');
const formIsManagerial = ref(false);

// Toast
const toastMessage = ref('');
const isToastVisible = ref(false);

const showToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
};

// Filtered Requests
const filteredRequests = computed(() => {
  return requests.value.filter(req => {
    const matchTab = activeTab.value === 'all' || req.stage === activeTab.value;
    const matchGedung = !selectedGedung.value || req.office === selectedGedung.value;
    const matchDivisi = !selectedDivisi.value || req.division === selectedDivisi.value;
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch = !q || req.employeeName.toLowerCase().includes(q) || req.spklNumber.toLowerCase().includes(q);
    return matchTab && matchGedung && matchDivisi && matchSearch;
  });
});

// KPI Calculations
const kpiTotal = computed(() => requests.value.length);
const kpiPendingPlan = computed(() => requests.value.filter(r => r.stage === 'rencana' && r.status === 'Menunggu Approval').length);
const kpiPendingRealization = computed(() => requests.value.filter(r => r.stage === 'realisasi' && r.status === 'Menunggu Approval').length);
const kpiTotalCost = computed(() => requests.value.reduce((acc, r) => acc + r.estimatedCost, 0));

// Actions
const approveRequest = (req: OvertimeRequest) => {
  if (req.stage === 'rencana') {
    req.status = 'Disetujui';
    showToast(`Rencana lembur ${req.spklNumber} disetujui! Lanjutkan ke tahap pelaksanaan.`);
  } else {
    req.status = 'Selesai';
    showToast(`Realisasi jam lembur ${req.spklNumber} diverifikasi dan diotorisasi untuk payroll!`);
  }
};

const moveToRealization = (req: OvertimeRequest) => {
  req.stage = 'realisasi';
  req.status = 'Menunggu Approval';
  showToast(`${req.spklNumber} dipindahkan ke tahap Realisasi Jam Aktual.`);
};

// Submit Modal SPKL
const submitNewSPKL = () => {
  if (!formEmployeeName.value || !formPurpose.value) {
    alert('Harap lengkapi nama pegawai dan uraian pekerjaan lembur!');
    return;
  }

  const duration = 3;
  const cost = formIsManagerial.value ? 0 : duration * 45000;

  const newReq: OvertimeRequest = {
    id: `spkl-${Date.now()}`,
    spklNumber: `SPKL/BTN/2026/10/00${requests.value.length + 1}`,
    employeeName: formEmployeeName.value,
    nip: formNip.value || 'CS.38999',
    division: formDivision.value,
    office: formOffice.value,
    date: formDate.value,
    startTime: formStartTime.value,
    endTime: formEndTime.value,
    durationHours: duration,
    purpose: formPurpose.value,
    stage: 'rencana',
    status: 'Menunggu Approval',
    isManagerial: formIsManagerial.value,
    estimatedCost: cost,
  };

  requests.value.unshift(newReq);
  isModalOpen.value = false;
  showToast(`Pengajuan SPKL ${newReq.spklNumber} berhasil dibuat!`);
};
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 text-xs text-slate-500">
      <router-link to="/dashboard" class="hover:text-bmis-teal">Lembur</router-link>
      <span class="text-slate-300">&gt;</span>
      <span class="text-bmis-teal font-semibold">Manajemen & Rekap Lembur (SPKL)</span>
    </nav>

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Manajemen & Rekapitulasi Lembur</h1>
        <p class="text-xs text-slate-500 mt-1">
          Otorisasi Surat Perintah Kerja Lembur (SPKL) dua tahap (Rencana & Realisasi) sesuai PP 35/2021.
        </p>
      </div>

      <button
        type="button"
        @click="isModalOpen = true"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-bmis-green text-white text-xs font-bold rounded-lg hover:bg-bmis-green-hover shadow-md shadow-emerald-600/20 transition-all self-start md:self-auto"
      >
        <PlusCircle :size="16" />
        <span>+ Ajukan SPKL Baru</span>
      </button>
    </div>

    <!-- 4 KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total SPKL -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Berkas SPKL</span>
          <div class="text-2xl font-black text-slate-800 mt-1">{{ kpiTotal }} Berkas</div>
          <span class="text-[11px] font-semibold text-slate-500 mt-0.5">Bulan Oktober 2026</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
          <FileCheck2 :size="24" />
        </div>
      </div>

      <!-- Menunggu Approval Rencana -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval Rencana</span>
          <div class="text-2xl font-black text-amber-600 mt-1">{{ kpiPendingPlan }} Pengajuan</div>
          <span class="text-[11px] font-semibold text-amber-600 mt-0.5">Pra-Pelaksanaan</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock :size="24" />
        </div>
      </div>

      <!-- Menunggu Approval Realisasi -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval Realisasi</span>
          <div class="text-2xl font-black text-purple-600 mt-1">{{ kpiPendingRealization }} Berkas</div>
          <span class="text-[11px] font-semibold text-purple-600 mt-0.5">Verifikasi Jam Aktual</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <CheckCircle2 :size="24" />
        </div>
      </div>

      <!-- Total Estimasi Biaya -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimasi Biaya</span>
          <div class="text-xl font-black text-emerald-600 mt-1">Rp {{ kpiTotalCost.toLocaleString('id-ID') }}</div>
          <span class="text-[11px] font-semibold text-emerald-600 mt-0.5">Anggaran Lembur Gedung</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-bmis-teal flex items-center justify-center">
          <DollarSign :size="24" />
        </div>
      </div>
    </div>

    <!-- Filter Bar & Tabs -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <!-- Tabs 2 Stage Approval -->
      <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          @click="activeTab = 'all'"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
            activeTab === 'all' ? 'bg-bmis-teal text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          Semua Tahap
        </button>
        <button
          type="button"
          @click="activeTab = 'rencana'"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
            activeTab === 'rencana' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          <span>Tahap 1: Rencana</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{{ requests.filter(r => r.stage === 'rencana').length }}</span>
        </button>
        <button
          type="button"
          @click="activeTab = 'realisasi'"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
            activeTab === 'realisasi' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          ]"
        >
          <span>Tahap 2: Realisasi Jam</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{{ requests.filter(r => r.stage === 'realisasi').length }}</span>
        </button>
      </div>

      <!-- Filters Inputs -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative min-w-[180px]">
          <Building2 :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            v-model="selectedGedung"
            class="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-bmis-teal"
          >
            <option value="">Semua Gedung</option>
            <option v-for="g in mockOffices" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>

        <div class="relative min-w-[180px]">
          <Layers :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            v-model="selectedDivisi"
            class="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-bmis-teal"
          >
            <option value="">Semua Divisi</option>
            <option v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <div class="relative flex-1 min-w-[200px]">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nomor SPKL atau nama pegawai..."
            class="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-bmis-teal"
          />
        </div>
      </div>
    </div>

    <!-- Tabel Daftar Pengajuan Lembur -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th class="p-3">No. SPKL</th>
              <th class="p-3">Nama Pegawai & NIP</th>
              <th class="p-3">Divisi & Gedung</th>
              <th class="p-3">Tanggal & Jam</th>
              <th class="p-3 min-w-[220px]">Uraian Pekerjaan Lembur</th>
              <th class="p-3">Tahap</th>
              <th class="p-3">Biaya / Kompensasi</th>
              <th class="p-3 text-center">Status & Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="req in filteredRequests"
              :key="req.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="p-3 font-mono font-bold text-slate-800 text-[11px]">{{ req.spklNumber }}</td>

              <td class="p-3">
                <div class="font-bold text-slate-800">{{ req.employeeName }}</div>
                <div class="text-[10px] text-slate-400">{{ req.nip }}</div>
              </td>

              <td class="p-3">
                <div class="font-semibold text-slate-700">{{ req.division }}</div>
                <div class="text-[10px] text-slate-400">{{ req.office }}</div>
              </td>

              <td class="p-3">
                <div class="font-semibold text-slate-800">{{ req.date }}</div>
                <div class="text-[10px] text-slate-500">{{ req.startTime }} - {{ req.endTime }} ({{ req.durationHours }} Jam)</div>
              </td>

              <td class="p-3 text-slate-600 leading-relaxed text-[11px]">
                {{ req.purpose }}
              </td>

              <td class="p-3">
                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    req.stage === 'rencana'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  ]"
                >
                  {{ req.stage }}
                </span>
              </td>

              <td class="p-3">
                <div v-if="req.isManagerial">
                  <span class="text-slate-700 font-bold">Rp 0</span>
                  <div class="text-[9px] text-blue-600 font-semibold">Exempt (Cuti Pengganti)</div>
                </div>
                <div v-else>
                  <span class="text-emerald-600 font-black">Rp {{ req.estimatedCost.toLocaleString('id-ID') }}</span>
                  <div class="text-[9px] text-slate-400">Upah Lembur</div>
                </div>
              </td>

              <td class="p-3 text-center">
                <div class="flex flex-col items-center gap-1.5">
                  <span
                    :class="[
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      req.status === 'Disetujui' || req.status === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    ]"
                  >
                    {{ req.status }}
                  </span>

                  <!-- Tombol Aksi Sesuai Tahap -->
                  <div class="flex items-center gap-1">
                    <button
                      v-if="req.status === 'Menunggu Approval'"
                      type="button"
                      @click="approveRequest(req)"
                      class="px-2 py-0.5 bg-bmis-green text-white text-[10px] font-bold rounded hover:bg-bmis-green-hover"
                      title="Setujui Pengajuan"
                    >
                      Setujui
                    </button>

                    <button
                      v-if="req.stage === 'rencana' && req.status === 'Disetujui'"
                      type="button"
                      @click="moveToRealization(req)"
                      class="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded hover:bg-purple-700"
                      title="Pindahkan ke Verifikasi Realisasi Jam"
                    >
                      Verifikasi Jam
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL PENGAJUAN SPKL BARU -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 :size="20" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-800">Form Pengajuan SPKL Baru</h3>
              <p class="text-[11px] text-slate-400">Tahap 1: Izin & Rencana Kerja Lembur</p>
            </div>
          </div>
          <button type="button" @click="isModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nama Pegawai</label>
            <input
              v-model="formEmployeeName"
              type="text"
              placeholder="Contoh: Candra Wijaya"
              class="w-full h-9 px-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-bmis-teal"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Divisi</label>
              <select
                v-model="formDivision"
                class="w-full h-9 px-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-bmis-teal"
              >
                <option v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Gedung</label>
              <select
                v-model="formOffice"
                class="w-full h-9 px-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-bmis-teal"
              >
                <option v-for="g in mockOffices" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tanggal</label>
              <input
                v-model="formDate"
                type="date"
                class="w-full h-9 px-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-bmis-teal"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Jam Mulai</label>
              <input
                v-model="formStartTime"
                type="time"
                class="w-full h-9 px-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-bmis-teal"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Jam Selesai</label>
              <input
                v-model="formEndTime"
                type="time"
                class="w-full h-9 px-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-bmis-teal"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Uraian / Alasan Lembur</label>
            <textarea
              v-model="formPurpose"
              rows="3"
              placeholder="Jelaskan kebutuhan pekerjaan operasional..."
              class="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-bmis-teal"
            ></textarea>
          </div>

          <!-- Kategori Exempt Manajerial -->
          <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input v-model="formIsManagerial" type="checkbox" class="mt-0.5 rounded text-bmis-teal" />
            <div>
              <span class="font-bold text-slate-800 block">Jabatan Manajerial (Exempt PP 35/2021)</span>
              <span class="text-[11px] text-slate-500 leading-tight block mt-0.5">
                Building Manager ke atas tetap tercatat di sistem, namun upah lembur Rp 0 dan dikompensasi menjadi Cuti Pengganti.
              </span>
            </div>
          </label>
        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            @click="submitNewSPKL"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-bmis-green text-white text-xs font-bold rounded-lg hover:bg-bmis-green-hover shadow-sm"
          >
            <Save :size="14" />
            <span>Simpan & Ajukan SPKL</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 border-l-4 border-l-bmis-teal rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 text-xs font-bold text-slate-800 transition-all animate-bounce"
    >
      <CheckCircle2 :size="18" class="text-bmis-teal flex-shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
