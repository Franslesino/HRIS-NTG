<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  CalendarDays,
  Clock,
  Building2,
  Calendar,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
  CheckCircle2,
  ShieldCheck,
  Send,
  Map,
  Info,
  Check
} from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import { useRosterStore } from '../../composables/useRosterStore';

const { currentUser } = useAuth();
const { addSwapRequest } = useRosterStore();

// State Bulan Aktif (Default bulan saat ini)
const now = new Date();
const currentYear = ref(now.getFullYear());
const currentMonthIndex = ref(now.getMonth()); // 0-indexed (9 = Oktober)

// Helper Bulan & Format Periode
const monthNamesIndo = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const monthShortNamesIndo = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const currentMonthLabel = computed(() => {
  return `${monthNamesIndo[currentMonthIndex.value]} ${currentYear.value}`;
});

const currentPeriodLabel = computed(() => {
  const lastDay = new Date(currentYear.value, currentMonthIndex.value + 1, 0).getDate();
  const mName = monthNamesIndo[currentMonthIndex.value];
  return `Periode 1 ${mName} - ${lastDay} ${mName} ${currentYear.value}`;
});

const previousMonth = () => {
  if (currentMonthIndex.value === 0) {
    currentMonthIndex.value = 11;
    currentYear.value--;
  } else {
    currentMonthIndex.value--;
  }
};

const nextMonth = () => {
  if (currentMonthIndex.value === 11) {
    currentMonthIndex.value = 0;
    currentYear.value++;
  } else {
    currentMonthIndex.value++;
  }
};

// Logika Kalender Bulanan Sesuai Pola Roster
interface CalendarCell {
  isCurrentMonth: boolean;
  dayNumber: number;
  label?: string;
  isToday: boolean;
  dayOfWeekIndex: number; // 0 = SEN, 6 = MIN
  shiftCode: 'Pagi' | 'Siang' | 'Malam' | 'OFF';
  shiftTime: string;
  badge?: 'Menunggu Rekan' | 'Menunggu Koordinator';
}

const submittedSwapDays = ref<number[]>([15]);

const calendarDays = computed<CalendarCell[]>(() => {
  const y = currentYear.value;
  const m = currentMonthIndex.value;

  const firstDayObj = new Date(y, m, 1);
  const totalDaysCurrent = new Date(y, m + 1, 0).getDate();
  const totalDaysPrev = new Date(y, m, 0).getDate();

  // Konversi hari pertama agar Senin = 0, Minggu = 6
  // JS getDay(): 0 = Min, 1 = Sen, 2 = Sel, 3 = Rab, 4 = Kam, 5 = Jum, 6 = Sab
  const firstDow = (firstDayObj.getDay() + 6) % 7;

  const cells: CalendarCell[] = [];

  // 1. Hari dari bulan sebelumnya
  for (let i = firstDow - 1; i >= 0; i--) {
    const prevDayNum = totalDaysPrev - i;
    cells.push({
      isCurrentMonth: false,
      dayNumber: prevDayNum,
      label: String(prevDayNum),
      isToday: false,
      dayOfWeekIndex: cells.length % 7,
      shiftCode: 'OFF',
      shiftTime: '',
    });
  }

  // 2. Hari bulan aktif
  const todayActual = new Date();
  const isThisActualMonth = todayActual.getFullYear() === y && todayActual.getMonth() === m;
  const actualDateNum = todayActual.getDate();

  for (let d = 1; d <= totalDaysCurrent; d++) {
    const dow = (cells.length) % 7;

    // Pola rotasi shift realistis BMIS
    // d % 4 === 1 -> Pagi (08:00 - 16:00)
    // d % 4 === 2 -> Siang (16:00 - 00:00)
    // d % 4 === 3 -> Malam (00:00 - 08:00)
    // d % 4 === 0 -> OFF (Libur)
    let shiftCode: 'Pagi' | 'Siang' | 'Malam' | 'OFF' = 'OFF';
    let shiftTime = 'Libur';

    const mod = d % 4;
    if (mod === 1) {
      shiftCode = 'Pagi';
      shiftTime = '08:00 - 16:00';
    } else if (mod === 2) {
      shiftCode = 'Siang';
      shiftTime = '16:00 - 00:00';
    } else if (mod === 3) {
      shiftCode = 'Malam';
      shiftTime = '00:00 - 08:00';
    } else {
      shiftCode = 'OFF';
      shiftTime = 'Libur';
    }

    // Hari ini (Today check)
    // Default fallback hari ke-8 jika di luar bulan aktual untuk demo visual
    const isToday = isThisActualMonth ? (d === actualDateNum) : (d === 8);

    // Badges khusus seperti di desain BMIS
    let badge: 'Menunggu Rekan' | 'Menunggu Koordinator' | undefined = undefined;
    if (submittedSwapDays.value.includes(d)) {
      badge = 'Menunggu Rekan';
    } else if (d === 23) {
      badge = 'Menunggu Koordinator';
    }

    cells.push({
      isCurrentMonth: true,
      dayNumber: d,
      label: String(d),
      isToday,
      dayOfWeekIndex: dow,
      shiftCode,
      shiftTime,
      badge,
    });
  }

  // 3. Hari bulan berikutnya untuk melengkapi baris kalender
  const totalCellsSoFar = cells.length;
  const remaining = (7 - (totalCellsSoFar % 7)) % 7;
  const nextMonthShort = monthShortNamesIndo[(m + 1) % 12];

  for (let n = 1; n <= remaining; n++) {
    cells.push({
      isCurrentMonth: false,
      dayNumber: n,
      label: n <= 2 ? `${n} ${nextMonthShort}` : String(n),
      isToday: false,
      dayOfWeekIndex: cells.length % 7,
      shiftCode: 'OFF',
      shiftTime: '',
    });
  }

  return cells;
});

