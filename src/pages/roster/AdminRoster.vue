<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Bookmark,
  CalendarCheck,
  Search,
  RotateCcw,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Info
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

// Toast State
const toastMessage = ref('');
const toastType = ref<'success' | 'info' | 'error'>('success');
const isToastVisible = ref(false);
const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
};

// Navigasi Kembali ke Beranda Jadwal Kerja
const goBack = () => {
  router.push('/roster/admin');
};

// Data Header Jadwal (Berdasarkan Query atau Default sesuai Gambar)
const currentScheduleTitle = computed(() => {
  return (route.query.team as string) || 'Jadwal Pelaksana Security 2';
});

const currentGedungLantai = computed(() => {
  if (route.query.gedung) {
    const l = route.query.lantai ? `, ${route.query.lantai}` : '';
    return `${route.query.gedung}${l}`;
  }
  return 'Gedung A, Lantai 4';
});

const currentDivisi = computed(() => {
  return (route.query.divisi as string) || 'Pelaksana Security';
});

const currentTanggalMulai = computed(() => {
  return (route.query.startDate as string) || 'Oktober 2026';
});

const currentMaksimalPersonel = computed(() => {
  return (route.query.quotaMax as string) || '10';
});

// Daftar Pegawai Matriks (Sesuai Referensi Gambar)
interface MatrixEmployee {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
}

const allPersonnel = ref<MatrixEmployee[]>([
  { id: 'p1', nama: 'Ahmad Fauzi', nip: 'CS.38921', jabatan: 'ME Senior' },
  { id: 'p2', nama: 'Rudi Hermawan', nip: 'CS.38944', jabatan: 'Teknisi Chiller' },
  { id: 'p3', nama: 'Doni Setiawan', nip: 'CS.37120', jabatan: 'Security Koord.' },
  { id: 'p4', nama: 'Bambang Sujatmiko', nip: 'CS.38955', jabatan: 'Security Regu A' },
  { id: 'p5', nama: 'Hendra Wijaya', nip: 'CS.39012', jabatan: 'ME Lift & Eskalator' },
  { id: 'p6', nama: 'Siti Rahmawati', nip: 'CS.36502', jabatan: 'Housekeeping Spv.' },
  { id: 'p7', nama: 'Dodi Supriyadi', nip: 'CS.38911', jabatan: 'ME Teknisi' },
  { id: 'p8', nama: 'Farhan Rizky', nip: 'CS.50102', jabatan: 'Teknisi ME' },
  { id: 'p9', nama: 'Danang Kurnia', nip: 'CS.50103', jabatan: 'Teknisi ME' },
  { id: 'p10', nama: 'Teguh Julianto', nip: 'CS.50105', jabatan: 'Teknisi BAS' },
  { id: 'p11', nama: 'Wahyu Saputra', nip: 'CS.50104', jabatan: 'Teknisi Sipil' },
  { id: 'p12', nama: 'Irfan Fadhiil', nip: 'CS.60101', jabatan: 'Leader Cleaning' },
]);

// Search Pegawai
const searchQuery = ref('');
const filteredEmployees = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return allPersonnel.value;
  return allPersonnel.value.filter(p =>
    p.nama.toLowerCase().includes(q) ||
    p.nip.toLowerCase().includes(q) ||
    p.jabatan.toLowerCase().includes(q)
  );
});

// Week State & Pagination (Oktober 2026)
const currentWeek = ref(1);

interface WeekDay {
  dayNum: number;
  dayName: string;
  isWeekend: boolean;
}

