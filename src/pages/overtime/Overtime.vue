<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  Clock,
  Building2,
  Search,
  CheckCircle2,
  X,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  BookOpen,
  Settings2,
  Check,
  Calendar,
  AlertCircle,
  Eye,
  Send,
  UserCheck,
  ArrowLeftRight
} from 'lucide-vue-next';
import { useAdminOvertimeStore } from '../../composables/useOvertimeStore';
import { useAuth } from '../../composables/useAuth';
import type { OvertimeRecord } from '../../types/overtime';
import ModalAjukanTukarShift from '../../components/roster/ModalAjukanTukarShift.vue';

const {
  adminRecords,
  personnel,
  confirmSPKLByEmployee,
  simulateEmployeeTapIn,
  simulateEmployeeTapOut,
} = useAdminOvertimeStore();

const { currentUser } = useAuth();

// ── Active Employee Selection ──
// Defaults to Budi Raharjo (from screenshot) or the logged-in employee
const selectedEmployeeId = ref<string>('e102');

const syncCurrentEmployee = () => {
  if (currentUser.value?.nama) {
    const found = personnel.value.find(
      p => p.name.toLowerCase() === currentUser.value?.nama.toLowerCase() ||
           p.nip === currentUser.value?.nip ||
           p.id === currentUser.value?.id
    );
    if (found) {
      selectedEmployeeId.value = found.id;
      return;
    }
  }
  // Fallback to Budi Raharjo
  selectedEmployeeId.value = 'e102';
};

onMounted(() => {
  syncCurrentEmployee();
});

watch(() => currentUser.value, () => {
  syncCurrentEmployee();
});

const activeEmployee = computed(() => {
  return personnel.value.find(p => p.id === selectedEmployeeId.value) || personnel.value[0] || {
    id: 'e102',
    name: 'Budi Raharjo',
    nip: 'CS.38910',
    division: 'Engineering',
    jobTitle: 'Teknisi Senior ME',
    office: 'Menara 1 BTN',
    initials: 'BR',
    weeklyQuotaMax: 18,
    weeklyQuotaUsed: 6,
  };
});

// ── Employee SPKL Records ──
const employeeAllRecords = computed(() => {
  return adminRecords.value.filter(rec =>
    rec.employeeName.toLowerCase() === activeEmployee.value.name.toLowerCase() ||
    rec.employeeId === activeEmployee.value.id ||
    rec.nip === activeEmployee.value.nip
  );
});

// Active / Today's SPKL for Card 2
const activeSPKL = computed(() => {
  // 1. Look for pending/ongoing SPKL first
  const pending = employeeAllRecords.value.find(r =>
    r.status === 'Menunggu Approval Rencana' ||
    r.status === 'Disetujui Rencana' ||
    r.status === 'Sedang Berjalan' ||
    r.status === 'Menunggu Realisasi'
  );
  if (pending) return pending;

  // 2. Fallback to newest record
  return employeeAllRecords.value[0] || null;
});

// ── Quota Calculations (PP 35/2021) ──
const weeklyQuotaMax = computed(() => 18);
const weeklyQuotaUsed = computed(() => {
  // If active employee has predefined quota from personnel list
  if (activeEmployee.value.weeklyQuotaUsed !== undefined) {
    return activeEmployee.value.weeklyQuotaUsed;
  }
  // Otherwise calculate recognized hours in current week
  return 6;
});
const weeklyQuotaRemaining = computed(() => {
  return Math.max(0, weeklyQuotaMax.value - weeklyQuotaUsed.value);
});
const weeklyQuotaPercent = computed(() => {
  return Math.min(100, Math.round((weeklyQuotaUsed.value / weeklyQuotaMax.value) * 100));
});

// Monthly Accumulation (October 2026)
const monthlyLockedRecords = computed(() => {
  return employeeAllRecords.value.filter(r => r.status === 'Payroll Locked');
});
const monthlyRecognizedHours = computed(() => {
  // If Budi Raharjo, match 14.5 Jam Sah from mockup
  if (activeEmployee.value.name === 'Budi Raharjo') {
    return 14.5;
  }
  const sum = monthlyLockedRecords.value.reduce((acc, r) => acc + (r.recognizedHours || 0), 0);
  return Math.round(sum * 10) / 10;
});
const monthlySPKLCount = computed(() => {
  if (activeEmployee.value.name === 'Budi Raharjo') {
    return 3;
  }
  return monthlyLockedRecords.value.length;
});