// Perhitungan Statistik Roster
const currentMonthShifts = computed(() => {
  return calendarDays.value.filter(c => c.isCurrentMonth);
});

const workShiftsCount = computed(() => {
  return currentMonthShifts.value.filter(c => c.shiftCode !== 'OFF').length;
});

const offDaysCount = computed(() => {
  return currentMonthShifts.value.filter(c => c.shiftCode === 'OFF').length;
});

const totalWorkHours = computed(() => {
  return workShiftsCount.value * 8;
});

// Modal Ajukan Pertukaran Jadwal Shift (Shift Swap)
const isSwapModalOpen = ref(false);

interface MyShiftOption {
  dayNumber: number;
  formattedDate: string;
  shiftCode: 'Pagi' | 'Siang' | 'Malam';
  shiftTime: string;
  fullLabel: string;
}

interface ColleagueOption {
  id: string;
  name: string;
  empId: string;
  role: string;
  fullLabel: string;
}

const qualifiedColleagues: ColleagueOption[] = [
  {
    id: 'EMP-042',
    name: 'Budi Raharjo',
    empId: 'EMP-042',
    role: 'Staff Operasional',
    fullLabel: 'Budi Raharjo (EMP-042) — Staff Operasional'
  },
  {
    id: 'EMP-055',
    name: 'Siti Nurhaliza',
    empId: 'EMP-055',
    role: 'Staff Operasional',
    fullLabel: 'Siti Nurhaliza (EMP-055) — Staff Operasional'
  },
  {
    id: 'EMP-061',
    name: 'Rian Hidayat',
    empId: 'EMP-061',
    role: 'Staff Operasional',
    fullLabel: 'Rian Hidayat (EMP-061) — Staff Operasional'
  },
  {
    id: 'EMP-073',
    name: 'Dimas Anggara',
    empId: 'EMP-073',
    role: 'Staff Operasional',
    fullLabel: 'Dimas Anggara (EMP-073) — Staff Operasional'
  }
];

// List shift aktif pemohon di bulan yang dipilih (bukan hari OFF)
const myActiveShifts = computed<MyShiftOption[]>(() => {
  const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const y = currentYear.value;
  const m = currentMonthIndex.value;
  const mShort = monthShortNamesIndo[m];

  return calendarDays.value
    .filter(c => c.isCurrentMonth && c.shiftCode !== 'OFF')
    .map(c => {
      const dateObj = new Date(y, m, c.dayNumber);
      const dayName = dayNamesIndo[dateObj.getDay()];
      const formattedDate = `${dayName}, ${c.dayNumber} ${mShort} ${y}`;
      return {
        dayNumber: c.dayNumber,
        formattedDate,
        shiftCode: c.shiftCode as 'Pagi' | 'Siang' | 'Malam',
        shiftTime: c.shiftTime,
        fullLabel: `${formattedDate} — Shift ${c.shiftCode} (${c.shiftTime} WIB)`
      };
    });
});