const weeksData: Record<number, { rangeLabel: string; days: WeekDay[] }> = {
  1: {
    rangeLabel: '1 - 7 Okt 2026',
    days: [
      { dayNum: 1, dayName: 'KAM', isWeekend: false },
      { dayNum: 2, dayName: 'JUM', isWeekend: false },
      { dayNum: 3, dayName: 'SAB', isWeekend: true },
      { dayNum: 4, dayName: 'MIN', isWeekend: true },
      { dayNum: 5, dayName: 'SEN', isWeekend: false },
      { dayNum: 6, dayName: 'SEL', isWeekend: false },
      { dayNum: 7, dayName: 'RAB', isWeekend: false },
    ]
  },
  2: {
    rangeLabel: '8 - 14 Okt 2026',
    days: [
      { dayNum: 8, dayName: 'KAM', isWeekend: false },
      { dayNum: 9, dayName: 'JUM', isWeekend: false },
      { dayNum: 10, dayName: 'SAB', isWeekend: true },
      { dayNum: 11, dayName: 'MIN', isWeekend: true },
      { dayNum: 12, dayName: 'SEN', isWeekend: false },
      { dayNum: 13, dayName: 'SEL', isWeekend: false },
      { dayNum: 14, dayName: 'RAB', isWeekend: false },
    ]
  },
  3: {
    rangeLabel: '15 - 21 Okt 2026',
    days: [
      { dayNum: 15, dayName: 'KAM', isWeekend: false },
      { dayNum: 16, dayName: 'JUM', isWeekend: false },
      { dayNum: 17, dayName: 'SAB', isWeekend: true },
      { dayNum: 18, dayName: 'MIN', isWeekend: true },
      { dayNum: 19, dayName: 'SEN', isWeekend: false },
      { dayNum: 20, dayName: 'SEL', isWeekend: false },
      { dayNum: 21, dayName: 'RAB', isWeekend: false },
    ]
  },
  4: {
    rangeLabel: '22 - 28 Okt 2026',
    days: [
      { dayNum: 22, dayName: 'KAM', isWeekend: false },
      { dayNum: 23, dayName: 'JUM', isWeekend: false },
      { dayNum: 24, dayName: 'SAB', isWeekend: true },
      { dayNum: 25, dayName: 'MIN', isWeekend: true },
      { dayNum: 26, dayName: 'SEN', isWeekend: false },
      { dayNum: 27, dayName: 'SEL', isWeekend: false },
      { dayNum: 28, dayName: 'RAB', isWeekend: false },
    ]
  },
  5: {
    rangeLabel: '29 - 31 Okt 2026',
    days: [
      { dayNum: 29, dayName: 'KAM', isWeekend: false },
      { dayNum: 30, dayName: 'JUM', isWeekend: false },
      { dayNum: 31, dayName: 'SAB', isWeekend: true },
    ]
  }
};

const currentWeekDays = computed(() => {
  return weeksData[currentWeek.value]?.days || weeksData[1].days;
});

const weekDateRangeLabel = computed(() => {
  return weeksData[currentWeek.value]?.rangeLabel || '1 - 7 Okt 2026';
});

const prevWeek = () => {
  if (currentWeek.value > 1) {
    currentWeek.value--;
  }
};

const nextWeek = () => {
  if (currentWeek.value < 5) {
    currentWeek.value++;
  }
};

// Matriks Shift State: key `${empId}_${dayNum}` => 'P' | 'S' | 'M' | 'L'
type ShiftType = 'P' | 'S' | 'M' | 'L';
const matrixState = ref<Record<string, ShiftType>>({});