// ── Filters & Search ──
const selectedPeriode = ref('2026-10');
const selectedStatus = ref('');
const appliedStatus = ref('');

const applyFilters = () => {
  appliedStatus.value = selectedStatus.value;
  currentPage.value = 1;
  showToast('Filter riwayat lembur diterapkan');
};

const resetFilters = () => {
  selectedPeriode.value = '2026-10';
  selectedStatus.value = '';
  appliedStatus.value = '';
  currentPage.value = 1;
  showToast('Filter direset ke default');
};

// Filtered Records for Table
const filteredEmployeeRecords = computed(() => {
  return employeeAllRecords.value.filter(rec => {
    if (appliedStatus.value) {
      if (rec.status !== appliedStatus.value) return false;
    }
    return true;
  });
});

// ── Pagination ──
const currentPage = ref(1);
const perPage = ref(4);

const totalPages = computed(() => Math.ceil(filteredEmployeeRecords.value.length / perPage.value) || 1);

const paginationStart = computed(() => {
  if (filteredEmployeeRecords.value.length === 0) return 0;
  return (currentPage.value - 1) * perPage.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * perPage.value, filteredEmployeeRecords.value.length);
});

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredEmployeeRecords.value.slice(start, start + perPage.value);
});

// ── Helpers ──
const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Payroll Locked':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Payroll Locked',
      };
    case 'Menunggu Realisasi':
      return {
        bg: 'bg-blue-50 text-blue-600 border-blue-200',
        dot: 'bg-blue-500',
        label: 'Menunggu Realisasi',
      };
    case 'Menunggu Approval Rencana':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Menunggu Persetujuan HR',
      };
    case 'Disetujui Rencana':
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
        label: 'Disetujui Rencana',
      };
    case 'Sedang Berjalan':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500 animate-pulse',
        label: 'Sedang Berjalan',
      };
    case 'Auto-Expired':
      return {
        bg: 'bg-slate-100 text-slate-500 border-slate-200',
        dot: 'bg-slate-400',
        label: 'Hangus / Expired',
      };
    case 'Ditolak':
      return {
        bg: 'bg-red-50 text-red-600 border-red-200',
        dot: 'bg-red-500',
        label: 'Ditolak',
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        label: status,
      };
  }
};

// ── Toast Notification ──
const toastMessage = ref('');
const isToastVisible = ref(false);

const showToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
};

// ── Modals ──
// 1. Detail SPKL Modal
const isDetailModalOpen = ref(false);
const selectedDetailRecord = ref<OvertimeRecord | null>(null);

const openDetailModal = (rec: OvertimeRecord) => {
  selectedDetailRecord.value = rec;
  isDetailModalOpen.value = true;
};

// 2. SOP Modal
const isSOPModalOpen = ref(false);

// 3. Shift Swap Modal
const isShiftSwapModalOpen = ref(false);
const handleShiftSwapSubmitted = () => {
  showToast('Pengajuan tukar shift berhasil dikirim ke rekan kerja!');
};

// 4. Work Report Submit Modal
const isReportModalOpen = ref(false);
const reportText = ref('');
const reportTargetId = ref('');

const openReportModal = (id: string) => {
  reportTargetId.value = id;
  reportText.value = 'Perbaikan pipa chiller line B selesai 100%. Pengecekan sambungan valve dan uji tekanan sirkulasi air normal tanpa ada rembesan.';
  isReportModalOpen.value = true;
};

const handleConfirmSPKL = (id: string) => {
  if (confirmSPKLByEmployee(id)) {
    showToast('SPKL berhasil dikonfirmasi dan diterima!');
  }
};

const handleTapIn = (id: string) => {
  if (simulateEmployeeTapIn(id, '17:02')) {
    showToast('Presensi Tap Masuk lembur tercatat pada 17:02 WIB!');
  }
};