const selectedMyShiftDay = ref<number>(9);
const selectedColleagueId = ref<string>('EMP-042');
const swapReason = ref<string>(
  'Keperluan keluarga mendesak di luar kota pada shift Pagi. Mohon bantuannya rekan Budi, terima kasih banyak sebelumnya.'
);

const selectedMyShiftDetail = computed(() => {
  const found = myActiveShifts.value.find(s => s.dayNumber === selectedMyShiftDay.value);
  if (found) return found;
  return (
    myActiveShifts.value[0] || {
      dayNumber: 9,
      formattedDate: `Kamis, 9 Okt ${currentYear.value}`,
      shiftCode: 'Pagi' as const,
      shiftTime: '08:00 - 16:00',
      fullLabel: `Kamis, 9 Okt ${currentYear.value} — Shift Pagi (08:00 - 16:00 WIB)`
    }
  );
});

const selectedColleagueDetail = computed(() => {
  return (
    qualifiedColleagues.find(c => c.id === selectedColleagueId.value) ||
    qualifiedColleagues[0]
  );
});

const openSwapModal = () => {
  if (myActiveShifts.value.length > 0 && !myActiveShifts.value.some(s => s.dayNumber === selectedMyShiftDay.value)) {
    selectedMyShiftDay.value = myActiveShifts.value[0].dayNumber;
  }
  isSwapModalOpen.value = true;
};

// Modal Peta Lokasi Penugasan
const isMapModalOpen = ref(false);

// Toast Notification
const toastMessage = ref('');
const isToastVisible = ref(false);
const triggerToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 4000);
};

const submitSwapRequest = () => {
  if (!swapReason.value.trim()) {
    triggerToast('Harap sertakan alasan penukaran shift!');
    return;
  }
  if (!submittedSwapDays.value.includes(selectedMyShiftDay.value)) {
    submittedSwapDays.value.push(selectedMyShiftDay.value);
  }

  addSwapRequest({
    id: `swap-${Date.now()}`,
    requesterId: currentUser.value?.id || 'usr-employee-asep',
    requesterName: currentUser.value?.nama || 'Asep Milo',
    colleagueId: selectedColleagueDetail.value.id,
    colleagueName: selectedColleagueDetail.value.name,
    swapDate: selectedMyShiftDetail.value.formattedDate,
    myShift: `Shift ${selectedMyShiftDetail.value.shiftCode}`,
    colleagueShift: selectedMyShiftDetail.value.shiftCode === 'Pagi' ? 'Shift Siang' : 'Shift Pagi',
    status: 'Menunggu Approval',
    colleagueApproved: true,
    restValidationNotes: 'Telah divalidasi tidak melanggar batas jeda istirahat 11 jam.',
    reason: swapReason.value,
    createdAt: 'Hari ini'
  });

  isSwapModalOpen.value = false;
  triggerToast(`Pengajuan tukar shift berhasil dikirim ke rekan ${selectedColleagueDetail.value.name} & koordinator.`);
};
</script>

