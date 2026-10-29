<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
  Save,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  CalendarDays,
  MapPin,
  ClipboardCheck,
  Eye,
  Play,
  Lock,
  Ban,
  Timer,
  Users,
  Info,
  Check,
  Printer,
  Image as ImageIcon,
  SlidersHorizontal,
  Scale,
  Banknote,
  ShieldCheck,
} from 'lucide-vue-next';
import { mockOffices, mockDivisions } from '../../data/mockData';
import { useAdminOvertimeStore } from '../../composables/useOvertimeStore';
import type { OvertimeRecord, OvertimePersonnel } from '../../types/overtime';

const {
  adminRecords,
  personnel,
  totalSPKL,
  terlaksana,
  gugur,
  pendingRealisasi,
  pendingRencana,
  totalBiaya,
  totalJamSah,
  compliancePercentage,
  addNewSPKL,
  approveRencana,
  rejectRencana,
  markAutoExpired,
  simulateSubmitRealisasi,
  approveRealisasi,
  resetAdminData,
  generateSPKLNumber,
  calculateOvertimeWage,
} = useAdminOvertimeStore();

// ── Filters ──
const activeTab = ref<'all' | 'rencana' | 'realisasi'>('all');
const selectedPeriode = ref('current');
const selectedGedung = ref('');
const selectedDivisi = ref('');
const selectedStatus = ref('');
const searchQuery = ref('');

// ── Pagination ──
const currentPage = ref(1);
const perPage = ref(4);

watch([activeTab, selectedGedung, selectedDivisi, selectedStatus, searchQuery], () => {
  currentPage.value = 1;
});

// ── Filtered Records ──
const filteredRecords = computed(() => {
  return adminRecords.value.filter(rec => {
    // Tab filter
    if (activeTab.value === 'rencana') {
      if (rec.status !== 'Menunggu Approval Rencana' && rec.status !== 'Disetujui Rencana') return false;
    }
    if (activeTab.value === 'realisasi') {
      if (rec.status !== 'Menunggu Realisasi') return false;
    }
    // Dropdown filters
    if (selectedGedung.value && rec.office !== selectedGedung.value) return false;
    if (selectedDivisi.value && rec.division !== selectedDivisi.value) return false;
    if (selectedStatus.value && rec.status !== selectedStatus.value) return false;
    // Search
    const q = searchQuery.value.toLowerCase().trim();
    if (q) {
      const matchName = rec.employeeName.toLowerCase().includes(q);
      const matchSPKL = rec.spklNumber.toLowerCase().includes(q);
      const matchNIP = rec.nip.toLowerCase().includes(q);
      if (!matchName && !matchSPKL && !matchNIP) return false;
    }
    return true;
  });
});

const totalFiltered = computed(() => filteredRecords.value.length);
const totalPages = computed(() => Math.ceil(totalFiltered.value / perPage.value) || 1);
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredRecords.value.slice(start, start + perPage.value);
});

// ── Tab Counts ──
const tabRencanaCount = computed(() => adminRecords.value.filter(r =>
  r.status === 'Menunggu Approval Rencana' || r.status === 'Disetujui Rencana'
).length);
const tabRealisasiCount = computed(() => adminRecords.value.filter(r =>
  r.status === 'Menunggu Realisasi'
).length);

// ── Helpers ──
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substr(0, 2).toUpperCase();
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Payroll Locked': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'Menunggu Realisasi': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'Menunggu Approval Rencana': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Disetujui Rencana': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'Sedang Berjalan': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Auto-Expired': return 'bg-slate-100 text-slate-500 border-slate-200';
    case 'Ditolak': return 'bg-red-50 text-red-600 border-red-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Payroll Locked': return '● Payroll Locked';
    case 'Menunggu Realisasi': return '● Menunggu Realisasi';
    case 'Menunggu Approval Rencana': return '● Menunggu Approval';
    case 'Disetujui Rencana': return '● Disetujui (Rencana)';
    case 'Auto-Expired': return '● Gugur / Expired';
    case 'Ditolak': return '● Ditolak';
    case 'Sedang Berjalan': return '● Sedang Berjalan';
    default: return status;
  }
};

const formatCurrency = (val: number) => {
  return 'Rp ' + val.toLocaleString('id-ID');
};

// ── Toast ──
const toastMessage = ref('');
const isToastVisible = ref(false);
const showToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => { isToastVisible.value = false; }, 3500);
};

// ── Apply & Reset Filters ──
const applyFilters = () => {
  currentPage.value = 1;
  showToast('Filter diterapkan!');
};
const resetFilters = () => {
  selectedGedung.value = '';
  selectedDivisi.value = '';
  selectedStatus.value = '';
  searchQuery.value = '';
  activeTab.value = 'all';
  currentPage.value = 1;
};

// ══════════════════════════════════════
//  MODAL 1: Buat SPKL Baru
// ══════════════════════════════════════
const isFormModalOpen = ref(false);
const formSPKLNumber = ref('');
const formDate = ref('');
const formOffice = ref('');
const formWorkArea = ref('');
const formStartTime = ref('');
const formEndTime = ref('');
const formPurpose = ref('');
const formSelectedPersonnel = ref<string[]>([]);
const personnelSearch = ref('');
const personnelFilterJabatan = ref('');
const personnelFilterDivisi = ref('');

const formDuration = computed(() => {
  if (!formStartTime.value || !formEndTime.value) return 0;
  const [sh, sm] = formStartTime.value.split(':').map(Number);
  const [eh, em] = formEndTime.value.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const diff = endMin - startMin;
  return diff > 0 ? Math.round(diff / 60 * 10) / 10 : 0;
});

const formDurationExceedsDaily = computed(() => formDuration.value > 4);

// ── Personnel Filtering Bound to Selected Office (Option 1) ──
const officePersonnel = computed(() => {
  if (!formOffice.value) return [];
  return personnel.value.filter(p => p.office === formOffice.value);
});

const availableDivisionsForOffice = computed(() => {
  if (!formOffice.value) return mockDivisions;
  const divs = [...new Set(officePersonnel.value.map(p => p.division))];
  return divs.length > 0 ? divs : mockDivisions;
});

const isPersonnelFilterComplete = computed(() => {
  if (!formOffice.value) return false;
  const hasDivisi = Boolean(personnelFilterDivisi.value);
  const hasSearch = personnelSearch.value.trim().length >= 2;
  return hasDivisi || hasSearch;
});