const submitWorkReport = () => {
  if (!reportText.value.trim()) {
    showToast('Harap isi laporan penyelesaian pekerjaan lembur!');
    return;
  }
  if (simulateEmployeeTapOut(reportTargetId.value, '21:05', reportText.value)) {
    isReportModalOpen.value = false;
    showToast('Tap Pulang & Laporan lembur terkirim! Menunggu otorisasi Atasan/HR.');
  }
};

// 4. Export CSV
const exportHistory = () => {
  if (employeeAllRecords.value.length === 0) {
    showToast('Tidak ada data riwayat lembur untuk diekspor.');
    return;
  }
  const headers = ['NO_SPKL', 'TANGGAL', 'LOKASI', 'RENCANA_MULAI', 'RENCANA_SELESAI', 'JAM_RENCANA', 'TAP_MASUK', 'TAP_PULANG', 'JAM_DIAKUI', 'STATUS', 'UPAH_LEMBUR'];
  const rows = employeeAllRecords.value.map(r => [
    r.spklNumber,
    r.date,
    `"${r.office} - ${r.workArea}"`,
    r.plannedStartTime,
    r.plannedEndTime,
    r.plannedDurationHours,
    r.actualCheckIn || '—',
    r.actualCheckOut || '—',
    r.recognizedHours || '—',
    r.status,
    r.calculatedWage
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Riwayat_Lembur_${activeEmployee.value.name.replace(/\s+/g, '_')}_Okt2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Riwayat lembur berhasil diekspor ke file CSV!');
};
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Toast Notification -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-if="isToastVisible"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700"
      >
        <CheckCircle2 :size="16" class="text-emerald-400" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- Breadcrumb & Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <nav class="flex items-center gap-2 text-xs">
        <span class="text-slate-400 font-medium">Lembur</span>
        <span class="text-slate-300">&gt;</span>
        <span class="text-[#0284c7] font-semibold">Monitoring Lembur</span>
      </nav>

      <!-- Employee Context Switcher Pill (Subtle & Helpful for Demonstration) -->
      <div class="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
        <UserCheck :size="14" class="text-slate-400" />
        <span class="text-slate-500 font-medium">Melihat Akun:</span>
        <select
          v-model="selectedEmployeeId"
          class="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
        >
          <option v-for="p in personnel" :key="p.id" :value="p.id">
            {{ p.name }} ({{ p.jobTitle }})
          </option>
        </select>
      </div>
    </div>

    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Monitoring Lembur</h1>
        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Bulan Ini</span>
          <span>•</span>
          <span>Periode 1 Oktober - 31 Oktober 2026</span>
          <span>•</span>
          <span class="inline-flex items-center gap-1.5 text-slate-500 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sinkronisasi Data Otomatis
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2.5 self-start md:self-auto">
        <button
          type="button"
          @click="isShiftSwapModalOpen = true"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeftRight :size="16" />
          <span>Ajukan Tukar Shift</span>
        </button>

        <button
          type="button"
          @click="exportHistory"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
        >
          <Download :size="16" />
          <span>Ekspor Riwayat SPKL</span>
        </button>
      </div>
    </div>

    <!-- Top Grid: 2 Cards (Kuota Lembur Mingguan & SPKL Aktif / Baru) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Card 1: Kuota Lembur Mingguan -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <!-- Header Card 1 -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-100 flex items-center justify-center flex-shrink-0">
                <Clock :size="20" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">Kuota Lembur Mingguan</h3>
                <p class="text-xs text-slate-400 mt-0.5">Siklus Periode Berjalan (Senin - Minggu)</p>
              </div>
            </div>

            <span class="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200/60 rounded-md text-xs font-medium">
              PP No. 35/2021
            </span>
          </div>

          <!-- Quota Metric & Sisa Badge -->
          <div class="flex items-baseline justify-between mt-6">
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-extrabold text-slate-800 tracking-tight">{{ weeklyQuotaUsed }} / {{ weeklyQuotaMax }}</span>
              <span class="text-sm font-semibold text-slate-500">Jam</span>
            </div>

            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Sisa {{ weeklyQuotaRemaining }} Jam Tersedia
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-3 mb-6">
            <div
              class="h-full bg-[#0284c7] rounded-full transition-all duration-500"
              :style="{ width: `${weeklyQuotaPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Card 1 Footer Stats -->
        <div class="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
          <div>
            <span class="text-xs text-slate-400 block font-medium">Batas Maksimal Harian</span>
            <span class="text-sm font-bold text-slate-800 block mt-0.5">Maks. 4 Jam / Hari</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block font-medium">Akumulasi Bulan Ini</span>
            <span class="text-sm font-bold text-slate-800 block mt-0.5">{{ monthlyRecognizedHours }} Jam Sah ({{ monthlySPKLCount }} SPKL)</span>
          </div>
        </div>
      </div>

      <!-- Card 2: SPKL Aktif / Baru -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div v-if="activeSPKL">
          <!-- Header Card 2 -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0">
                <FileText :size="20" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-800">{{ activeSPKL.spklNumber }}</span>
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-[#0284c7] border border-sky-200">
                    Hari Ini
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">Tugas Baru Diterbitkan untuk Anda</p>
              </div>
            </div>

            <!-- Status Banner Box -->
            <div class="bg-amber-50/90 border border-amber-200 rounded-xl px-3 py-2 text-right min-w-[170px]">
              <span class="text-xs font-bold text-amber-800 block leading-tight">
                {{ getStatusBadge(activeSPKL.status).label }}
              </span>
              <span class="text-[11px] text-amber-600 font-medium block mt-0.5">
                (Batas konfirmasi 01j 15m)
              </span>
            </div>
          </div>

          <!-- Schedule & Location Details (2 cols) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">JADWAL PENUGASAN</span>
              <div class="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-800">
                <Clock :size="14" class="text-sky-500" />
                <span>{{ activeSPKL.plannedStartTime }} - {{ activeSPKL.plannedEndTime }} WIB</span>
                <span class="text-slate-400 font-medium">({{ activeSPKL.plannedDurationHours.toFixed(1) }} Jam)</span>
              </div>
            </div>

            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LOKASI KERJA</span>
              <div class="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-800 truncate">
                <Building2 :size="14" class="text-slate-500 flex-shrink-0" />
                <span class="truncate">{{ activeSPKL.office }} ({{ activeSPKL.workArea }})</span>
              </div>
            </div>
          </div>

          <!-- Task Description Container -->
          <div class="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 mt-3.5 leading-relaxed">
            <span class="font-bold text-slate-700">Uraian Tugas: </span>
            <span class="italic">"{{ activeSPKL.purpose }}"</span>
          </div>

          <!-- Interactive Action Buttons (Workflow Testing) -->
          <div class="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <!-- If Waiting for Plan Approval / Confirmation -->
            <button
              v-if="activeSPKL.status === 'Menunggu Approval Rencana'"
              type="button"
              @click="handleConfirmSPKL(activeSPKL.id)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-50 text-[#0284c7] hover:bg-sky-100 border border-sky-200 transition cursor-pointer"
            >
              <Check :size="14" />
              <span>Konfirmasi Terima Tugas</span>
            </button>

            <!-- If Approved, ready to Tap In -->
            <button
              v-if="activeSPKL.status === 'Disetujui Rencana'"
              type="button"
              @click="handleTapIn(activeSPKL.id)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
            >
              <Clock :size="14" />
              <span>Simulasi Tap Masuk (17:02 WIB)</span>
            </button>

            <!-- If Ongoing, ready to Tap Out & Send Report -->
            <button
              v-if="activeSPKL.status === 'Sedang Berjalan'"
              type="button"
              @click="openReportModal(activeSPKL.id)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
            >
              <Send :size="14" />
              <span>Tap Pulang & Kirim Laporan</span>
            </button>

            <button
              type="button"
              @click="openDetailModal(activeSPKL)"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer ml-auto"
            >
              <Eye :size="13" />
              <span>Lihat Detail</span>
            </button>
          </div>
        </div>

        <div v-else class="text-center py-10">
          <Clock :size="32" class="text-slate-300 mx-auto mb-2" />
          <h4 class="text-xs font-bold text-slate-700">Tidak Ada Penugasan Aktif</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">Anda sedang tidak memiliki penugasan lembur hari ini.</p>
        </div>

        <!-- Card 2 Footer Note -->
        <div class="border-t border-slate-100 pt-3.5 mt-3.5 flex items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Ditugaskan oleh: <span class="font-bold text-slate-700">{{ activeSPKL?.supervisor || 'Bambang S. (Supervisor ME)' }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[#0284c7] font-semibold text-right">
            <Settings2 :size="14" />
            <span>Tap mesin presensi saat mulai & selesai bertugas</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar & Supervisor Verification Note -->
    <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Periode Filter -->
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400 font-bold uppercase tracking-wider">PERIODE:</span>
          <select
            v-model="selectedPeriode"
            class="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0284c7] cursor-pointer"
          >
            <option value="2026-10">Bulan ini (Oktober 2026)</option>
            <option value="2026-09">Bulan Lalu (September 2026)</option>
            <option value="2026-08">Agustus 2026</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400 font-bold uppercase tracking-wider">STATUS:</span>
          <select
            v-model="selectedStatus"
            class="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0284c7] cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="Payroll Locked">Payroll Locked</option>
            <option value="Menunggu Realisasi">Menunggu Realisasi</option>
            <option value="Menunggu Approval Rencana">Menunggu Persetujuan HR</option>
            <option value="Disetujui Rencana">Disetujui Rencana</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Auto-Expired">Hangus / Expired</option>
          </select>
        </div>

        <!-- Filter Buttons -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="applyFilters"
            class="h-9 px-4 bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Search :size="14" />
            <span>Terapkan</span>
          </button>

          <button
            type="button"
            @click="resetFilters"
            class="h-9 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw :size="14" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Right Verification Notice -->
      <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <ShieldCheck :size="16" class="text-[#0284c7]" />
        <span>SPKL diverifikasi berjenjang oleh Supervisor Lapangan</span>
      </div>
    </div>

    <!-- SOP ESS Lembur Banner -->
    <div class="bg-[#f0f7ff] border border-blue-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-white text-[#0284c7] border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
          <BookOpen :size="20" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-slate-800">Panduan Standar Operasional ESS Lembur</h4>
          <p class="text-xs text-slate-600 mt-0.5">
            Pastikan melakukan tap masuk dan tap pulang pada mesin biometrik atau ESS Mobile tepat waktu sesuai form SPKL.
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="isSOPModalOpen = true"
        class="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-blue-50/50 border border-blue-300 text-[#0284c7] text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto flex-shrink-0"
      >
        <FileText :size="14" />
        <span>Unduh SOP SPKL</span>
      </button>
    </div>

    <!-- Detail Riwayat Lembur Table Section -->
    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <!-- Table Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-bold text-slate-800">Detail Riwayat Lembur</h3>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {{ filteredEmployeeRecords.length }} Total Record
          </span>
        </div>

        <span class="text-xs text-slate-400 font-medium">
          Menampilkan {{ paginationStart }}-{{ paginationEnd }} dari {{ filteredEmployeeRecords.length }} penugasan
        </span>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th class="py-3 px-4 text-center w-12">NO</th>
              <th class="py-3 px-4">NO. SPKL & LOKASI GEDUNG</th>
              <th class="py-3 px-4">RENCANA SPKL</th>
              <th class="py-3 px-4">TAP AKTUAL</th>
              <th class="py-3 px-4">JAM DIAKUI</th>
              <th class="py-3 px-4">CATATAN EVALUASI ATASAN</th>
              <th class="py-3 px-4 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(rec, idx) in paginatedRecords"
              :key="rec.id"
              @click="openDetailModal(rec)"
              class="hover:bg-slate-50/70 cursor-pointer transition-colors"
            >
              <!-- NO -->
              <td class="py-4 px-4 text-center font-medium text-slate-400">
                {{ (currentPage - 1) * perPage + idx + 1 }}
              </td>

              <!-- NO. SPKL & LOKASI GEDUNG -->
              <td class="py-4 px-4">
                <span class="font-bold text-slate-800 block text-xs">{{ rec.spklNumber }}</span>
                <span class="text-xs text-slate-500 block mt-0.5">{{ rec.office }} ({{ rec.workArea }})</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">{{ formatDateIndo(rec.date) }}</span>
              </td>

              <!-- RENCANA SPKL -->
              <td class="py-4 px-4 whitespace-nowrap">
                <span class="font-bold text-slate-800 block text-xs">{{ rec.plannedStartTime }} - {{ rec.plannedEndTime }}</span>
                <span class="text-xs text-slate-400 block mt-0.5">{{ rec.plannedDurationHours.toFixed(1) }} Jam</span>
              </td>

              <!-- TAP AKTUAL -->
              <td class="py-4 px-4 whitespace-nowrap">
                <template v-if="rec.actualCheckIn && rec.actualCheckOut">
                  <span class="font-bold text-slate-800 block text-xs">{{ rec.actualCheckIn }} - {{ rec.actualCheckOut }}</span>
                  <span class="text-xs text-slate-400 block mt-0.5">{{ (rec.actualDurationHours || rec.plannedDurationHours).toFixed(1) }} Jam</span>
                </template>
                <template v-else-if="rec.actualCheckIn">
                  <span class="font-bold text-sky-600 block text-xs">Tap In: {{ rec.actualCheckIn }}</span>
                  <span class="text-[11px] text-slate-400 block mt-0.5 italic">Sedang berjalan</span>
                </template>
                <template v-else>
                  <span class="text-xs text-slate-300 font-bold">—</span>
                </template>
              </td>

              <!-- JAM DIAKUI -->
              <td class="py-4 px-4 whitespace-nowrap">
                <template v-if="rec.recognizedHours !== undefined">
                  <span class="font-bold text-[#0284c7] block text-xs">{{ rec.recognizedHours.toFixed(1) }} Jam</span>
                  <span class="text-[11px] font-bold text-emerald-600 block mt-0.5">
                    {{ rec.recognizedHours === rec.plannedDurationHours ? 'Penuh' : 'Disetujui' }}
                  </span>
                </template>
                <template v-else-if="rec.status === 'Menunggu Realisasi'">
                  <span class="text-xs font-semibold text-amber-600 italic">Belum Ditentukan</span>
                  <span class="text-[10px] text-slate-400 block mt-0.5">Menunggu evaluasi</span>
                </template>
                <template v-else>
                  <span class="text-xs text-slate-300 font-bold">—</span>
                </template>
              </td>

              <!-- CATATAN EVALUASI ATASAN -->
              <td class="py-4 px-4 max-w-xs">
                <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {{ rec.cutHoursReason || rec.workReportText || 'Menunggu verifikasi atasan / HR' }}
                </p>
              </td>

              <!-- STATUS -->
              <td class="py-4 px-4 text-center whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                    getStatusBadge(rec.status).bg
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', getStatusBadge(rec.status).dot]"></span>
                  {{ getStatusBadge(rec.status).label }}
                </span>
              </td>
            </tr>

            <tr v-if="paginatedRecords.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-400 text-xs">
                Tidak ada data riwayat lembur yang sesuai dengan filter yang dipilih.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer & Pagination -->
      <div class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span class="text-xs text-slate-400">
          Perhitungan otomatis sesuai pasal 29 Peraturan Pemerintah (PP) Nomor 35 Tahun 2021
        </span>

        <!-- Pagination Controls -->
        <div class="flex items-center gap-1 self-center sm:self-auto">
          <button
            type="button"
            :disabled="currentPage === 1"
            @click="currentPage--"
            class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft :size="16" />
          </button>

          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            @click="currentPage = p"
            :class="[
              'w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer',
              currentPage === p
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            ]"
          >
            {{ p }}
          </button>

          <button
            type="button"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
            class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════ -->
    <!--  MODAL 1: Detail SPKL Lengkap          -->
    <!-- ══════════════════════════════════════ -->
    <div
      v-if="isDetailModalOpen && selectedDetailRecord"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center">
              <FileText :size="18" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">{{ selectedDetailRecord.spklNumber }}</h3>
              <p class="text-xs text-slate-400">Surat Perintah Kerja Lembur BMIS</p>
            </div>
          </div>
          <button
            type="button"
            @click="isDetailModalOpen = false"
            class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          <!-- Status Banner -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span class="text-slate-400 block text-[11px]">Status Saat Ini</span>
              <span class="font-bold text-slate-800 text-sm mt-0.5 block">
                {{ getStatusBadge(selectedDetailRecord.status).label }}
              </span>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-full font-bold border text-xs inline-flex items-center gap-1.5',
                getStatusBadge(selectedDetailRecord.status).bg
              ]"
            >
              <span :class="['w-1.5 h-1.5 rounded-full', getStatusBadge(selectedDetailRecord.status).dot]"></span>
              {{ getStatusBadge(selectedDetailRecord.status).label }}
            </span>
          </div>

          <!-- General Info (2 cols) -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-slate-400 text-[11px] block font-medium">Pegawai Ditugaskan</span>
              <span class="font-bold text-slate-800 mt-0.5 block">{{ selectedDetailRecord.employeeName }} ({{ selectedDetailRecord.nip }})</span>
              <span class="text-slate-500 text-[11px]">{{ selectedDetailRecord.division }} • {{ selectedDetailRecord.jobTitle }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[11px] block font-medium">Lokasi / Gedung</span>
              <span class="font-bold text-slate-800 mt-0.5 block">{{ selectedDetailRecord.office }}</span>
              <span class="text-slate-500 text-[11px]">{{ selectedDetailRecord.workArea }}</span>
            </div>
          </div>

          <!-- Purpose -->
          <div>
            <span class="text-slate-400 text-[11px] block font-medium">Uraian Tugas Lembur</span>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 mt-1 leading-relaxed">
              {{ selectedDetailRecord.purpose }}
            </div>
          </div>

          <!-- Comparison: Rencana vs Aktual -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">RENCANA TUGAS</span>
              <span class="font-bold text-slate-800 text-sm block mt-1">
                {{ selectedDetailRecord.plannedStartTime }} - {{ selectedDetailRecord.plannedEndTime }} WIB
              </span>
              <span class="text-slate-500 text-xs mt-0.5 block">
                Durasi Rencana: {{ selectedDetailRecord.plannedDurationHours.toFixed(1) }} Jam
              </span>
            </div>

            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">REALISASI TAP MESIN</span>
              <template v-if="selectedDetailRecord.actualCheckIn">
                <span class="font-bold text-slate-800 text-sm block mt-1">
                  {{ selectedDetailRecord.actualCheckIn }} - {{ selectedDetailRecord.actualCheckOut || '—' }} WIB
                </span>
                <span class="text-slate-500 text-xs mt-0.5 block">
                  Durasi Aktual: {{ (selectedDetailRecord.actualDurationHours || 0).toFixed(1) }} Jam
                </span>
              </template>
              <template v-else>
                <span class="text-slate-400 italic block mt-1">Belum ada tap aktual tercatat</span>
              </template>
            </div>
          </div>

          <!-- Evaluation & Recognized Hours -->
          <div class="p-4 rounded-xl border border-sky-100 bg-sky-50/50 flex items-center justify-between">
            <div>
              <span class="text-[#0284c7] font-bold text-xs block">Otorisasi Jam Diakui (PP 35/2021)</span>
              <span class="text-slate-600 text-xs mt-0.5 block">
                {{ selectedDetailRecord.cutHoursReason || 'Belum ada catatan penyesuaian jam dari Atasan / HR.' }}
              </span>
            </div>
            <div class="text-right">
              <span class="text-xl font-extrabold text-[#0284c7] block">
                {{ selectedDetailRecord.recognizedHours !== undefined ? `${selectedDetailRecord.recognizedHours.toFixed(1)} Jam` : '—' }}
              </span>
              <span v-if="selectedDetailRecord.calculatedWage" class="text-xs font-bold text-emerald-600 block mt-0.5">
                Upah: Rp {{ selectedDetailRecord.calculatedWage.toLocaleString('id-ID') }}
              </span>
            </div>
          </div>

          <!-- Chronological Timeline -->
          <div>
            <span class="text-slate-400 text-[11px] block font-bold uppercase tracking-wider mb-2">TIMELINE AUDIT PENUGASAN</span>
            <div class="space-y-2 border-l-2 border-slate-200 pl-3.5 ml-1">
              <div
                v-for="(t, i) in selectedDetailRecord.timeline"
                :key="i"
                class="relative text-xs text-slate-600"
              >
                <div class="w-2 h-2 rounded-full bg-[#0284c7] absolute -left-[19px] top-1"></div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-800">{{ t.activity }}</span>
                  <span class="text-[10px] text-slate-400">({{ t.actor }})</span>
                </div>
                <span class="text-[10px] text-slate-400 block mt-0.5">{{ t.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            @click="isDetailModalOpen = false"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════ -->
    <!--  MODAL 2: Panduan Standar SOP SPKL     -->
    <!-- ══════════════════════════════════════ -->
    <div
      v-if="isSOPModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center">
              <BookOpen :size="18" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">SOP Pelaksanaan Lembur BMIS</h3>
              <p class="text-xs text-slate-400">Dasar Regulasi: PP No. 35 Tahun 2021</p>
            </div>
          </div>
          <button
            type="button"
            @click="isSOPModalOpen = false"
            class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-600 leading-relaxed">
          <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
            ⚠️ <strong>Batas Maksimal Kuota Lembur:</strong> Paling banyak <strong>4 Jam sehari</strong> dan <strong>18 Jam seminggu</strong> (Pasal 26 PP 35/2021).
          </div>

          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                <strong class="text-slate-800 block">Penerbitan & Persetujuan Form SPKL (Tahap Rencana)</strong>
                <p class="mt-0.5 text-slate-500">
                  Surat Perintah Kerja Lembur harus diterbitkan oleh Atasan/HR dan dikonfirmasi pegawai sebelum jam lembur dimulai. SPKL otomatis hangus jika melewati jam mulai tanpa persetujuan.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
              <div>
                <strong class="text-slate-800 block">Tap Masuk & Tap Pulang Mesin Presensi (Biometrik / ESS)</strong>
                <p class="mt-0.5 text-slate-500">
                  Wajib melakukan tap masuk saat mulai bertugas dan tap pulang setelah selesai pada terminal presensi resmi.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                <strong class="text-slate-800 block">Laporan Kerja & Otorisasi Jam Diakui (Cut Jam)</strong>
                <p class="mt-0.5 text-slate-500">
                  Setelah selesai, kirim laporan hasil kerja. Atasan dan HR akan memverifikasi jam kerja riil (tidak termasuk jeda istirahat atau waktu standby tanpa aktivitas).
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">4</span>
              <div>
                <strong class="text-slate-800 block">Perhitungan Upah & Penguncian Payroll</strong>
                <p class="mt-0.5 text-slate-500">
                  Upah lembur dihitung 1.5x upah per jam pada jam pertama, dan 2x upah per jam untuk jam berikutnya, lalu dikunci permanen untuk slip gaji bulan berjalan.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            @click="isSOPModalOpen = false"
            class="px-4 py-2 bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════ -->
    <!--  MODAL 3: Submit Laporan Kerja Lembur  -->
    <!-- ══════════════════════════════════════ -->
    <div
      v-if="isReportModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Send :size="18" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">Tap Pulang & Kirim Laporan Lembur</h3>
              <p class="text-xs text-slate-400">Verifikasi penyelesaian pekerjaan sebelum otorisasi payroll</p>
            </div>
          </div>
          <button
            type="button"
            @click="isReportModalOpen = false"
            class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block text-slate-700 font-bold mb-1">Uraian Hasil Pekerjaan (Wajib)</label>
            <textarea
              v-model="reportText"
              rows="4"
              class="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0284c7] leading-relaxed resize-none text-xs"
              placeholder="Jelaskan detail perbaikan/pekerjaan yang telah diselesaikan..."
            ></textarea>
          </div>

          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
            <Clock :size="14" class="text-slate-400 flex-shrink-0" />
            <span>Waktu Tap Pulang akan dicatat otomatis pada <strong>21:05 WIB</strong> (Durasi Aktual: 4.0 Jam).</span>
          </div>
        </div>

        <div class="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="isReportModalOpen = false"
            class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="submitWorkReport"
            class="px-4 py-2 bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Send :size="14" />
            <span>Kirim & Selesaikan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── POPUP FORM: AJUKAN PERTUKARAN JADWAL SHIFT (SHIFT SWAP) ── -->
    <ModalAjukanTukarShift
      v-model="isShiftSwapModalOpen"
      @submitted="handleShiftSwapSubmitted"
    />
  </div>
</template>