<template>
  <div class="user-roster-page space-y-5 max-w-7xl mx-auto text-slate-800">
    <!-- Breadcrumb & Top Bar -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <nav class="flex items-center gap-1.5 text-xs text-[#64748b] mb-1">
          <span>Roster</span>
          <span class="text-slate-300">&gt;</span>
          <span class="text-[#0284c7] font-semibold">Jadwal Roster Anda</span>
        </nav>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black text-[#1e293b] tracking-tight">
            Jadwal Roster Anda
          </h1>
        </div>
        <p class="text-xs text-[#64748b] mt-0.5">
          Bulan Ini &bull; {{ currentPeriodLabel }}
        </p>
      </div>

      <!-- Action Buttons & Month Navigator -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Month Navigator Pill Container -->
        <div class="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
          <button
            type="button"
            @click="previousMonth"
            class="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft :size="14" />
            <span>Bulan Sebelumnya</span>
          </button>

          <span class="h-8 px-4 rounded-lg bg-slate-50 text-xs font-bold text-slate-800 flex items-center border border-slate-100">
            {{ currentMonthLabel }}
          </span>

          <button
            type="button"
            @click="nextMonth"
            class="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Bulan Selanjutnya</span>
            <ChevronRight :size="14" />
          </button>
        </div>

        <!-- Tombol Ajukan Tukar Shift -->
        <button
          type="button"
          @click="openSwapModal"
          class="h-10 px-4 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <ArrowLeftRight :size="15" />
          <span>Ajukan Tukar Shift</span>
        </button>
      </div>
    </div>

    <!-- ── BARIS INFORMASI PENUGASAN & LOKASI (HORIZONTAL BANNER DI ATAS KALENDER) ── -->
    <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <!-- 1. Gedung & Ruang Operasional -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0084c4] flex items-center justify-center flex-shrink-0">
          <Building2 :size="20" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-xs text-slate-800">Gedung Utama BMIS</h3>
            <span class="px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] text-[9.5px] font-bold">
              Aktif
            </span>
          </div>
          <p class="text-[11px] text-slate-500 m-0">Lantai 3, Ruang Operasional 302</p>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-8 w-px bg-slate-200 hidden lg:block"></div>

      <!-- 2. Detail Rincian: Periode, Koordinator, Kontak & Kapasitas -->
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Periode Penugasan</span>
          <span class="font-bold text-slate-700">1 {{ monthShortNamesIndo[currentMonthIndex] }} - 31 {{ monthShortNamesIndo[currentMonthIndex] }} {{ currentYear }}</span>
        </div>

        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Koordinator Shift</span>
          <div class="flex items-center gap-1.5 font-bold text-slate-700">
            <span class="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[8.5px] font-bold flex items-center justify-center">
              AS
            </span>
            <span>Bpk. Ahmad S.</span>
          </div>
        </div>

        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kontak Koordinator</span>
          <span class="font-semibold text-slate-700">EXT 3021 &bull; <span class="text-slate-500">+62 812-3456-7890</span></span>
        </div>

        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kapasitas Posisi</span>
          <span class="font-bold text-slate-700">6 Personel / Shift</span>
        </div>
      </div>

      <!-- 3. Tombol Aksi: Lihat Peta Lokasi -->
      <div class="flex-shrink-0">
        <button
          type="button"
          @click="isMapModalOpen = true"
          class="h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <Map :size="14" class="text-slate-600" />
          <span>Lihat Peta Lokasi</span>
        </button>
      </div>
    </div>

    <!-- ── GRID UTAMA: KALENDER (KIRI 8 COLS) & WIDGET INFO (KANAN 4 COLS) ── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- ── KOLOM KIRI: KALENDER JADWAL ROSTER (8 COLS) ── -->
      <div class="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <!-- Day of Week Headers -->
        <div class="grid grid-cols-7 gap-2 border-b border-slate-100 pb-2.5">
          <div class="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">SEN</div>
          <div class="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">SEL</div>
          <div class="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">RAB</div>
          <div class="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">KAM</div>
          <div class="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">JUM</div>
          <div class="text-center text-[11px] font-bold text-[#d97706] uppercase tracking-wider">SAB</div>
          <div class="text-center text-[11px] font-bold text-[#dc2626] uppercase tracking-wider">MIN</div>
        </div>

        <!-- Calendar Month Grid (7 columns) -->
        <div class="grid grid-cols-7 gap-2">
          <div
            v-for="(cell, idx) in calendarDays"
            :key="idx"
            :class="[
              'rounded-xl p-2 flex flex-col justify-between min-h-[96px] transition-all relative',
              !cell.isCurrentMonth
                ? 'bg-transparent border border-dashed border-slate-100 text-slate-300'
                : cell.isToday
                  ? 'bg-white border-2 border-[#0084c4] shadow-xs ring-2 ring-[#0084c4]/10'
                  : 'bg-white border border-slate-200 hover:border-slate-300 shadow-2xs'
            ]"
          >
            <!-- Top Row: Day Number & Today Badge -->
            <div class="flex items-center justify-between mb-1">
              <span
                v-if="cell.isCurrentMonth && cell.isToday"
                class="w-5 h-5 rounded-full bg-[#0084c4] text-white text-[11px] font-bold flex items-center justify-center"
              >
                {{ cell.dayNumber }}
              </span>
              <span
                v-else
                :class="[
                  'text-xs font-bold leading-none',
                  !cell.isCurrentMonth
                    ? 'text-slate-300'
                    : cell.dayOfWeekIndex === 6
                      ? 'text-[#dc2626]'
                      : cell.dayOfWeekIndex === 5
                        ? 'text-[#d97706]'
                        : 'text-slate-700'
                ]"
              >
                {{ cell.label }}
              </span>

              <span
                v-if="cell.isCurrentMonth && cell.isToday"
                class="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-[#e0f2fe] text-[#0284c7] uppercase tracking-tight"
              >
                HARI INI
              </span>
            </div>

            <!-- Middle: Shift Container -->
            <div v-if="cell.isCurrentMonth" class="space-y-1">
              <!-- Shift Pagi (Hijau Segar) -->
              <div
                v-if="cell.shiftCode === 'Pagi'"
                class="bg-[#eaf8f0] border border-[#bbf7d0] text-[#16a34a] rounded-lg p-1.5 text-center transition-transform"
              >
                <div class="font-bold text-[11px] leading-tight">Pagi</div>
                <div class="text-[9.5px] font-medium text-emerald-700 mt-0.5 leading-none">
                  {{ cell.shiftTime }}
                </div>
              </div>

              <!-- Shift Siang (Biru) -->
              <div
                v-else-if="cell.shiftCode === 'Siang'"
                class="bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] rounded-lg p-1.5 text-center transition-transform"
              >
                <div class="font-bold text-[11px] leading-tight">Siang</div>
                <div class="text-[9.5px] font-medium text-blue-700 mt-0.5 leading-none">
                  {{ cell.shiftTime }}
                </div>
              </div>

              <!-- Shift Malam (Ungu) -->
              <div
                v-else-if="cell.shiftCode === 'Malam'"
                class="bg-[#faf5ff] border border-[#e9d5ff] text-[#9333ea] rounded-lg p-1.5 text-center transition-transform"
              >
                <div class="font-bold text-[11px] leading-tight">Malam</div>
                <div class="text-[9.5px] font-medium text-purple-700 mt-0.5 leading-none">
                  {{ cell.shiftTime }}
                </div>
              </div>

              <!-- Shift OFF (Abu-abu Bersih) -->
              <div
                v-else
                class="bg-[#f8fafc] border border-[#e2e8f0] text-slate-400 rounded-lg p-1.5 text-center"
              >
                <div class="font-bold text-[11px] text-slate-500 leading-tight">OFF</div>
                <div class="text-[9.5px] text-slate-400 mt-0.5 leading-none">Libur</div>
              </div>

              <!-- Badges Status Khusus Penukaran Shift -->
              <div
                v-if="cell.badge === 'Menunggu Rekan'"
                class="inline-flex items-center gap-1 w-full justify-center px-1 py-0.5 rounded bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-[8.5px] font-bold leading-tight"
                title="Permintaan tukar shift menunggu persetujuan rekan kerja"
              >
                <Clock :size="9" class="flex-shrink-0" />
                <span class="truncate">Menunggu Rekan</span>
              </div>

              <div
                v-else-if="cell.badge === 'Menunggu Koordinator'"
                class="inline-flex items-center gap-1 w-full justify-center px-1 py-0.5 rounded bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-[8.5px] font-bold leading-tight"
                title="Permintaan tukar shift menunggu verifikasi koordinator shift"
              >
                <ShieldCheck :size="9" class="flex-shrink-0" />
                <span class="truncate">Menunggu Koordinator</span>
              </div>
            </div>

            <!-- Spacer for inactive month cells -->
            <div v-else class="h-10"></div>
          </div>
        </div>

        <!-- Footer of Calendar Card -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          <div class="inline-flex items-center gap-2 text-slate-500">
            <span class="w-2 h-2 rounded-full bg-[#0084c4]"></span>
            <span>Roster ini telah disetujui oleh Kepala Bagian SDM Operasional.</span>
          </div>
          <span class="text-slate-400 text-[11px] font-medium">
            Versi Roster: v2.4 ({{ monthShortNamesIndo[currentMonthIndex] }} {{ currentYear }})
          </span>
        </div>
      </div>

      <!-- ── KOLOM KANAN: WIDGET JADWAL SHIFT & LOKASI (4 COLS) ── -->
      <div class="lg:col-span-4 space-y-5">
        <!-- 1. Card Jadwal Shift & Kategori -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <!-- Card Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <Clock :size="16" class="text-[#0084c4]" />
              <h2 class="text-sm font-bold text-slate-800">Jadwal Shift</h2>
            </div>
            <span class="text-xs text-slate-400 font-medium">4 Kategori</span>
          </div>

          <!-- 4 Category Items Vertical -->
          <div class="space-y-2.5 text-xs">
            <!-- 1. Shift Pagi -->
            <div class="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-[#16a34a] flex-shrink-0"></div>
              <div>
                <div class="font-bold text-slate-800 text-xs">Shift Pagi</div>
                <div class="text-[11px] text-slate-500 mt-0.5">08:00 - 16:00 (8 Jam)</div>
              </div>
            </div>

            <!-- 2. Shift Siang -->
            <div class="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-3 flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-[#2563eb] flex-shrink-0"></div>
              <div>
                <div class="font-bold text-slate-800 text-xs">Shift Siang</div>
                <div class="text-[11px] text-slate-500 mt-0.5">16:00 - 00:00 (8 Jam)</div>
              </div>
            </div>

            <!-- 3. Shift Malam -->
            <div class="bg-[#faf5ff] border border-[#e9d5ff] rounded-xl p-3 flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-[#9333ea] flex-shrink-0"></div>
              <div>
                <div class="font-bold text-slate-800 text-xs">Shift Malam</div>
                <div class="text-[11px] text-slate-500 mt-0.5">00:00 - 08:00 (8 Jam)</div>
              </div>
            </div>

            <!-- 4. Hari Libur (OFF) -->
            <div class="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-slate-400 flex-shrink-0"></div>
              <div>
                <div class="font-bold text-slate-800 text-xs">Hari Libur (OFF)</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Istirahat Mingguan / Siklus</div>
              </div>
            </div>
          </div>

          <!-- Bottom 3 Stats Row -->
          <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL JAM</span>
              <div class="text-base font-black text-slate-800 mt-0.5">{{ totalWorkHours }} Jam</div>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MASUK KERJA</span>
              <div class="text-base font-black text-[#0084c4] mt-0.5">{{ workShiftsCount }} Hari</div>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LIBUR</span>
              <div class="text-base font-black text-slate-700 mt-0.5">{{ offDaysCount }} Hari</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODAL 1: AJUKAN TUKAR SHIFT (SHIFT SWAP) SESUAI DESAIN BMIS ── -->
    <Teleport to="body">
      <div
        v-if="isSwapModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          <!-- Modal Header -->
          <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-[#0084c4]/10 text-[#0084c4] flex items-center justify-center shrink-0">
                <ArrowLeftRight :size="20" />
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800">
                  Ajukan Pertukaran Jadwal Shift (Shift Swap)
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  Pilih shift Anda yang ingin ditukar, lalu tentukan rekan kerja pengganti sesuai kriteria kualifikasi.
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="isSwapModalOpen = false"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Stepper Indicator -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Step 1 Card -->
            <div class="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-full bg-[#0084c4] text-white text-xs font-black flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-800">Langkah 1: Shift Anda yang Ditukar</div>
                  <div class="text-[11px] text-[#0084c4] font-semibold">Jadwal Pemohon Dipilih</div>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border border-[#0084c4] text-[#0084c4] flex items-center justify-center">
                <Check :size="12" />
              </div>
            </div>

            <!-- Step 2 Card -->
            <div class="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-full bg-[#0084c4] text-white text-xs font-black flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-800">Langkah 2: Rekan &amp; Shift Tujuan</div>
                  <div class="text-[11px] text-[#0084c4] font-semibold">Siap Dipilih</div>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border border-[#0084c4] text-[#0084c4] flex items-center justify-center">
                <Check :size="12" />
              </div>
            </div>
          </div>

          <form @submit.prevent="submitSwapRequest" class="space-y-4">
            <!-- Two Columns Form -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Left Column: Langkah 1 -->
              <div class="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-2xs flex flex-col justify-between">
                <div class="space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[11px] font-bold text-slate-700 tracking-wide uppercase">
                      LANGKAH 1 &bull; PILIH JADWAL ANDA YANG INGIN DILEPAS
                    </span>
                    <span class="px-2 py-0.5 rounded-md bg-[#e0f2fe] text-[#0284c7] text-[10px] font-bold shrink-0">
                      Jadwal Aktif Terdaftar
                    </span>
                  </div>

                  <div>
                    <label class="block font-bold text-xs text-slate-700 mb-1.5">
                      Pilih Hari &amp; Shift Anda
                    </label>
                    <select
                      v-model="selectedMyShiftDay"
                      class="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0084c4] focus:ring-1 focus:ring-[#0084c4]/20 transition-all font-medium"
                    >
                      <option
                        v-for="s in myActiveShifts"
                        :key="s.dayNumber"
                        :value="s.dayNumber"
                      >
                        {{ s.fullLabel }}
                      </option>
                    </select>
                  </div>

                  <!-- Profile & Selected Shift Summary Box -->
                  <div class="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full bg-[#0084c4] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {{ currentUser?.avatarInitials || 'AM' }}
                      </div>
                      <div>
                        <div class="font-bold text-xs text-slate-800">
                          {{ currentUser?.nama || 'Asep Milo' }} ({{ currentUser?.nip || 'EMP-018' }})
                        </div>
                        <div class="text-[11px] text-slate-500 font-medium">
                          Staff Operasional
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70">
                      <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SHIFT</span>
                        <span class="text-xs font-bold text-[#0084c4]">
                          {{ selectedMyShiftDetail.shiftCode }} ({{ selectedMyShiftDetail.shiftTime }})
                        </span>
                      </div>
                      <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STATUS HARI</span>
                        <span class="text-xs font-bold text-emerald-600">
                          Hari Kerja Aktif
                        </span>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-slate-200/70">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LOKASI PENUGASAN</span>
                      <span class="text-xs font-semibold text-slate-700">
                        Gedung Utama BMIS, Ruang Operasional 302
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Helper text -->
                <div class="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <Info :size="13" class="text-slate-400 shrink-0" />
                  <span>Hanya hari aktif (bukan hari OFF) yang dapat ditukar.</span>
                </div>
              </div>

              <!-- Right Column: Langkah 2 -->
              <div class="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-2xs flex flex-col justify-between">
                <div class="space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[11px] font-bold text-slate-700 tracking-wide uppercase">
                      LANGKAH 2 &bull; PILIH REKAN KERJA &amp; SHIFT TUJUAN
                    </span>
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0">
                      Filter Kualifikasi Sama
                    </span>
                  </div>

                  <div>
                    <label class="block font-bold text-xs text-slate-700 mb-1.5">
                      Pilih Rekan Kerja Pengganti
                    </label>
                    <select
                      v-model="selectedColleagueId"
                      class="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0084c4] focus:ring-1 focus:ring-[#0084c4]/20 transition-all font-medium"
                    >
                      <option
                        v-for="c in qualifiedColleagues"
                        :key="c.id"
                        :value="c.id"
                      >
                        {{ c.fullLabel }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="font-bold text-xs text-slate-700">
                        Alasan Pertukaran Shift
                      </label>
                    </div>
                    <textarea
                      v-model="swapReason"
                      rows="4"
                      maxlength="250"
                      placeholder="Tuliskan alasan permohonan pertukaran shift..."
                      class="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-[#0084c4] focus:ring-1 focus:ring-[#0084c4]/20 transition-all placeholder:text-slate-400"
                    ></textarea>
                    <div class="flex justify-end text-[10px] text-slate-400 mt-1 font-medium">
                      {{ swapReason.length }} / 250 karakter
                    </div>
                  </div>
                </div>

                <!-- Bottom Row: Konfirmasi Persetujuan -->
                <div class="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <span class="text-xs text-slate-500 font-medium">Konfirmasi Persetujuan</span>
                  <span class="text-xs font-bold text-[#0084c4]">Memerlukan Konfirmasi Rekan</span>
                </div>
              </div>
            </div>

            <!-- Real-time SOP Compliance Check Banner -->
            <div class="bg-[#f0f9ff]/70 border border-[#bae6fd] rounded-xl p-3.5 space-y-2.5">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-1.5">
                  <ShieldCheck :size="16" class="text-[#0084c4]" />
                  <span class="text-xs font-black text-slate-800 tracking-wider uppercase">
                    REAL-TIME SOP COMPLIANCE CHECK
                  </span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  4 / 4 Kriteria Terpenuhi
                </span>
              </div>

              <!-- 4 Criteria Items -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div class="bg-white border border-emerald-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 :size="14" class="text-emerald-600 shrink-0" />
                  <span class="text-[11px] font-semibold text-slate-700">Unit Sama (Operasional)</span>
                </div>
                <div class="bg-white border border-emerald-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 :size="14" class="text-emerald-600 shrink-0" />
                  <span class="text-[11px] font-semibold text-slate-700">Kualifikasi Setara</span>
                </div>
                <div class="bg-white border border-emerald-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 :size="14" class="text-emerald-600 shrink-0" />
                  <span class="text-[11px] font-semibold text-slate-700">Tanggal Valid (&gt;24 jam)</span>
                </div>
                <div class="bg-white border border-emerald-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 :size="14" class="text-emerald-600 shrink-0" />
                  <span class="text-[11px] font-semibold text-slate-700">Rest Interval &gt;16 Jam</span>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <Send :size="13" class="text-slate-400 shrink-0" />
                <span>
                  Rekan <strong class="text-slate-700 font-bold">{{ selectedColleagueDetail.name }}</strong> akan menerima notifikasi otomatis sebelum diteruskan ke koordinator.
                </span>
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  @click="isSwapModalOpen = false"
                  class="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  class="h-9 px-5 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  <ArrowLeftRight :size="14" />
                  <span>Kirim Pengajuan Tukar</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 2: PETA LOKASI PENUGASAN ── -->
    <Teleport to="body">
      <div
        v-if="isMapModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0084c4] flex items-center justify-center">
                <MapPin :size="16" />
              </div>
              <h3 class="text-sm font-bold text-slate-800">Peta &amp; Radius Lokasi Penugasan</h3>
            </div>
            <button type="button" @click="isMapModalOpen = false" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X :size="18" />
            </button>
          </div>

          <div class="space-y-3 text-xs text-slate-600">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
              <Building2 :size="18" class="text-[#0084c4] flex-shrink-0 mt-0.5" />
              <div>
                <strong class="text-slate-800 block text-xs">Gedung Utama BMIS (Menara 1 BTN)</strong>
                <span class="text-[11px] text-slate-500">Lantai 3, Ruang Operasional 302, Jakarta Pusat</span>
              </div>
            </div>

            <!-- Ilustrasi Peta / Koordinat -->
            <div class="h-44 rounded-xl bg-[#e0f2fe]/40 border border-[#bae6fd] flex flex-col items-center justify-center text-center p-4">
              <MapPin :size="32" class="text-[#0084c4] mb-2 animate-bounce" />
              <div class="font-bold text-xs text-slate-800">Koordinat Presensi Terverifikasi</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Latitude: -6.175392 | Longitude: 106.827153</div>
              <span class="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <CheckCircle2 :size="12" /> Radius GPS Resmi 100 Meter
              </span>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="button"
              @click="isMapModalOpen = false"
              class="px-5 py-2 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── TOAST NOTIFICATION ── -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 border-l-4 border-l-[#0084c4] rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 text-xs font-bold text-slate-800"
    >
      <CheckCircle2 :size="18" class="text-[#0084c4] flex-shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