// Muat state tersimpan jika ada di localStorage
onMounted(() => {
  try {
    const saved = localStorage.getItem(`bmis_matrix_${currentScheduleTitle.value}`);
    if (saved) {
      matrixState.value = JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Gagal membaca matriks tersimpan:', err);
  }
});

// Set shift manual interaktif
const setShift = (empId: string, dayNum: number, shift: ShiftType) => {
  const key = `${empId}_${dayNum}`;
  if (matrixState.value[key] === shift) {
    // Klik ulang shift yang sama akan menonaktifkannya
    delete matrixState.value[key];
  } else {
    matrixState.value[key] = shift;
  }
};

const getShift = (empId: string, dayNum: number): ShiftType | null => {
  return matrixState.value[`${empId}_${dayNum}`] || null;
};

// Hitung total shift kerja (P, S, M) per karyawan dalam minggu aktif
const calculateEmployeeTotal = (empId: string) => {
  let count = 0;
  currentWeekDays.value.forEach(d => {
    const s = matrixState.value[`${empId}_${d.dayNum}`];
    if (s && s !== 'L') {
      count++;
    }
  });
  return `${count} Shift`;
};

// Hitung Slot Terisi Minggu Aktif
const totalPossibleSlots = computed(() => {
  // Jumlah karyawan * jumlah hari dalam minggu (misal 12 orang * 7 hari = 84 slot)
  return filteredEmployees.value.length * currentWeekDays.value.length;
});

const filledSlotsCount = computed(() => {
  let count = 0;
  filteredEmployees.value.forEach(emp => {
    currentWeekDays.value.forEach(d => {
      const s = matrixState.value[`${emp.id}_${d.dayNum}`];
      if (s && s !== 'L') {
        count++;
      }
    });
  });
  return count;
});

const filledPercentage = computed(() => {
  if (totalPossibleSlots.value === 0) return 0;
  return Math.round((filledSlotsCount.value / totalPossibleSlots.value) * 100);
});

// Aksi Toolbar
const resetMatrix = () => {
  if (confirm(`Reset seluruh shift minggu ini (${weekDateRangeLabel.value})?`)) {
    currentWeekDays.value.forEach(d => {
      allPersonnel.value.forEach(p => {
        delete matrixState.value[`${p.id}_${d.dayNum}`];
      });
    });
    showToast('Seluruh jadwal shift minggu ini telah direset.', 'info');
  }
};

const exportExcel = () => {
  showToast('Mengekspor matriks jadwal ke berkas Excel (.xlsx)...', 'info');
};

const importExcel = () => {
  showToast('Pilih template berkas Excel jadwal kerja untuk diimpor...', 'info');
};

const saveDraft = () => {
  try {
    localStorage.setItem(`bmis_matrix_${currentScheduleTitle.value}`, JSON.stringify(matrixState.value));
    showToast('Jadwal kerja berhasil disimpan sebagai Draf.', 'success');
  } catch (err) {
    showToast('Gagal menyimpan draf.', 'error');
  }
};

const saveAndPublish = () => {
  try {
    localStorage.setItem(`bmis_matrix_${currentScheduleTitle.value}`, JSON.stringify(matrixState.value));
    showToast('Jadwal berhasil disimpan dan diaktifkan! Shift resmi diterapkan ke kalender pegawai.', 'success');
  } catch (err) {
    showToast('Gagal mengaktifkan jadwal.', 'error');
  }
};
</script>

<template>
  <div class="space-y-4 max-w-7xl mx-auto text-slate-800 pb-10">
    <!-- Top Action: Tombol Kembali ke Beranda -->
    <div>
      <button
        type="button"
        @click="goBack"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
      >
        <ArrowLeft :size="14" />
        <span>Kembali ke Beranda</span>
      </button>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-xs text-slate-500">
      <span>Roster</span>
      <span class="text-slate-300">&gt;</span>
      <router-link to="/roster/admin" class="hover:text-bmis-blue">Jadwal Kerja</router-link>
      <span class="text-slate-300">&gt;</span>
      <span class="text-bmis-blue font-semibold">{{ currentScheduleTitle }}</span>
    </nav>

    <!-- Page Title & Main Action Buttons -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">
          Atur Personel dan Shift
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Pengaturan matriks jadwal shift kerja operasional per gedung dan divisi
        </p>
      </div>

      <!-- Action Buttons Top Right -->
      <div class="flex items-center gap-2 self-start md:self-auto flex-wrap">
        <button
          type="button"
          @click="saveDraft"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Bookmark :size="15" class="text-slate-500" />
          <span>Simpan sebagai Draf</span>
        </button>

        <button
          type="button"
          @click="saveAndPublish"
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <CalendarCheck :size="15" />
          <span>Simpan dan Aktifkan Jadwal</span>
        </button>
      </div>
    </div>

    <!-- Info Banner Card (4 Kolom Parameter Jadwal) -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span class="text-[11px] font-medium text-slate-500 block mb-1">Gedung / Lantai</span>
          <span class="font-bold text-slate-800 text-[13px]">{{ currentGedungLantai }}</span>
        </div>
        <div>
          <span class="text-[11px] font-medium text-slate-500 block mb-1">Divisi / Bagian</span>
          <span class="font-bold text-slate-800 text-[13px]">{{ currentDivisi }}</span>
        </div>
        <div>
          <span class="text-[11px] font-medium text-slate-500 block mb-1">Tanggal Mulai</span>
          <span class="font-bold text-slate-800 text-[13px]">{{ currentTanggalMulai }}</span>
        </div>
        <div>
          <span class="text-[11px] font-medium text-slate-500 block mb-1">Maksimal Personel</span>
          <span class="font-bold text-slate-800 text-[13px]">{{ currentMaksimalPersonel }}</span>
        </div>
      </div>
    </div>

    <!-- Filter & Toolbar Card -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
      <!-- Row 1: Search di Kiri & Petunjuk Shift di Kanan -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="w-full lg:w-80">
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Cari Nama Pegawai</label>
          <div class="relative">
            <Search :size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Ketik nama atau NIP..."
              class="w-full h-10 pl-9.5 pr-3 text-xs bg-white border border-slate-300 hover:border-slate-400 focus:border-[#0084CC] focus:ring-2 focus:ring-[#0084CC]/15 rounded-md focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        <!-- Petunjuk Shift Badges -->
        <div class="flex flex-col items-start lg:items-end gap-1.5">
          <div class="flex flex-wrap items-center gap-2 text-[11px]">
            <span class="text-slate-500 font-semibold mr-1">Petunjuk Shift:</span>
            <!-- P: Shift 1 Pagi -->
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] font-medium">
              <span class="w-4 h-4 rounded bg-[#f59e0b] text-white font-black text-[9.5px] flex items-center justify-center">P</span>
              <span><strong>Shift 1 (Pagi)</strong> 07.00-15.00</span>
            </span>
            <!-- S: Shift 2 Siang -->
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#eff6ff] border border-[#bfdbfe] text-[#1d4ed8] font-medium">
              <span class="w-4 h-4 rounded bg-[#0284c7] text-white font-black text-[9.5px] flex items-center justify-center">S</span>
              <span><strong>Shift 2 (Siang)</strong> 15.00-23.00</span>
            </span>
            <!-- M: Shift 3 Malam -->
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#faf5ff] border border-[#e9d5ff] text-[#7e22ce] font-medium">
              <span class="w-4 h-4 rounded bg-[#9333ea] text-white font-black text-[9.5px] flex items-center justify-center">M</span>
              <span><strong>Shift 3 (Malam)</strong> 23.00-07.00</span>
            </span>
          </div>

          <!-- L: Libur Reguler -->
          <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] text-slate-600 text-[11px] font-medium">
            <span class="w-4 h-4 rounded bg-slate-400 text-white font-black text-[9.5px] flex items-center justify-center">L</span>
            <span>Libur Reguler</span>
          </div>
        </div>
      </div>

      <!-- Row 2: Tombol Aksi (Reset, Ekspor Excel, Import Excel) -->
      <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          @click="resetMatrix"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw :size="13" class="text-slate-500" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          @click="exportExcel"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Download :size="13" />
          <span>Ekspor Excel</span>
        </button>

        <button
          type="button"
          @click="importExcel"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] text-xs font-bold transition-colors cursor-pointer"
        >
          <FileSpreadsheet :size="13" />
          <span>Import Excel</span>
        </button>
      </div>
    </div>

    <!-- Week Navigator & Total Slot Counter -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
      <!-- Week Switcher -->
      <div class="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
        <button
          type="button"
          @click="prevWeek"
          :disabled="currentWeek <= 1"
          class="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
        >
          <ChevronLeft :size="16" />
        </button>
        <div class="px-3 py-1 text-xs font-bold text-slate-700 flex items-center gap-2 select-none">
          <Calendar :size="14" class="text-[#0084CC]" />
          <span>Minggu {{ currentWeek }} ({{ weekDateRangeLabel }})</span>
        </div>
        <button
          type="button"
          @click="nextWeek"
          :disabled="currentWeek >= 5"
          class="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
        >
          <ChevronRight :size="16" />
        </button>
      </div>

      <!-- Counter Slot Terisi -->
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-xs">
        <CalendarDays :size="14" class="text-[#0084CC]" />
        <span>
          Total Slot Shift Terisi:
          <strong class="text-slate-900 font-bold">{{ filledSlotsCount }} / {{ totalPossibleSlots }} Slot</strong>
          <span class="text-slate-500"> ({{ filledPercentage }}%)</span>
        </span>
      </div>
    </div>

    <!-- Table Container: Matriks Penjadwalan Shift Interaktif -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs bg-white min-w-[850px]">
          <!-- Table Header -->
          <thead>
            <tr class="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
              <th class="w-12 px-3 py-3 text-center border-r border-slate-200 text-slate-500 font-semibold">
                #
              </th>
              <th class="w-64 px-4 py-3 border-r border-slate-200">
                NAMA &amp; NIP PEGAWAI
              </th>
              <th class="w-24 px-3 py-3 text-center border-r border-slate-200">
                TOTAL
              </th>
              <!-- Kolom Hari dalam Minggu Aktif -->
              <th
                v-for="d in currentWeekDays"
                :key="'th-' + d.dayNum"
                :class="[
                  'px-2 py-2.5 text-center border-r border-slate-200 min-w-[70px]',
                  d.isWeekend ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-slate-100/90 text-slate-700'
                ]"
              >
                <div class="text-[13px] font-black leading-tight">{{ d.dayNum }}</div>
                <div :class="['text-[9px] uppercase font-bold tracking-wider mt-0.5', d.isWeekend ? 'text-[#b45309]' : 'text-slate-500']">
                  {{ d.dayName }}
                </div>
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(emp, idx) in filteredEmployees"
              :key="emp.id"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <!-- Index # -->
              <td class="px-3 py-3 text-center font-bold text-slate-400 border-r border-slate-100">
                {{ idx + 1 }}
              </td>

              <!-- Nama & NIP Pegawai -->
              <td class="px-4 py-3 border-r border-slate-100">
                <div class="font-bold text-slate-900 text-xs">
                  {{ emp.nama }}
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  {{ emp.nip }} • {{ emp.jabatan }}
                </div>
              </td>

              <!-- Total Shift -->
              <td class="px-3 py-3 text-center font-bold text-slate-700 border-r border-slate-100 text-xs">
                {{ calculateEmployeeTotal(emp.id) }}
              </td>

              <!-- Sel Tanggal dengan Grid 2x2: P, S, M, L -->
              <td
                v-for="d in currentWeekDays"
                :key="'cell-' + emp.id + '-' + d.dayNum"
                :class="[
                  'px-1.5 py-2 text-center border-r border-slate-100 align-middle',
                  d.isWeekend ? 'bg-[#fffdf7]' : ''
                ]"
              >
                <div class="inline-grid grid-cols-2 gap-1 place-items-center">
                  <!-- P (Shift 1 Pagi) -->
                  <button
                    type="button"
                    @click="setShift(emp.id, d.dayNum, 'P')"
                    :class="[
                      'w-[22px] h-[19px] rounded text-[9.5px] font-black flex items-center justify-center transition-all cursor-pointer',
                      getShift(emp.id, d.dayNum) === 'P'
                        ? 'bg-[#f59e0b] border border-[#d97706] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-400 bg-white hover:border-[#f59e0b] hover:text-[#f59e0b]'
                    ]"
                    title="Pagi: 07.00 - 15.00"
                  >
                    P
                  </button>

                  <!-- S (Shift 2 Siang) -->
                  <button
                    type="button"
                    @click="setShift(emp.id, d.dayNum, 'S')"
                    :class="[
                      'w-[22px] h-[19px] rounded text-[9.5px] font-black flex items-center justify-center transition-all cursor-pointer',
                      getShift(emp.id, d.dayNum) === 'S'
                        ? 'bg-[#0284c7] border border-[#0369a1] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-400 bg-white hover:border-[#0284c7] hover:text-[#0284c7]'
                    ]"
                    title="Siang: 15.00 - 23.00"
                  >
                    S
                  </button>

                  <!-- M (Shift 3 Malam) -->
                  <button
                    type="button"
                    @click="setShift(emp.id, d.dayNum, 'M')"
                    :class="[
                      'w-[22px] h-[19px] rounded text-[9.5px] font-black flex items-center justify-center transition-all cursor-pointer',
                      getShift(emp.id, d.dayNum) === 'M'
                        ? 'bg-[#9333ea] border border-[#7e22ce] text-white shadow-xs'
                        : 'border border-slate-200 text-slate-400 bg-white hover:border-[#9333ea] hover:text-[#9333ea]'
                    ]"
                    title="Malam: 23.00 - 07.00"
                  >
                    M
                  </button>

                  <!-- L (Libur Reguler) -->
                  <button
                    type="button"
                    @click="setShift(emp.id, d.dayNum, 'L')"
                    :class="[
                      'w-[22px] h-[19px] rounded text-[9.5px] font-black flex items-center justify-center transition-all cursor-pointer',
                      getShift(emp.id, d.dayNum) === 'L'
                        ? 'bg-slate-500 border border-slate-600 text-white shadow-xs'
                        : 'border border-slate-200 text-slate-400 bg-white hover:border-slate-400 hover:text-slate-600'
                    ]"
                    title="Libur Reguler"
                  >
                    L
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty Search State -->
            <tr v-if="filteredEmployees.length === 0">
              <td :colspan="3 + currentWeekDays.length" class="text-center py-10 text-slate-400">
                Tidak ada data pegawai yang sesuai dengan pencarian "{{ searchQuery }}".
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Toast Notification Popup -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isToastVisible"
        class="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-md"
        :class="[
          toastType === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : '',
          toastType === 'info' ? 'bg-sky-50 text-sky-800 border-sky-200' : '',
          toastType === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : ''
        ]"
      >
        <CheckCircle2 v-if="toastType === 'success'" :size="16" class="text-emerald-600" />
        <Info v-else :size="16" class="text-sky-600" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>
