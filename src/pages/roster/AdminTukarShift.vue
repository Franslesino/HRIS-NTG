<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ChevronRight,
  History,
  Download,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  RotateCcw,
  Moon,
  Sun,
  CheckCheck,
  SlidersHorizontal,
  Eye,
  FileText,
  MoreVertical,
  X,
  Check,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  Plus
} from 'lucide-vue-next';

// Toast State
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'info'>('success');
const isToastVisible = ref(false);

const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  isToastVisible.value = true;
  setTimeout(() => { isToastVisible.value = false; }, 3500);
};

import { useTukarShiftStore } from '../../composables/useTukarShiftStore';
import type { TukarShiftItem } from '../../types/tukarShift';
import { mockEmployees } from '../../data/mockData';

const { shiftRequests, approveByHR, rejectByHR, addShiftRequest } = useTukarShiftStore();

// Employee selection list including key operational staff
const allEmployeeOptions = computed(() => {
  const custom = [
    { id: 'emp-budi', nama: 'Budi Raharjo', nip: 'CS.38910', jabatan: 'Teknisi Senior ME', kantor: 'Gedung Utama BMIS' },
    { id: 'emp-asep', nama: 'Asep Milo', nip: 'CS.50101', jabatan: 'Teknisi Operasional', kantor: 'Gedung Utama BMIS' },
    { id: 'emp-siti', nama: 'Siti Nurhaliza', nip: 'EMP-055', jabatan: 'Staff Operasional', kantor: 'Gedung Utama BMIS' },
    { id: 'emp-rian', nama: 'Rian Hidayat', nip: 'EMP-061', jabatan: 'Staff Operasional', kantor: 'Gedung Utama BMIS' },
    { id: 'emp-fajar', nama: 'Fajar Anshori', nip: 'EMP-015', jabatan: 'Operator SCADA', kantor: 'Gardu Gandul' }
  ];
  return [...custom, ...mockEmployees];
});

// Modal Direct Input Penukaran Shift State
const isDirectInputModalOpen = ref(false);

const directInputForm = ref({
  empAId: 'emp-asep',
  empBId: 'emp-budi',
  dateA: '2023-10-24',
  shiftA: 'Pagi',
  dateB: '2023-10-24',
  shiftB: 'Siang',
  gardu: 'Gedung Utama BMIS',
  rosterUnit: 'Roster Unit 3',
  catatan: 'Penukaran shift disetujui oleh atasan langsung.'
});

const openDirectInputModal = () => {
  directInputForm.value = {
    empAId: 'emp-asep',
    empBId: 'emp-budi',
    dateA: '2023-10-24',
    shiftA: 'Pagi',
    dateB: '2023-10-24',
    shiftB: 'Siang',
    gardu: 'Gedung Utama BMIS',
    rosterUnit: 'Roster Unit 3',
    catatan: 'Penukaran shift disetujui oleh atasan langsung.'
  };
  isDirectInputModalOpen.value = true;
};