const availableJobTitles = computed(() => {
  if (!formOffice.value) return [];
  if (!personnelFilterDivisi.value) {
    return [...new Set(officePersonnel.value.map(p => p.jobTitle))];
  }
  return [...new Set(
    officePersonnel.value
      .filter(p => p.division === personnelFilterDivisi.value)
      .map(p => p.jobTitle)
  )];
});

// Reset personnel filters when building/office changes
watch(formOffice, (newOffice, oldOffice) => {
  if (oldOffice && newOffice !== oldOffice) {
    formSelectedPersonnel.value = [];
    personnelFilterDivisi.value = '';
    personnelFilterJabatan.value = '';
    personnelSearch.value = '';
  }
});

watch(personnelFilterDivisi, (newDiv) => {
  if (newDiv && personnelFilterJabatan.value) {
    const valid = officePersonnel.value.some(p => p.division === newDiv && p.jobTitle === personnelFilterJabatan.value);
    if (!valid) {
      personnelFilterJabatan.value = '';
    }
  }
});

const filteredPersonnel = computed(() => {
  if (!isPersonnelFilterComplete.value) {
    return [];
  }
  return officePersonnel.value.filter(p => {
    const q = personnelSearch.value.toLowerCase().trim();
    if (q && !p.name.toLowerCase().includes(q) && !p.nip.toLowerCase().includes(q)) return false;
    if (personnelFilterJabatan.value && p.jobTitle !== personnelFilterJabatan.value) return false;
    if (personnelFilterDivisi.value && p.division !== personnelFilterDivisi.value) return false;
    return true;
  });
});

const selectedPersonnelObjects = computed(() => {
  return personnel.value.filter(p => formSelectedPersonnel.value.includes(p.id));
});

const wouldExceedQuota = (person: OvertimePersonnel) => {
  return (person.weeklyQuotaUsed + formDuration.value) > person.weeklyQuotaMax;
};

const openFormModal = () => {
  formSPKLNumber.value = generateSPKLNumber();
  formDate.value = new Date().toISOString().split('T')[0];
  formOffice.value = 'Menara 1 BTN';
  formWorkArea.value = '';
  formStartTime.value = '17:00';
  formEndTime.value = '20:00';
  formPurpose.value = '';
  formSelectedPersonnel.value = [];
  personnelSearch.value = '';
  personnelFilterJabatan.value = '';
  personnelFilterDivisi.value = '';
  isFormModalOpen.value = true;
};

const togglePersonnel = (id: string) => {
  const idx = formSelectedPersonnel.value.indexOf(id);
  if (idx >= 0) {
    formSelectedPersonnel.value.splice(idx, 1);
  } else {
    const person = personnel.value.find(p => p.id === id);
    if (person && !wouldExceedQuota(person)) {
      formSelectedPersonnel.value.push(id);
    }
  }
};