const handleSaveDirectSwap = () => {
  const empA = allEmployeeOptions.value.find(e => e.id === directInputForm.value.empAId) || {
    id: directInputForm.value.empAId,
    nama: 'Asep Milo',
    nip: 'CS.50101',
    jabatan: 'Teknisi Operasional'
  };

  const empB = allEmployeeOptions.value.find(e => e.id === directInputForm.value.empBId) || {
    id: directInputForm.value.empBId,
    nama: 'Budi Raharjo',
    nip: 'CS.38910',
    jabatan: 'Teknisi Senior ME'
  };

  const shiftTimeMap: Record<string, string> = {
    'Pagi': '08:00 - 16:00',
    'Siang': '16:00 - 00:00',
    'Malam': '00:00 - 08:00'
  };

  const newIdNum = Math.floor(100 + Math.random() * 900);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const newItem: TukarShiftItem = {
    id: `TS-${newIdNum}`,
    tiketId: `#TS-202310-${newIdNum}`,
    rosterUnit: directInputForm.value.rosterUnit,
    hasAccent: true,
    pemohon: {
      initials: empA.nama.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AM',
      nama: empA.nama,
      empId: empA.nip,
      gardu: directInputForm.value.gardu,
      jabatan: empA.jabatan
    },
    pengganti: {
      initials: empB.nama.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'BR',
      nama: empB.nama,
      empId: empB.nip,
      gardu: directInputForm.value.gardu,
      jabatan: empB.jabatan
    },
    pertukaran: [
      {
        label: 'Shift A',
        jadwal: `${directInputForm.value.dateA} (${shiftTimeMap[directInputForm.value.shiftA] || '08:00 - 16:00'})`,
        shiftCode: directInputForm.value.shiftA as any,
        icon: directInputForm.value.shiftA === 'Malam' ? 'moon' : 'sun'
      },
      {
        label: 'Shift B',
        jadwal: `${directInputForm.value.dateB} (${shiftTimeMap[directInputForm.value.shiftB] || '16:00 - 00:00'})`,
        shiftCode: directInputForm.value.shiftB as any,
        icon: directInputForm.value.shiftB === 'Malam' ? 'moon' : 'sun'
      }
    ],
    rekanApproval: {
      approved: true,
      dateStr: dateFormatted
    },
    hrApproval: {
      approved: true,
      approverName: 'Admin / Atasan',
      dateStr: `${dateFormatted} ${timeFormatted}`
    },
    status: 'approved',
    diajukanPadaDate: dateFormatted,
    diajukanPadaTime: timeFormatted,
    alasan: directInputForm.value.catatan,
    catatanAdmin: 'Diterapkan langsung oleh Admin ke dalam sistem.'
  };

  addShiftRequest(newItem);
  isDirectInputModalOpen.value = false;
  showToast(`Penukaran shift ${newItem.tiketId} berhasil diterapkan langsung ke sistem!`, 'success');
};


// Filters State
const searchQuery = ref('');
const filterStatus = ref('all');
const filterLocation = ref('');
const currentPage = ref(1);

// Computed stats
const countPending = computed(() => shiftRequests.value.filter(item => item.status === 'pending_hr' || item.status === 'pending_rekan').length);
const countApproved = computed(() => 18); // Mocked statistics like in reference image
const countRejected = computed(() => 2);

// Filtered items
const filteredRequests = computed(() => {
  return shiftRequests.value.filter(item => {
    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchTiket = item.tiketId.toLowerCase().includes(q);
      const matchPemohon = item.pemohon.nama.toLowerCase().includes(q) || item.pemohon.empId.toLowerCase().includes(q);
      const matchPengganti = item.pengganti.nama.toLowerCase().includes(q) || item.pengganti.empId.toLowerCase().includes(q);
      const matchLocation = item.pemohon.gardu.toLowerCase().includes(q);
      if (!matchTiket && !matchPemohon && !matchPengganti && !matchLocation) return false;
    }

    // Status filter
    if (filterStatus.value && filterStatus.value !== 'all') {
      if (item.status !== filterStatus.value) return false;
    }

    // Location filter
    if (filterLocation.value && filterLocation.value !== 'all') {
      if (!item.pemohon.gardu.includes(filterLocation.value)) return false;
    }

    return true;
  });
});

const resetFilters = () => {
  searchQuery.value = '';
  filterStatus.value = 'all';
  filterLocation.value = '';
  currentPage.value = 1;
};

// Modal Review State
const isModalOpen = ref(false);
const activeItem = ref<TukarShiftItem | null>(null);
const adminNote = ref('');

const openReviewModal = (item: TukarShiftItem) => {
  activeItem.value = { ...item };
  adminNote.value = item.catatanAdmin || '';
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  activeItem.value = null;
  adminNote.value = '';
};

const handleApprove = () => {
  if (!activeItem.value) return;
  const target = shiftRequests.value.find(i => i.id === activeItem.value?.id || i.tiketId === activeItem.value?.tiketId);
  if (target) {
    target.status = 'approved';
    target.hrApproval = {
      approved: true,
      approverName: 'Lucia Maria',
      dateStr: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' +
               new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    };
    target.catatanAdmin = adminNote.value || 'Disetujui oleh HR';
    showToast(`Tiket ${target.tiketId} berhasil disetujui!`, 'success');
  }
  closeModal();
};

const handleReject = () => {
  if (!activeItem.value) return;
  const target = shiftRequests.value.find(i => i.id === activeItem.value?.id || i.tiketId === activeItem.value?.tiketId);
  if (target) {
    target.status = 'rejected';
    target.catatanAdmin = adminNote.value || 'Ditolak oleh HR';
    showToast(`Tiket ${target.tiketId} telah ditolak.`, 'error');
  }
  closeModal();
};
</script>

<template>
  <div class="tukar-shift-container space-y-4">
    <!-- BREADCRUMB & HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <nav class="flex items-center text-xs text-slate-500 mb-1">
          <span>Roster</span>
          <ChevronRight :size="13" class="mx-1 text-slate-400" />
          <span class="text-bmis-blue font-semibold">Tukar Shift</span>
        </nav>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">
            Persetujuan Tukar Shift (Approval & Monitoring)
          </h1>
          <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#92400e]">
            <span class="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
            <span>3 Menunggu Persetujuan</span>
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Tinjau dan putuskan permohonan pertukaran shift kerja antar karyawan yang telah disetujui rekan bersangkutan.
        </p>
      </div>

      <!-- Action Buttons Top Right -->
      <div class="flex items-center gap-2 self-start md:self-auto flex-wrap">
        <button
          type="button"
          @click="showToast('Menampilkan riwayat audit log tukar shift...', 'info')"
          class="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#E5E9EE] hover:bg-[#D9DFE7] text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <History :size="15" class="text-slate-600" />
          <span>Riwayat Log</span>
        </button>
        <button
          type="button"
          @click="showToast('Mengunduh laporan rekap tukar shift (PDF/Excel)...', 'info')"
          class="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download :size="15" />
          <span>Unduh Laporan</span>
        </button>
      </div>
    </div>

    <!-- STAT CARDS (3 Cards Row) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <!-- Card 1: MENUNGGU REVIEW -->
      <div class="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            MENUNGGU REVIEW
          </span>
          <div class="w-8 h-8 rounded-lg bg-[#ffedd5] text-[#ea580c] flex items-center justify-center">
            <CalendarCheck :size="16" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ countPending }}
          </span>
          <span class="text-xs font-semibold text-slate-600 ml-1.5">Tiket</span>
          <span class="ml-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef3c7] text-[#92400e]">
            Segera Proses
          </span>
        </div>
        <div class="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
          <div class="bg-amber-400 h-full rounded-full w-[35%]"></div>
        </div>
      </div>

      <!-- Card 2: DISETUJUI BULAN INI -->
      <div class="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            DISETUJUI BULAN INI
          </span>
          <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 :size="16" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ countApproved }}
          </span>
          <span class="text-xs font-semibold text-slate-600 ml-1.5">Permohonan</span>
          <span class="ml-2 text-xs font-bold text-sky-600 flex items-center gap-0.5">
            <TrendingUp :size="13" />
            <span>+12% vs lalu</span>
          </span>
        </div>
        <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div class="bg-blue-600 h-full rounded-full w-[65%]"></div>
        </div>
      </div>

      <!-- Card 3: DITOLAK / BATAL -->
      <div class="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            DITOLAK / BATAL
          </span>
          <div class="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <XCircle :size="16" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline justify-between">
          <div class="flex items-baseline">
            <span class="text-3xl font-extrabold text-slate-900 tracking-tight">
              {{ countRejected }}
            </span>
            <span class="text-xs font-semibold text-slate-600 ml-1.5">Kasus</span>
          </div>
          <span class="text-xs font-bold text-red-600">
            Rasio 8.7%
          </span>
        </div>
        <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div class="bg-red-600 h-full rounded-full w-[12%]"></div>
        </div>
      </div>
    </div>

    <!-- FILTER BAR -->
    <div class="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 flex flex-wrap md:flex-nowrap items-center gap-3 shadow-2xs">
      <!-- Search Input -->
      <div class="flex items-center gap-2 flex-1 min-w-[240px]">
        <Search :size="16" class="text-slate-400 shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama karyawan, ID tiket (#TS-...), lokasi..."
          class="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <!-- Divider -->
      <div class="hidden md:block w-px h-5 bg-slate-200"></div>

      <!-- Status Dropdown -->
      <div class="relative shrink-0">
        <select
          v-model="filterStatus"
          class="appearance-none bg-transparent pr-7 pl-2 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="all">Status: Menunggu Review Admin</option>
          <option value="pending_hr">Status: Menunggu Review Saja</option>
          <option value="pending_rekan">Status: Menunggu Konfirmasi Rekan</option>
          <option value="approved">Status: Disetujui HR</option>
          <option value="rejected">Status: Ditolak</option>
          <option value="semua">Status: Semua Status</option>
        </select>
        <ChevronRight :size="12" class="rotate-90 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      <!-- Divider -->
      <div class="hidden md:block w-px h-5 bg-slate-200"></div>

      <!-- Location Dropdown -->
      <div class="relative shrink-0">
        <select
          v-model="filterLocation"
          class="appearance-none bg-transparent pr-7 pl-2 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="">Semua Gardu / Lokasi</option>
          <option value="Cawang">Gardu Cawang</option>
          <option value="Plumpang">Gardu Plumpang</option>
          <option value="Gandul">Gardu Gandul</option>
          <option value="Menara 1 BTN">Menara 1 BTN</option>
        </select>
        <ChevronRight :size="12" class="rotate-90 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      <!-- Reset Filter Button -->
      <button
        type="button"
        title="Reset Filter"
        @click="resetFilters"
        class="shrink-0 p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
      >
        <RotateCcw :size="14" />
      </button>
    </div>

    <!-- TABLE CONTAINER DENGAN HORIZONTAL SCROLL AGAR TIDAK TUMPANG TINDIH -->
    <div class="overflow-x-auto pb-4 custom-scrollbar">
      <div class="min-w-[1380px] space-y-3">
        <!-- TABLE HEADER (6 Columns Streamlined & Spacious) -->
        <div class="grid grid-cols-[180px_220px_220px_280px_240px_1fr] gap-4 px-6 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div>ID TIKET & WAKTU</div>
          <div>PEMOHON (A)</div>
          <div>REKAN PENGGANTI (B)</div>
          <div>PERTUKARAN SHIFT</div>
          <div>STATUS KONFIRMASI</div>
          <div class="text-right pr-2">AKSI</div>
        </div>

        <!-- TABLE BODY (Card-Style Rows) -->
        <div
          v-for="item in filteredRequests"
          :key="item.id"
          class="bg-white rounded-xl border border-slate-200/90 px-6 py-4 shadow-2xs hover:border-slate-300 transition-all w-full"
        >
          <div class="grid grid-cols-[180px_220px_220px_280px_240px_1fr] gap-4 items-center">
            <!-- 1. ID TIKET & WAKTU -->
            <div class="flex flex-col">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span
                  v-if="item.id === 'TS-42' || item.tiketId.includes('042')"
                  class="w-2 h-2 rounded-[2px] bg-[#0084CC] shrink-0"
                ></span>
                <span
                  v-else-if="item.id === 'TS-38' || item.tiketId.includes('038')"
                  class="w-2 h-2 rounded-[2px] bg-slate-300 shrink-0"
                ></span>
                <span class="text-sm font-extrabold text-slate-900 tracking-tight">{{ item.tiketId }}</span>
              </div>
              <div class="text-[11px] text-slate-500 font-medium leading-tight mt-1">
                <span class="font-semibold text-slate-700">{{ item.rosterUnit }}</span>
                <span class="text-slate-400 block text-[11px] mt-0.5 whitespace-nowrap">{{ item.diajukanPadaDate }} • {{ item.diajukanPadaTime }}</span>
              </div>
            </div>

            <!-- 2. PEMOHON (A) -->
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                {{ item.pemohon.initials }}
              </div>
              <div class="min-w-0">
                <span class="text-xs font-bold text-slate-900 block truncate">
                  {{ item.pemohon.nama }}
                </span>
                <span class="text-[11px] text-slate-500 block whitespace-nowrap">
                  {{ item.pemohon.empId }} • {{ item.pemohon.gardu }}
                </span>
              </div>
            </div>

            <!-- 3. REKAN PENGGANTI (B) -->
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                {{ item.pengganti.initials }}
              </div>
              <div class="min-w-0">
                <span class="text-xs font-bold text-slate-900 block truncate">
                  {{ item.pengganti.nama }}
                </span>
                <span class="text-[11px] text-slate-500 block whitespace-nowrap">
                  {{ item.pengganti.empId }} • {{ item.pengganti.gardu }}
                </span>
              </div>
            </div>

            <!-- 4. PERTUKARAN SHIFT -->
            <div class="space-y-1.5">
              <div
                v-for="shift in item.pertukaran"
                :key="shift.label"
                class="flex items-center gap-2 text-xs text-slate-700 whitespace-nowrap"
              >
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold shrink-0',
                    shift.label === 'Shift A'
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  ]"
                >
                  {{ shift.label }}
                </span>
                <span class="text-xs text-slate-700 font-medium whitespace-nowrap">
                  {{ shift.jadwal }}
                </span>
                <Moon v-if="shift.icon === 'moon'" :size="13" class="text-slate-400 inline shrink-0 ml-0.5" />
                <Sun v-if="shift.icon === 'sun'" :size="13" class="text-sky-500 inline shrink-0 ml-0.5" />
              </div>
            </div>

            <!-- 5. STATUS KONFIRMASI -->
            <div class="space-y-1">
              <!-- Pending HR -->
              <template v-if="item.status === 'pending_hr' || item.status === 'pending_rekan'">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#92400e] border border-amber-200/60 whitespace-nowrap">
                  Menunggu Review HR
                </span>
                <span v-if="item.rekanApproval?.approved" class="block text-[11px] text-slate-400 font-medium pl-0.5 whitespace-nowrap">
                  ✓ Rekan B setuju ({{ item.rekanApproval.dateStr }})
                </span>
                <span v-else-if="item.status === 'pending_rekan'" class="block text-[11px] text-amber-600 font-medium pl-0.5 whitespace-nowrap">
                  ⏳ Menunggu Rekan B
                </span>
              </template>

              <!-- Approved -->
              <template v-else-if="item.status === 'approved'">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#dbeafe] text-[#1e40af] border border-blue-200/60 whitespace-nowrap">
                  <CheckCheck :size="13" class="text-[#2563eb] shrink-0" />
                  <span>Disetujui HR</span>
                </div>
                <span v-if="item.hrApproval?.dateStr" class="block text-[11px] text-slate-400 font-medium pl-0.5 whitespace-nowrap">
                  {{ item.hrApproval.dateStr }}
                </span>
              </template>

              <!-- Rejected -->
              <template v-else-if="item.status === 'rejected'">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60 whitespace-nowrap">
                  Ditolak HR
                </span>
              </template>
            </div>

            <!-- 6. AKSI -->
            <div class="flex items-center justify-end gap-2 shrink-0 whitespace-nowrap">
              <!-- Pending: Tinjau -->
              <button
                v-if="item.status === 'pending_hr' || item.status === 'pending_rekan'"
                type="button"
                @click="openReviewModal(item)"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <SlidersHorizontal :size="13" />
                <span>Tinjau</span>
              </button>

              <!-- Approved: Tinjau/Detail -->
              <button
                v-else-if="item.id === 'TS-40' || item.tiketId.includes('040')"
                type="button"
                @click="openReviewModal(item)"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0 border border-slate-200 whitespace-nowrap"
              >
                <Eye :size="13" class="text-slate-600" />
                <span>Tinjau</span>
              </button>

              <button
                v-else
                type="button"
                @click="openReviewModal(item)"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0 border border-slate-200 whitespace-nowrap"
              >
                <FileText :size="13" class="text-slate-600" />
                <span>Detail</span>
              </button>

              <!-- More Kebab Button -->
              <button
                type="button"
                class="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <MoreVertical :size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="filteredRequests.length === 0"
          class="bg-white rounded-xl border border-slate-200 p-8 text-center"
        >
          <p class="text-sm font-semibold text-slate-600">Tidak ada permohonan tukar shift yang sesuai filter.</p>
          <button
            type="button"
            @click="resetFilters"
            class="mt-3 text-xs text-bmis-blue font-bold hover:underline"
          >
            Reset Filter Pencarian
          </button>
        </div>
      </div>
    </div>

    <!-- PAGINATION -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
      <p>
        Menampilkan 1 - {{ filteredRequests.length }} dari 23 permohonan pertukaran shift
      </p>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          disabled
        >
          &lt;
        </button>
        <button
          type="button"
          class="w-7 h-7 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center"
        >
          1
        </button>
        <button
          type="button"
          class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
        >
          2
        </button>
        <button
          type="button"
          class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
        >
          3
        </button>
        <button
          type="button"
          class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
        >
          &gt;
        </button>
      </div>
    </div>

    <!-- MODAL REVIEW & PUTUSKAN -->
    <div
      v-if="isModalOpen && activeItem"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-slate-900">
                Detail Permohonan Tukar Shift
              </h2>
              <span class="text-xs font-extrabold text-bmis-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {{ activeItem.tiketId }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Unit: {{ activeItem.rosterUnit }} • Diajukan: {{ activeItem.diajukanPadaDate }} ({{ activeItem.diajukanPadaTime }})
            </p>
          </div>
          <button
            type="button"
            @click="closeModal"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          <!-- Personel Side-by-Side Comparison -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Pemohon (A) -->
            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">PEMOHON (A)</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">Shift Asal</span>
              </div>
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-full bg-blue-100 text-bmis-blue font-bold text-xs flex items-center justify-center shrink-0">
                  {{ activeItem.pemohon.initials }}
                </div>
                <div>
                  <p class="font-bold text-slate-900 text-sm">{{ activeItem.pemohon.nama }}</p>
                  <p class="text-[11px] text-slate-500">{{ activeItem.pemohon.empId }} • {{ activeItem.pemohon.gardu }}</p>
                  <p class="text-[11px] text-slate-400">{{ activeItem.pemohon.jabatan }}</p>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px]">
                <span class="text-slate-400">Jadwal Shift Asal:</span>
                <p class="font-semibold text-slate-800 mt-0.5">
                  {{ activeItem.pertukaran[0]?.jadwal || '-' }}
                </p>
              </div>
            </div>

            <!-- Rekan Pengganti (B) -->
            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">REKAN PENGGANTI (B)</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">Shift Tujuan</span>
              </div>
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {{ activeItem.pengganti.initials }}
                </div>
                <div>
                  <p class="font-bold text-slate-900 text-sm">{{ activeItem.pengganti.nama }}</p>
                  <p class="text-[11px] text-slate-500">{{ activeItem.pengganti.empId }} • {{ activeItem.pengganti.gardu }}</p>
                  <p class="text-[11px] text-slate-400">{{ activeItem.pengganti.jabatan }}</p>
                </div>
              </div>
              <div class="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px]">
                <span class="text-slate-400">Jadwal Shift Pengganti:</span>
                <p class="font-semibold text-slate-800 mt-0.5">
                  {{ activeItem.pertukaran[1]?.jadwal || '-' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Alasan Tukar Shift -->
          <div class="p-3.5 rounded-xl border border-slate-200 bg-white">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              ALASAN PERMOHONAN
            </span>
            <p class="text-xs text-slate-700 leading-relaxed font-normal">
              "{{ activeItem.alasan }}"
            </p>
          </div>

          <!-- Timeline Konfirmasi Berjenjang -->
          <div class="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              STATUS PERSETUJUAN BERJENJANG
            </span>
            <div class="space-y-2 pt-1">
              <div class="flex items-center gap-2.5">
                <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check :size="12" />
                </div>
                <div>
                  <p class="text-xs font-semibold text-slate-800">
                    Disetujui oleh Rekan B ({{ activeItem.pengganti.nama }})
                  </p>
                  <p class="text-[10px] text-slate-400">
                    Waktu persetujuan rekan: {{ activeItem.rekanApproval?.dateStr || 'Terverifikasi' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2.5">
                <div
                  :class="[
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                    activeItem.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-600'
                      : activeItem.status === 'rejected'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  ]"
                >
                  <Check v-if="activeItem.status === 'approved'" :size="12" />
                  <X v-else-if="activeItem.status === 'rejected'" :size="12" />
                  <Clock v-else :size="12" />
                </div>
                <div>
                  <p class="text-xs font-semibold text-slate-800">
                    {{
                      activeItem.status === 'approved'
                        ? 'Disetujui oleh HR / Koordinator'
                        : activeItem.status === 'rejected'
                        ? 'Ditolak oleh HR / Koordinator'
                        : 'Menunggu Keputusan HR / Koordinator'
                    }}
                  </p>
                  <p class="text-[10px] text-slate-400">
                    {{ activeItem.hrApproval?.dateStr || 'Pemberian otorisasi admin untuk update jadwal roster resmi' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Catatan Otorisasi Admin (Jika Pending) -->
          <div v-if="activeItem.status === 'pending_hr' || activeItem.status === 'pending_rekan'" class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Catatan / Komentar HR (Opsional):</label>
            <textarea
              v-model="adminNote"
              rows="2"
              placeholder="Tuliskan catatan persetujuan atau alasan penolakan jika diperlukan..."
              class="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-bmis-blue resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>

          <div v-if="activeItem.status === 'pending_hr' || activeItem.status === 'pending_rekan'" class="flex items-center gap-2">
            <button
              type="button"
              @click="handleReject"
              class="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer"
            >
              Tolak Permohonan
            </button>
            <button
              type="button"
              @click="handleApprove"
              class="px-4 py-2 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Setujui Tukar Shift
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODAL INPUT PENUKARAN SHIFT ── -->
    <div
      v-if="isDirectInputModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#e0f2fe] text-[#0084CC] flex items-center justify-center shrink-0">
              <ArrowRightLeft :size="18" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                Input Penukaran Shift Langsung
              </h3>
              <p class="text-[11px] text-slate-500">
                Catat dan terapkan penukaran shift kerja antar karyawan langsung ke dalam sistem.
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="isDirectInputModalOpen = false"
            class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center cursor-pointer"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1">
          <!-- Grid Karyawan A & Karyawan B -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <!-- Karyawan A (Pemohon) -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                KARYAWAN A (PEMOHON)
              </span>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Pilih Karyawan:</label>
                <select
                  v-model="directInputForm.empAId"
                  class="w-full text-xs h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
                >
                  <option v-for="emp in allEmployeeOptions" :key="emp.id" :value="emp.id">
                    {{ emp.nama }} ({{ emp.nip }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Shift Asal:</label>
                <input
                  v-model="directInputForm.dateA"
                  type="date"
                  class="w-full text-xs h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Shift yang Dilepas:</label>
                <select
                  v-model="directInputForm.shiftA"
                  class="w-full text-xs h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
                >
                  <option value="Pagi">Shift Pagi (08:00 - 16:00)</option>
                  <option value="Siang">Shift Siang (16:00 - 00:00)</option>
                  <option value="Malam">Shift Malam (00:00 - 08:00)</option>
                </select>
              </div>
            </div>

            <!-- Karyawan B (Pengganti) -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                KARYAWAN B (PENGGANTI)
              </span>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Pilih Rekan Pengganti:</label>
                <select
                  v-model="directInputForm.empBId"
                  class="w-full text-xs h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
                >
                  <option v-for="emp in allEmployeeOptions" :key="emp.id" :value="emp.id">
                    {{ emp.nama }} ({{ emp.nip }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Shift Rekan:</label>
                <input
                  v-model="directInputForm.dateB"
                  type="date"
                  class="w-full text-xs h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Shift yang Diambil:</label>
                <select
                  v-model="directInputForm.shiftB"
                  class="w-full text-xs h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
                >
                  <option value="Pagi">Shift Pagi (08:00 - 16:00)</option>
                  <option value="Siang">Shift Siang (16:00 - 00:00)</option>
                  <option value="Malam">Shift Malam (00:00 - 08:00)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Unit & Lokasi -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Unit Roster:</label>
              <select
                v-model="directInputForm.rosterUnit"
                class="w-full text-xs h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
              >
                <option value="Roster Unit 1">Roster Unit 1</option>
                <option value="Roster Unit 2">Roster Unit 2</option>
                <option value="Roster Unit 3">Roster Unit 3</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Lokasi / Gardu:</label>
              <select
                v-model="directInputForm.gardu"
                class="w-full text-xs h-8.5 px-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
              >
                <option value="Gedung Utama BMIS">Gedung Utama BMIS</option>
                <option value="Gardu Cawang">Gardu Cawang</option>
                <option value="Gardu Plumpang">Gardu Plumpang</option>
                <option value="Gardu Gandul">Gardu Gandul</option>
                <option value="Menara 1 BTN">Menara 1 BTN</option>
              </select>
            </div>
          </div>

          <!-- Catatan / Keterangan Penukaran Shift -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Keterangan Penukaran Shift:
            </label>
            <textarea
              v-model="directInputForm.catatan"
              rows="2"
              class="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084CC]"
              placeholder="Contoh: Penyesuaian jadwal dinas operasional atas persetujuan atasan..."
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            @click="isDirectInputModalOpen = false"
            class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleSaveDirectSwap"
            class="px-4 py-2 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check :size="14" />
            <span>Simpan &amp; Terapkan Tukar Shift</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isToastVisible"
        class="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium bg-white"
        :class="{
          'border-emerald-200 text-emerald-800': toastType === 'success',
          'border-red-200 text-red-800': toastType === 'error',
          'border-blue-200 text-blue-800': toastType === 'info'
        }"
      >
        <CheckCircle2 v-if="toastType === 'success'" :size="16" class="text-emerald-600" />
        <AlertTriangle v-if="toastType === 'error'" :size="16" class="text-red-600" />
        <Clock v-if="toastType === 'info'" :size="16" class="text-blue-600" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Custom subtle scrollbar untuk tabel */
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