const submitNewSPKL = () => {
  if (!formDate.value || !formOffice.value || !formStartTime.value || !formEndTime.value || !formPurpose.value) {
    showToast('Harap lengkapi semua field yang wajib diisi!');
    return;
  }
  if (formSelectedPersonnel.value.length === 0) {
    showToast('Pilih minimal satu personel yang akan ditugaskan!');
    return;
  }
  if (formDurationExceedsDaily.value) {
    showToast('Durasi lembur melebihi batas maksimal 4 jam/hari (PP 35/2021)!');
    return;
  }

  // Create one SPKL per selected personnel
  formSelectedPersonnel.value.forEach((empId, idx) => {
    const person = personnel.value.find(p => p.id === empId);
    if (!person) return;
    const spklNum = idx === 0
      ? formSPKLNumber.value
      : `${formSPKLNumber.value.replace(/\d{3}$/, '')}${String(adminRecords.value.length + idx + 1).padStart(3, '0')}`;
    const newRecord: OvertimeRecord = {
      id: `adm-spkl-${Date.now()}-${idx}`,
      spklNumber: spklNum,
      date: formDate.value,
      office: formOffice.value,
      workArea: formWorkArea.value,
      purpose: formPurpose.value,
      plannedStartTime: formStartTime.value,
      plannedEndTime: formEndTime.value,
      plannedDurationHours: formDuration.value,
      employeeId: person.id,
      employeeName: person.name,
      nip: person.nip,
      division: person.division,
      jobTitle: person.jobTitle,
      calculatedWage: 0,
      isManagerialExempt: false,
      status: 'Menunggu Approval Rencana',
      timeline: [
        { time: new Date().toISOString(), activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      ],
    };
    addNewSPKL(newRecord);
  });

  isFormModalOpen.value = false;
  showToast(`${formSelectedPersonnel.value.length} SPKL berhasil diterbitkan & diajukan!`);
};

// ══════════════════════════════════════
//  MODAL 2: Verifikasi Realisasi & Cut Jam
// ══════════════════════════════════════
const isVerifikasiModalOpen = ref(false);
const verifikasiRecord = ref<OvertimeRecord | null>(null);
const verifikasiJamDiakui = ref(0);
const verifikasiAlasan = ref('');

const previewWage = computed(() => {
  if (!verifikasiRecord.value) return 0;
  return calculateOvertimeWage(verifikasiJamDiakui.value, verifikasiRecord.value.isManagerialExempt);
});

const openVerifikasiModal = (rec: OvertimeRecord) => {
  verifikasiRecord.value = rec;
  verifikasiJamDiakui.value = rec.actualDurationHours || rec.plannedDurationHours;
  verifikasiAlasan.value = '';
  isVerifikasiModalOpen.value = true;
};

const submitVerifikasi = () => {
  if (!verifikasiRecord.value) return;
  if (verifikasiJamDiakui.value <= 0) {
    showToast('Jam yang diakui harus lebih dari 0!');
    return;
  }
  approveRealisasi(verifikasiRecord.value.id, verifikasiJamDiakui.value, verifikasiAlasan.value);
  isVerifikasiModalOpen.value = false;
  showToast(`Realisasi ${verifikasiRecord.value.spklNumber} diverifikasi & dikunci ke Payroll!`);
};

// ══════════════════════════════════════
//  MODAL 3: Detail SPKL
// ══════════════════════════════════════
const isDetailModalOpen = ref(false);
const detailRecord = ref<OvertimeRecord | null>(null);

const openDetailModal = (rec: OvertimeRecord) => {
  detailRecord.value = rec;
  isDetailModalOpen.value = true;
};

// ── Flowchart Action Handlers ──
const handleApproveRencana = (rec: OvertimeRecord) => {
  approveRencana(rec.id);
  showToast(`Rencana ${rec.spklNumber} disetujui! Pegawai dapat memulai lembur.`);
};

const handleRejectRencana = (rec: OvertimeRecord) => {
  rejectRencana(rec.id, 'Dibatalkan oleh HR/Atasan');
  showToast(`Penugasan ${rec.spklNumber} dibatalkan.`);
};

const handleMarkAutoExpired = (rec: OvertimeRecord) => {
  markAutoExpired(rec.id);
  showToast(`SPKL ${rec.spklNumber} ditandai hangus otomatis (lewat jam mulai).`);
};

const handleSimulateRealisasi = (rec: OvertimeRecord) => {
  simulateSubmitRealisasi(rec.id);
  showToast(`Pegawai tap pulang & kirim laporan untuk ${rec.spklNumber}. Siap diverifikasi!`);
};

const handlePrintSPKL = () => {
  window.print();
};

// ── Export CSV ──
const handleExport = () => {
  const headers = [
    'No', 'No. SPKL', 'Nama Pegawai', 'NIP', 'Divisi', 'Gedung', 'Tanggal',
    'Rencana (Jam)', 'Tap Aktual (Jam)', 'Jam Diakui', 'Upah Lembur (Rp)', 'Status'
  ];
  const rows = adminRecords.value
    .filter(r => r.status === 'Payroll Locked')
    .map((r, i) => [
      i + 1,
      `"${r.spklNumber}"`,
      `"${r.employeeName}"`,
      `"${r.nip}"`,
      `"${r.division}"`,
      `"${r.office}"`,
      `"${r.date}"`,
      `"${r.plannedStartTime} - ${r.plannedEndTime} (${r.plannedDurationHours}j)"`,
      r.actualCheckIn ? `"${r.actualCheckIn} - ${r.actualCheckOut} (${r.actualDurationHours}j)"` : '"-"',
      r.recognizedHours ?? '-',
      r.calculatedWage,
      `"${r.status}"`
    ]);

  const csvContent = '\uFEFF' + [
    `"REKAP PAYROLL LEMBUR - BMIS"`,
    `"Periode: Oktober 2026"`,
    `"Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}"`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Payroll_Lembur_BMIS_Okt2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Rekap Payroll Lembur berhasil diekspor ke CSV!');
};
</script>

<template>
  <div class="space-y-5 max-w-7xl mx-auto">

    <!-- ═══ Breadcrumb ═══ -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500">
      <router-link to="/lembur/admin" class="hover:text-blue-600 transition-colors">Lembur</router-link>
      <span class="text-slate-300">›</span>
      <span class="text-blue-600 font-semibold">Rekap & Otorisasi Lembur</span>
    </nav>

    <!-- ═══ Header ═══ -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">Manajemen & Rekap Lembur</h1>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-full border border-slate-200">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Regulasi PP 35/2021
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
          Penerbitan SPKL, penegakan limit kuota PP 35/2021, evaluasi jam
          yang diakui, dan otorisasi penggajian terpadu
          seluruh gardu & unit kerja.
        </p>
      </div>
      <div class="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
        <button
          type="button"
          @click="handleExport"
          class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
        >
          <Download :size="14" />
          <span>Ekspor Rekap Payroll</span>
        </button>
        <button
          type="button"
          @click="openFormModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle :size="14" />
          <span>Buat SPKL Baru</span>
        </button>
      </div>
    </div>

    <!-- ═══ 3 KPI Cards ═══ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Total SPKL Bulan Ini -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL SPKL BULAN INI</span>
          <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100">{{ totalSPKL }} Tugas</span>
        </div>
        <div class="flex items-end justify-between">
          <div>
            <div class="text-3xl font-black text-slate-800 tracking-tight">{{ totalSPKL }}</div>
            <div class="flex items-center gap-2 mt-2 text-xs">
              <span class="flex items-center gap-1.5 font-medium text-slate-700">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                {{ terlaksana }} Terlaksana
              </span>
              <span class="text-slate-300">-</span>
              <span class="font-medium text-red-500">{{ gugur }} Gugur</span>
            </div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-blue-50/60 border border-blue-100/40 text-blue-500 flex items-center justify-center">
            <ClipboardCheck :size="18" />
          </div>
        </div>
      </div>

      <!-- Approval Realisasi -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">APPROVAL REALISASI</span>
          <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100">Butuh Verifikasi</span>
        </div>
        <div class="flex items-end justify-between">
          <div>
            <div class="text-3xl font-black text-blue-600 tracking-tight">{{ pendingRealisasi }}</div>
            <div class="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <Info :size="13" class="text-slate-400" />
              <span>Perlu evaluasi jam diakui</span>
            </div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-blue-50/60 border border-blue-100/40 text-blue-500 flex items-center justify-center">
            <SlidersHorizontal :size="18" />
          </div>
        </div>
      </div>

      <!-- Total Biaya Lembur -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL BIAYA LEMBUR</span>
          <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Payroll Ready
          </span>
        </div>
        <div class="flex items-end justify-between">
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ESTIMASI</div>
            <div class="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{{ formatCurrency(totalBiaya) }}</div>
            <div class="flex items-center gap-4 mt-2 text-xs">
              <span class="font-bold text-slate-800">{{ totalJamSah }} Jam Sah</span>
              <span class="text-slate-400 font-medium">Limit Kuota Aman</span>
            </div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Banknote :size="18" />
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Filter & Tabs Card ═══ -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <!-- 4 Filter Dropdowns with Uppercase Headers -->
      <div class="flex flex-wrap xl:flex-nowrap items-end gap-3">
        <!-- Periode -->
        <div class="flex-1 min-w-[170px]">
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">PERIODE</label>
          <div class="relative">
            <CalendarDays :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              v-model="selectedPeriode"
              class="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="current">Bulan ini (Okt 2026)</option>
              <option value="prev">Bulan lalu</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">⌵</span>
          </div>
        </div>

        <!-- Gedung / Lokasi -->
        <div class="flex-1 min-w-[170px]">
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">GEDUNG / LOKASI</label>
          <div class="relative">
            <Building2 :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              v-model="selectedGedung"
              class="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="">Semua Gedung</option>
              <option v-for="g in mockOffices" :key="g" :value="g">{{ g }}</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">⌵</span>
          </div>
        </div>

        <!-- Divisi / Bagian -->
        <div class="flex-1 min-w-[170px]">
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">DIVISI / BAGIAN</label>
          <div class="relative">
            <Layers :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              v-model="selectedDivisi"
              class="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="">Semua Divisi</option>
              <option v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">⌵</span>
          </div>
        </div>

        <!-- Status SPKL -->
        <div class="flex-1 min-w-[170px]">
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">STATUS SPKL</label>
          <div class="relative">
            <SlidersHorizontal :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              v-model="selectedStatus"
              class="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="">Semua Status</option>
              <option value="Menunggu Approval Rencana">Menunggu Approval</option>
              <option value="Disetujui Rencana">Disetujui Rencana</option>
              <option value="Menunggu Realisasi">Menunggu Realisasi</option>
              <option value="Payroll Locked">Payroll Locked</option>
              <option value="Auto-Expired">Gugur / Expired</option>
              <option value="Ditolak">Ditolak</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">⌵</span>
          </div>
        </div>

        <!-- Action buttons: Apply & Reset -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            @click="applyFilters"
            class="inline-flex items-center gap-1.5 h-9 px-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal :size="13" />
            Apply
          </button>
          <button
            type="button"
            @click="resetFilters"
            class="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            title="Reset Filter"
          >
            <RefreshCw :size="13" />
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          @click="activeTab = 'all'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'all'
              ? 'bg-white border border-slate-200 text-slate-800 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          ]"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="activeTab === 'all' ? 'bg-blue-600' : 'bg-slate-300'"></span>
          Semua SPKL & Rekap Payroll
        </button>

        <button
          type="button"
          @click="activeTab = 'rencana'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'rencana'
              ? 'bg-white border border-slate-200 text-slate-800 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          ]"
        >
          <span v-if="activeTab === 'rencana'" class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Approval Rencana
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">{{ tabRencanaCount }}</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'realisasi'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'realisasi'
              ? 'bg-white border border-slate-200 text-slate-800 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          ]"
        >
          <span v-if="activeTab === 'realisasi'" class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          Approval Realisasi & Cut Jam
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">{{ tabRealisasiCount }}</span>
        </button>
      </div>
    </div>

    <!-- ═══ Tabel SPKL ═══ -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <!-- Table Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-slate-100 gap-3">
        <div>
          <h2 class="text-sm font-black text-slate-800">Daftar SPKL & Rekapitulasi Upah Lembur</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">Daftar penugasan jam kerja tambahan terotorisasi</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <Search :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama karyawan / No. SPKL..."
              class="h-8 w-[240px] pl-9 pr-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div class="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            Tampilkan {{ (currentPage - 1) * perPage + 1 }}-{{ Math.min(currentPage * perPage, totalFiltered) }} dari {{ totalFiltered }}
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage <= 1"
              class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft :size="14" />
            </button>
            <button
              type="button"
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="bg-slate-50/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th class="p-3 pl-5">No. SPKL & Pegawai</th>
              <th class="p-3">Gedung</th>
              <th class="p-3">Rencana</th>
              <th class="p-3">Tap Aktual</th>
              <th class="p-3">Jam Diakui</th>
              <th class="p-3 text-right">Upah Lembur (Rp)</th>
              <th class="p-3 text-center">Status</th>
              <th class="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="rec in paginatedRecords"
              :key="rec.id"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <!-- No. SPKL & Pegawai -->
              <td class="p-3 pl-5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {{ getInitials(rec.employeeName) }}
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 text-xs">{{ rec.employeeName }}</div>
                    <div class="text-[10px] text-slate-400 font-medium">{{ rec.spklNumber }} • {{ rec.division }}</div>
                  </div>
                </div>
              </td>

              <!-- Gedung -->
              <td class="p-3 text-xs text-slate-700 font-medium">{{ rec.office }}</td>

              <!-- Rencana -->
              <td class="p-3">
                <div class="text-xs font-semibold text-slate-800">{{ rec.plannedStartTime }} - {{ rec.plannedEndTime }}</div>
                <div class="text-[10px] text-slate-400">({{ rec.plannedDurationHours.toFixed(1) }}j)</div>
              </td>

              <!-- Tap Aktual -->
              <td class="p-3">
                <template v-if="rec.actualCheckIn">
                  <div
                    class="text-xs font-semibold"
                    :class="rec.status === 'Menunggu Realisasi' ? 'text-blue-600' : 'text-slate-800'"
                  >
                    {{ rec.actualCheckIn }} - {{ rec.actualCheckOut }}
                  </div>
                  <div
                    class="text-[10px]"
                    :class="rec.status === 'Menunggu Realisasi' ? 'text-blue-600 font-semibold' : 'text-slate-400'"
                  >
                    ({{ Number(rec.actualDurationHours).toFixed(1) }}j)
                  </div>
                </template>
                <span v-else class="text-[11px] text-slate-300 italic">—</span>
              </td>

              <!-- Jam Diakui -->
              <td class="p-3">
                <template v-if="rec.recognizedHours != null">
                  <span class="text-xs font-bold text-blue-600">{{ Number(rec.recognizedHours).toFixed(1) }} Jam</span>
                </template>
                <span v-else class="text-[11px] text-slate-400 italic">Belum Ditentukan</span>
              </td>

              <!-- Upah Lembur -->
              <td class="p-3 text-right">
                <template v-if="rec.calculatedWage > 0">
                  <span class="text-xs font-bold text-slate-800">{{ formatCurrency(rec.calculatedWage) }}</span>
                </template>
                <template v-else-if="rec.isManagerialExempt">
                  <span class="text-xs font-bold text-slate-500">Rp 0</span>
                  <div class="text-[9px] text-blue-500 font-semibold">Exempt (Cuti Pengganti)</div>
                </template>
                <span v-else class="text-[11px] text-slate-400 font-normal">Menunggu</span>
              </td>

              <!-- Status -->
              <td class="p-3 text-center">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap',
                    getStatusBadgeClass(rec.status)
                  ]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="[
                      rec.status === 'Payroll Locked' || rec.status === 'Menunggu Realisasi' || rec.status === 'Disetujui Rencana' ? 'bg-blue-600' :
                      rec.status === 'Menunggu Approval Rencana' ? 'bg-amber-500' :
                      rec.status === 'Ditolak' ? 'bg-red-500' :
                      rec.status === 'Sedang Berjalan' ? 'bg-cyan-500' : 'bg-slate-400'
                    ]"
                  ></span>
                  {{ rec.status }}
                </span>
              </td>

              <!-- Aksi -->
              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- Waiting Realization -> Verifikasi Jam in Blue -->
                  <button
                    v-if="rec.status === 'Menunggu Realisasi'"
                    type="button"
                    @click="openVerifikasiModal(rec)"
                    class="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Check :size="13" />
                    <span>Verifikasi Jam</span>
                  </button>

                  <!-- Waiting Rencana in Rencana Tab -> Setujui / Tolak -->
                  <template v-else-if="activeTab === 'rencana' && rec.status === 'Menunggu Approval Rencana'">
                    <button
                      type="button"
                      @click="handleApproveRencana(rec)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                    >
                      <Check :size="12" />
                      Setujui
                    </button>
                    <button
                      type="button"
                      @click="handleRejectRencana(rec)"
                      class="inline-flex items-center gap-1 px-2 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      <X :size="12" />
                      Tolak
                    </button>
                  </template>

                  <!-- Detail Button for others -->
                  <button
                    v-else
                    type="button"
                    @click="openDetailModal(rec)"
                    class="inline-flex items-center justify-center px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-xs transition-all cursor-pointer"
                  >
                    Detil
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-t border-slate-100 bg-white gap-2">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck :size="14" class="text-blue-600 flex-shrink-0" />
          <span>Perhitungan otomatis sesuai pasal 29 Peraturan Pemerintah (PP) Nomor 35 Tahun 2021</span>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto">
          <span>Menampilkan {{ paginatedRecords.length }} dari {{ totalFiltered }} Penugasan</span>
          <div class="flex items-center gap-1">
            <button
              v-for="p in Math.min(totalPages, 3)"
              :key="p"
              type="button"
              @click="currentPage = p"
              :class="[
                'w-6 h-6 flex items-center justify-center rounded text-xs transition-colors cursor-pointer',
                currentPage === p ? 'font-bold text-slate-800' : 'text-slate-400 hover:text-slate-700'
              ]"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Banner Kepatuhan Kuota PP 35/2021 ═══ -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Scale :size="20" />
        </div>
        <div>
          <div class="text-sm font-bold text-slate-800">Batas Maksimum Lembur Pegawai BMIS</div>
          <div class="text-xs text-slate-500 mt-0.5">Maks 4 jam/hari dan 18 jam/minggu (tidak termasuk hari libur resmi) sesuai PP 35/2021.</div>
        </div>
      </div>
      <div class="flex items-center gap-5 flex-shrink-0">
        <div>
          <div class="flex items-center justify-end gap-1.5">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KEPATUHAN KUOTA</span>
            <span class="text-xs font-black text-blue-600">{{ compliancePercentage }}%</span>
          </div>
          <div class="text-[10px] text-slate-400 text-right mt-0.5">0 Insiden Pelanggaran</div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600 rounded-full transition-all" :style="{ width: compliancePercentage + '%' }"></div>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-blue-600 bg-blue-50/50 border border-blue-200">Batas Aman</span>
        </div>
      </div>
    </div>


    <!-- ═══════════════════════════════════════════════════════ -->
    <!--  MODAL 1: Penerbitan SPKL Baru                       -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="isFormModalOpen"
        class="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-bmis-blue flex items-center justify-center">
                <ClipboardCheck :size="20" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-extrabold text-slate-800">Penerbitan Surat Perintah Kerja Lembur (SPKL)</h3>
                  <span class="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-200">DRAFT</span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Formulir penugasan lembur resmi dengan validasi kuota regulasi PP No. 35/2021.</p>
              </div>
            </div>
            <button type="button" @click="isFormModalOpen = false" class="text-slate-400 hover:text-slate-700 transition-colors">
              <X :size="18" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-5 overflow-y-auto text-xs">
            <!-- Row 1: Nomor SPKL & Tanggal -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Nomor SPKL (Otomatis) <span class="text-[10px] text-slate-400 normal-case tracking-normal font-medium ml-1">Sistem Penomoran</span></label>
                <div class="flex items-center gap-2 h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span class="text-slate-400 font-bold">#</span>
                  <span class="text-sm font-bold text-slate-700">{{ formSPKLNumber }}</span>
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Tanggal Pelaksanaan <span class="text-red-500">*</span></label>
                <input
                  v-model="formDate"
                  type="date"
                  class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-bmis-teal transition-colors"
                  placeholder="Pilih tanggal pelaksanaan..."
                />
              </div>
            </div>

            <!-- Row 2: Gedung & Area -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Gedung / Lokasi <span class="text-red-500">*</span></label>
                <div class="relative">
                  <Building2 :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    v-model="formOffice"
                    class="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-bmis-teal transition-colors"
                  >
                    <option value="">-- Pilih Gedung / Lokasi --</option>
                    <option v-for="g in mockOffices" :key="g" :value="g">{{ g }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Area / Lantai Kerja <span class="text-red-500">*</span></label>
                <div class="relative">
                  <MapPin :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    v-model="formWorkArea"
                    type="text"
                    placeholder="Contoh: Lantai 4 - Ruang Chiller Line B"
                    class="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-bmis-teal transition-colors"
                  />
                </div>
              </div>
            </div>

            <!-- Waktu Rencana Pelaksanaan -->
            <div class="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Clock :size="15" class="text-bmis-blue" />
                  <span class="text-xs font-black text-slate-800 uppercase tracking-wider">Waktu Rencana Pelaksanaan</span>
                </div>
                <span
                  class="text-xs font-bold px-2.5 py-1 rounded-full"
                  :class="formDurationExceedsDaily ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'"
                >
                  ● Durasi: {{ formDuration.toFixed(1) }} Jam
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Jam Mulai (WIB)</label>
                  <div class="relative">
                    <Clock :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      v-model="formStartTime"
                      type="time"
                      class="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-bmis-teal transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label class="block font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Jam Selesai (WIB)</label>
                  <div class="relative">
                    <Clock :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      v-model="formEndTime"
                      type="time"
                      class="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-bmis-teal transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div v-if="formDurationExceedsDaily" class="flex items-center gap-2 text-[11px] text-red-600 font-bold">
                <AlertTriangle :size="13" />
                <span>Durasi melebihi batas maksimal 4 jam/hari sesuai PP 35/2021!</span>
              </div>
            </div>

            <!-- Uraian Tugas -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Uraian Tugas / Alasan Kebutuhan Lembur <span class="text-red-500">*</span></label>
                <span class="text-[11px] text-slate-400 font-medium">{{ formPurpose.length }} / 250 Karakter</span>
              </div>
              <textarea
                v-model="formPurpose"
                rows="3"
                maxlength="250"
                placeholder="Tuliskan deskripsi pekerjaan teknis atau kondisi darurat yang wajib diselesaikan sebelum besok pagi..."
                class="w-full p-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-bmis-teal resize-none transition-colors"
              ></textarea>
            </div>

            <!-- Pilih Personel (Terkunci ke Gedung / Lokasi di Atas) -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <Users :size="15" class="text-bmis-blue" />
                  <span class="text-xs font-black text-slate-800 uppercase tracking-wider">Pilih Personel yang Ditugaskan</span>
                </div>
                <div class="flex items-center gap-2">
                  <!-- Active Office Indicator Badge -->
                  <span
                    v-if="formOffice"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-bmis-blue border border-blue-200"
                  >
                    <Building2 :size="11" />
                    Lokasi: {{ formOffice }}
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    <AlertTriangle :size="11" />
                    Pilih Gedung dahulu
                  </span>
                  <span class="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock :size="11" />
                    Maks. 18 Jam / Minggu
                  </span>
                </div>
              </div>

              <!-- Personnel Search & Filters -->
              <div class="flex flex-wrap items-center gap-2 mb-3">
                <!-- Dropdown Divisi (Terkunci ke Gedung) -->
                <select
                  v-model="personnelFilterDivisi"
                  :disabled="!formOffice"
                  class="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-bmis-teal disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  <option value="">{{ formOffice ? '-- Pilih Divisi (' + availableDivisionsForOffice.length + ') --' : '-- Pilih Gedung Dahulu --' }}</option>
                  <option v-for="d in availableDivisionsForOffice" :key="d" :value="d">{{ d }}</option>
                </select>

                <!-- Dropdown Jabatan (Cascading dari Divisi & Gedung) -->
                <select
                  v-model="personnelFilterJabatan"
                  :disabled="!formOffice || !personnelFilterDivisi"
                  class="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-bmis-teal disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  <option value="">{{ !formOffice ? '-- Pilih Gedung Dahulu --' : personnelFilterDivisi ? '-- Pilih Jabatan --' : '-- Pilih Divisi Dahulu --' }}</option>
                  <option v-for="j in availableJobTitles" :key="j" :value="j">{{ j }}</option>
                </select>

                <!-- Search Nama / NIP -->
                <div class="relative flex-1 min-w-[170px]">
                  <Search :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    v-model="personnelSearch"
                    :disabled="!formOffice"
                    type="text"
                    :placeholder="formOffice ? 'Cari nama / NIP di ' + formOffice + '...' : 'Pilih gedung di atas dahulu...'"
                    class="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-bmis-teal disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  />
                </div>

                <button
                  type="button"
                  @click="personnelSearch = ''; personnelFilterJabatan = ''; personnelFilterDivisi = ''"
                  class="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-slate-700 transition-colors cursor-pointer"
                  title="Reset Filter Personel"
                >
                  <RefreshCw :size="13" />
                </button>
              </div>

              <!-- Selected Personnel Chips Summary (Jika ada yang sudah dipilih) -->
              <div v-if="selectedPersonnelObjects.length > 0" class="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5 mb-2.5">
                <div class="flex items-center justify-between text-[11px] font-bold text-bmis-blue">
                  <span class="flex items-center gap-1.5">
                    <CheckCircle2 :size="13" />
                    {{ selectedPersonnelObjects.length }} Personel Telah Dipilih:
                  </span>
                  <button
                    type="button"
                    @click="formSelectedPersonnel = []"
                    class="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="p in selectedPersonnelObjects"
                    :key="p.id"
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-blue-200 text-slate-700 text-[10px] font-semibold rounded-md shadow-2xs"
                  >
                    <span>{{ p.name }}</span>
                    <span class="text-slate-400">({{ p.jobTitle }})</span>
                    <button
                      type="button"
                      @click.stop="togglePersonnel(p.id)"
                      class="text-slate-400 hover:text-red-500 cursor-pointer"
                      title="Batalkan pilihan"
                    >
                      <X :size="11" />
                    </button>
                  </span>
                </div>
              </div>

              <!-- Count Badges -->
              <div class="flex items-center justify-between mb-2">
                <span v-if="isPersonnelFilterComplete" class="text-[11px] text-slate-500 font-medium">
                  Menampilkan {{ filteredPersonnel.length }} dari {{ officePersonnel.length }} personel di {{ formOffice }}
                </span>
                <span v-else-if="!formOffice" class="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle :size="12" />
                  Tentukan Gedung / Lokasi di atas terlebih dahulu
                </span>
                <span v-else class="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                  <Info :size="12" />
                  Pilih Divisi atau cari nama/NIP di {{ formOffice }}
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-bmis-blue text-[11px] font-bold rounded-full border border-blue-200">
                  <Users :size="12" />
                  {{ formSelectedPersonnel.length }} Personel Terpilih
                </span>
              </div>

              <!-- STATE 1: Gedung belum dipilih di atas -->
              <div
                v-if="!formOffice"
                class="py-8 px-4 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl space-y-2"
              >
                <div class="w-10 h-10 rounded-full bg-blue-50 text-bmis-blue flex items-center justify-center mx-auto">
                  <Building2 :size="18" />
                </div>
                <div class="text-xs font-bold text-slate-700">Pilih Gedung / Lokasi di Atas Terlebih Dahulu</div>
                <p class="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Silakan tentukan <strong>Gedung / Lokasi</strong> pada form di atas. Sistem akan otomatis memfilter personel yang bertugas di lokasi tersebut untuk menjaga performa cepat tanpa memuat ribuan data.
                </p>
              </div>

              <!-- STATE 2: Gedung sudah dipilih tapi filter divisi/search belum diisi -->
              <div
                v-else-if="!isPersonnelFilterComplete"
                class="py-8 px-4 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl space-y-2"
              >
                <div class="w-10 h-10 rounded-full bg-blue-50 text-bmis-blue flex items-center justify-center mx-auto">
                  <Filter :size="18" />
                </div>
                <div class="text-xs font-bold text-slate-700">Filter Personel di {{ formOffice }}</div>
                <p class="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Silakan pilih <strong>Divisi</strong> atau ketik <strong>Nama/NIP</strong> untuk menampilkan personel yang bertugas di <strong>{{ formOffice }}</strong> (Total: {{ officePersonnel.length }} personel terdaftar).
                </p>
              </div>

              <!-- STATE 3: Filter lengkap tapi tidak ada yang cocok -->
              <div
                v-else-if="filteredPersonnel.length === 0"
                class="py-8 px-4 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl space-y-1"
              >
                <Users :size="20" class="mx-auto text-slate-400" />
                <div class="text-xs font-bold text-slate-700">Tidak ada personel ditemukan di {{ formOffice }}</div>
                <p class="text-[11px] text-slate-400">Tidak ada data personel aktif di {{ formOffice }} untuk kombinasi filter ini.</p>
              </div>

              <!-- STATE 3: Daftar Personel yang sudah terfilter -->
              <div v-else class="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                <div
                  v-for="person in filteredPersonnel"
                  :key="person.id"
                  @click="togglePersonnel(person.id)"
                  :class="[
                    'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                    formSelectedPersonnel.includes(person.id)
                      ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-200'
                      : wouldExceedQuota(person)
                        ? 'bg-red-50/30 border-red-100 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  ]"
                >
                  <!-- Checkbox Indicator -->
                  <div
                    :class="[
                      'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      formSelectedPersonnel.includes(person.id)
                        ? 'bg-bmis-blue border-bmis-blue'
                        : 'border-slate-300 bg-white'
                    ]"
                  >
                    <CheckCircle2 v-if="formSelectedPersonnel.includes(person.id)" :size="12" class="text-white" />
                  </div>
                  <input
                    type="checkbox"
                    :checked="formSelectedPersonnel.includes(person.id)"
                    :disabled="wouldExceedQuota(person)"
                    class="sr-only"
                  />

                  <!-- Avatar -->
                  <div class="w-9 h-9 rounded-full bg-bmis-blue/10 text-bmis-blue flex items-center justify-center text-[11px] font-black flex-shrink-0">
                    {{ person.initials }}
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-800 text-xs">{{ person.name }}</span>
                      <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{{ person.jobTitle }}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-medium mt-0.5">{{ person.nip }} • {{ person.division }}</div>
                  </div>

                  <!-- Quota -->
                  <div class="text-right flex-shrink-0">
                    <div class="text-[11px] font-bold" :class="wouldExceedQuota(person) ? 'text-red-500' : 'text-slate-600'">
                      Sisa Kuota: {{ person.weeklyQuotaMax - person.weeklyQuotaUsed }} Jam
                    </div>
                    <div class="text-[10px] text-slate-400 font-medium">
                      Terpakai {{ person.weeklyQuotaUsed }} / {{ person.weeklyQuotaMax }} Jam
                    </div>
                    <div v-if="wouldExceedQuota(person)" class="text-[9px] text-red-500 font-bold mt-0.5">⚠ Kuota Tidak Cukup</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-2 text-[11px] text-slate-400">
              <Shield :size="13" />
              <span>Dokumen digital valid & terenkripsi BMIS System</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="isFormModalOpen = false"
                class="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                @click="submitNewSPKL"
                class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-bmis-blue text-white text-xs font-bold rounded-lg hover:bg-bmis-blue-hover shadow-sm transition-colors"
              >
                <Play :size="13" />
                <span>Terbitkan & Ajukan SPKL</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- ═══════════════════════════════════════════════════════ -->
    <!--  MODAL 2: Verifikasi Realisasi & Cut Jam              -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="isVerifikasiModalOpen && verifikasiRecord"
        class="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ClipboardCheck :size="20" />
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-800">Verifikasi Realisasi Jam Lembur</h3>
                <p class="text-[11px] text-slate-400 mt-0.5">{{ verifikasiRecord.spklNumber }} • {{ verifikasiRecord.employeeName }}</p>
              </div>
            </div>
            <button type="button" @click="isVerifikasiModalOpen = false" class="text-slate-400 hover:text-slate-700 transition-colors">
              <X :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-5 overflow-y-auto text-xs">
            <!-- Komparasi Jam -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rencana Awal</div>
                <div class="text-lg font-black text-slate-800">{{ verifikasiRecord.plannedStartTime }} - {{ verifikasiRecord.plannedEndTime }}</div>
                <div class="text-xs text-slate-500 font-semibold mt-0.5">{{ verifikasiRecord.plannedDurationHours }} Jam</div>
              </div>
              <div class="rounded-xl p-4 border" :class="(verifikasiRecord.actualDurationHours || 0) > verifikasiRecord.plannedDurationHours ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'">
                <div class="text-[10px] font-bold uppercase tracking-wider mb-1" :class="(verifikasiRecord.actualDurationHours || 0) > verifikasiRecord.plannedDurationHours ? 'text-amber-500' : 'text-emerald-500'">Tap Aktual Presensi</div>
                <div class="text-lg font-black" :class="(verifikasiRecord.actualDurationHours || 0) > verifikasiRecord.plannedDurationHours ? 'text-amber-700' : 'text-emerald-700'">{{ verifikasiRecord.actualCheckIn }} - {{ verifikasiRecord.actualCheckOut }}</div>
                <div class="text-xs font-semibold mt-0.5" :class="(verifikasiRecord.actualDurationHours || 0) > verifikasiRecord.plannedDurationHours ? 'text-amber-600' : 'text-emerald-600'">{{ verifikasiRecord.actualDurationHours }} Jam</div>
              </div>
            </div>

            <!-- Laporan Kerja Singkat & Bukti Lapangan -->
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Laporan Kerja Singkat Pegawai</span>
                <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-full border border-emerald-200">Terverifikasi Presensi</span>
              </div>
              <p class="text-xs text-slate-700 leading-relaxed font-medium">
                {{ verifikasiRecord.workReportText || 'Pekerjaan selesai 100% sesuai instruksi SPKL. Seluruh peralatan teknis beroperasi normal.' }}
              </p>
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ImageIcon :size="11" />
                  Bukti Foto / Lampiran Lapangan (Upload Pegawai)
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-20 h-14 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-500 shadow-xs">
                    <Building2 :size="18" class="text-bmis-blue" />
                    <span class="text-[9px] font-bold mt-1 text-slate-600">Foto_1.jpg</span>
                  </div>
                  <div class="w-20 h-14 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-500 shadow-xs">
                    <ClipboardCheck :size="18" class="text-emerald-600" />
                    <span class="text-[9px] font-bold mt-1 text-slate-600">Checklist.pdf</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-medium">
                    <div>2 Lampiran terunggah</div>
                    <div class="text-emerald-600 font-semibold">Geo-tagging & Waktu Valid</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Jam yang Diakui -->
            <div class="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
              <div class="flex items-center gap-2">
                <Clock :size="15" class="text-bmis-blue" />
                <span class="text-xs font-black text-slate-800 uppercase tracking-wider">Penentuan "Jam yang Diakui"</span>
              </div>
              <div>
                <label class="block font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Jam Diakui (dalam Jam) <span class="text-red-500">*</span></label>
                <input
                  v-model.number="verifikasiJamDiakui"
                  type="number"
                  min="0"
                  max="4"
                  step="0.5"
                  class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-bmis-teal transition-colors"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">Catatan Penyesuaian / Alasan Pemotongan</label>
                <textarea
                  v-model="verifikasiAlasan"
                  rows="2"
                  placeholder="Contoh: Dipotong 30 menit jam istirahat, tidak termasuk setup awal..."
                  class="w-full p-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-bmis-teal resize-none transition-colors"
                ></textarea>
              </div>
            </div>

            <!-- Preview Upah -->
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Kalkulasi Upah Lembur Otomatis</div>
                  <div class="text-[10px] text-slate-500">Jam ke-1: 1.5x (Rp {{ (45000 * 1.5).toLocaleString('id-ID') }}) | Jam ke-2+: 2x (Rp {{ (45000 * 2).toLocaleString('id-ID') }})</div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-black text-emerald-700">{{ formatCurrency(previewWage) }}</div>
                  <div class="text-[10px] text-emerald-600 font-semibold">{{ verifikasiJamDiakui }} jam diakui</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              @click="isVerifikasiModalOpen = false"
              class="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitVerifikasi"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
            >
              <Lock :size="13" />
              <span>Setujui & Kunci Data Payroll</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- ═══════════════════════════════════════════════════════ -->
    <!--  MODAL 3: Detail SPKL & Timeline                     -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="isDetailModalOpen && detailRecord"
        class="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-bmis-blue/10 text-bmis-blue flex items-center justify-center text-[11px] font-black">
                {{ getInitials(detailRecord.employeeName) }}
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-slate-800">{{ detailRecord.spklNumber }}</h3>
                <p class="text-[11px] text-slate-400">{{ detailRecord.employeeName }} • {{ detailRecord.division }}</p>
              </div>
            </div>
            <button type="button" @click="isDetailModalOpen = false" class="text-slate-400 hover:text-slate-700 transition-colors">
              <X :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4 overflow-y-auto text-xs">
            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Gedung</div>
                <div class="text-xs font-semibold text-slate-700 mt-0.5">{{ detailRecord.office }}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Area Kerja</div>
                <div class="text-xs font-semibold text-slate-700 mt-0.5">{{ detailRecord.workArea }}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Tanggal</div>
                <div class="text-xs font-semibold text-slate-700 mt-0.5">{{ detailRecord.date }}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Status</div>
                <span
                  :class="[
                    'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5',
                    getStatusBadgeClass(detailRecord.status)
                  ]"
                >{{ getStatusLabel(detailRecord.status) }}</span>
              </div>
            </div>

            <!-- Jam -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-blue-50/50 rounded-lg p-3 border border-blue-100 text-center">
                <div class="text-[10px] text-blue-500 font-bold uppercase">Rencana</div>
                <div class="text-sm font-black text-slate-800 mt-0.5">{{ detailRecord.plannedDurationHours }}j</div>
                <div class="text-[10px] text-slate-400">{{ detailRecord.plannedStartTime }} - {{ detailRecord.plannedEndTime }}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Tap Aktual</div>
                <div class="text-sm font-black text-slate-800 mt-0.5">{{ detailRecord.actualDurationHours ?? '-' }}j</div>
                <div class="text-[10px] text-slate-400">{{ detailRecord.actualCheckIn || '-' }} - {{ detailRecord.actualCheckOut || '-' }}</div>
              </div>
              <div class="rounded-lg p-3 border text-center" :class="detailRecord.recognizedHours != null ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'">
                <div class="text-[10px] font-bold uppercase" :class="detailRecord.recognizedHours != null ? 'text-emerald-500' : 'text-slate-400'">Jam Diakui</div>
                <div class="text-sm font-black mt-0.5" :class="detailRecord.recognizedHours != null ? 'text-emerald-700' : 'text-slate-400'">{{ detailRecord.recognizedHours ?? '-' }}j</div>
                <div class="text-[10px] text-slate-400">{{ detailRecord.calculatedWage > 0 ? formatCurrency(detailRecord.calculatedWage) : '-' }}</div>
              </div>
            </div>

            <!-- Uraian Tugas -->
            <div>
              <div class="text-[10px] text-slate-400 font-bold uppercase mb-1">Uraian Tugas</div>
              <p class="text-xs text-slate-700 leading-relaxed">{{ detailRecord.purpose }}</p>
            </div>

            <!-- Cut Jam Reason -->
            <div v-if="detailRecord.cutHoursReason">
              <div class="text-[10px] text-slate-400 font-bold uppercase mb-1">Catatan Evaluasi HR</div>
              <p class="text-xs text-slate-600 leading-relaxed italic">{{ detailRecord.cutHoursReason }}</p>
            </div>

            <!-- Timeline -->
            <div>
              <div class="text-[10px] text-slate-400 font-bold uppercase mb-2">Riwayat Aktivitas</div>
              <div class="space-y-0">
                <div
                  v-for="(entry, idx) in detailRecord.timeline"
                  :key="idx"
                  class="flex items-start gap-3 pb-3 relative"
                >
                  <div class="flex flex-col items-center flex-shrink-0">
                    <div class="w-2 h-2 rounded-full mt-1" :class="idx === detailRecord.timeline.length - 1 ? 'bg-emerald-500' : 'bg-bmis-blue'"></div>
                    <div v-if="idx < detailRecord.timeline.length - 1" class="w-px h-full bg-slate-200 mt-1"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs text-slate-700 font-semibold">{{ entry.activity }}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">{{ entry.time.replace('T', ' ').substring(0, 16) }} • {{ entry.actor }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              @click="handlePrintSPKL"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Printer :size="13" />
              <span>Cetak Dokumen SPKL</span>
            </button>
            <button
              type="button"
              @click="isDetailModalOpen = false"
              class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- ═══ Toast ═══ -->
    <Teleport to="body">
      <Transition
        enter-from-class="translate-y-4 opacity-0"
        enter-active-class="transition-all duration-300"
        enter-to-class="translate-y-0 opacity-100"
        leave-from-class="translate-y-0 opacity-100"
        leave-active-class="transition-all duration-200"
        leave-to-class="translate-y-4 opacity-0"
      >
        <div
          v-if="isToastVisible"
          class="fixed bottom-6 right-6 z-[110] bg-white border border-slate-200 border-l-4 border-l-bmis-teal rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 text-xs font-bold text-slate-800"
        >
          <CheckCircle2 :size="18" class="text-bmis-teal flex-shrink-0" />
          <span>{{ toastMessage }}</span>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
