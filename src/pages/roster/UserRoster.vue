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
import { toast } from 'vue-sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader.vue';

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
const triggerToast = (msg: string) => {
  toast.success(msg);
};

const selectedMyShiftDayModel = computed({
  get: () => String(selectedMyShiftDay.value),
  set: (value: string) => {
    selectedMyShiftDay.value = Number(value);
  },
});

const submitSwapRequest = () => {
  if (!swapReason.value.trim()) {
    toast.warning('Harap sertakan alasan penukaran shift!');
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
  <div class="space-y-6">
    <PageHeader
      title="Jadwal Roster Anda"
      :description="`Bulan ini • ${currentPeriodLabel}`"
      :badge="currentMonthLabel"
      badge-variant="info"
      :breadcrumbs="[{ label: 'Roster' }, { label: 'Jadwal Roster Anda' }]"
    >
      <template #actions>
        <div class="inline-flex items-center gap-1 rounded-lg border bg-background p-1">
          <Button variant="ghost" size="sm" @click="previousMonth">
            <ChevronLeft />
            <span class="hidden sm:inline">Sebelumnya</span>
          </Button>
          <span class="px-3 text-sm font-medium">{{ currentMonthLabel }}</span>
          <Button variant="ghost" size="sm" @click="nextMonth">
            <span class="hidden sm:inline">Selanjutnya</span>
            <ChevronRight />
          </Button>
        </div>

        <Button @click="openSwapModal">
          <ArrowLeftRight />
          Ajukan Tukar Shift
        </Button>
      </template>
    </PageHeader>

    <!-- ASSIGNMENT INFO -->
    <Card>
      <CardContent class="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center">
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 class="size-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium">Gedung Utama BMIS</p>
              <Badge variant="success">Aktif</Badge>
            </div>
            <p class="text-xs text-muted-foreground">Lantai 3, Ruang Operasional 302</p>
          </div>
        </div>

        <div class="hidden h-10 w-px bg-border lg:block" />

        <div class="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div>
            <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Periode Penugasan</span>
            <span class="font-medium">
              1 {{ monthShortNamesIndo[currentMonthIndex] }} - 31
              {{ monthShortNamesIndo[currentMonthIndex] }} {{ currentYear }}
            </span>
          </div>

          <div>
            <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Koordinator Shift</span>
            <div class="flex items-center gap-1.5 font-medium">
              <span class="flex size-4 items-center justify-center rounded-full bg-muted text-[8px] font-semibold">AS</span>
              <span>Bpk. Ahmad S.</span>
            </div>
          </div>

          <div>
            <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Kontak Koordinator</span>
            <span class="font-medium">EXT 3021 • <span class="text-muted-foreground">+62 812-3456-7890</span></span>
          </div>

          <div>
            <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Kapasitas Posisi</span>
            <span class="font-medium">6 Personel / Shift</span>
          </div>
        </div>

        <Button variant="outline" class="shrink-0" @click="isMapModalOpen = true">
          <Map class="text-muted-foreground" />
          Lihat Peta Lokasi
        </Button>
      </CardContent>
    </Card>

    <!-- CALENDAR + SIDEBAR -->
    <div class="grid items-start gap-5 lg:grid-cols-12">
      <!-- CALENDAR -->
      <Card class="lg:col-span-8">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
          <div class="space-y-1">
            <CardTitle class="text-base">Kalender Roster</CardTitle>
            <CardDescription>{{ currentPeriodLabel }}</CardDescription>
          </div>
          <Badge variant="secondary">{{ workShiftsCount }} Hari Kerja</Badge>
        </CardHeader>

        <CardContent class="space-y-4">
          <div class="grid grid-cols-7 gap-2 border-b pb-2.5">
            <div class="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sen</div>
            <div class="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sel</div>
            <div class="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Rab</div>
            <div class="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Kam</div>
            <div class="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Jum</div>
            <div class="text-center text-[11px] font-medium uppercase tracking-wide text-amber-600">Sab</div>
            <div class="text-center text-[11px] font-medium uppercase tracking-wide text-destructive">Min</div>
          </div>

          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="(cell, idx) in calendarDays"
              :key="idx"
              class="relative flex min-h-[96px] flex-col justify-between rounded-lg border p-2 transition-all"
              :class="!cell.isCurrentMonth
                ? 'border-dashed border-border/60 bg-transparent text-muted-foreground/50'
                : cell.isToday
                  ? 'border-2 border-primary bg-background ring-2 ring-primary/10'
                  : 'bg-background hover:border-muted-foreground/30'"
            >
              <div class="mb-1 flex items-center justify-between">
                <span
                  v-if="cell.isCurrentMonth && cell.isToday"
                  class="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
                >
                  {{ cell.dayNumber }}
                </span>
                <span
                  v-else
                  class="text-xs font-semibold leading-none"
                  :class="!cell.isCurrentMonth
                    ? 'text-muted-foreground/50'
                    : cell.dayOfWeekIndex === 6
                      ? 'text-destructive'
                      : cell.dayOfWeekIndex === 5
                        ? 'text-amber-600'
                        : 'text-foreground'"
                >
                  {{ cell.label }}
                </span>

                <span
                  v-if="cell.isCurrentMonth && cell.isToday"
                  class="rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-tight text-primary"
                >
                  Hari Ini
                </span>
              </div>

              <div v-if="cell.isCurrentMonth" class="space-y-1">
                <div
                  v-if="cell.shiftCode === 'Pagi'"
                  class="rounded-md border border-emerald-200 bg-emerald-50 p-1.5 text-center"
                >
                  <div class="text-[11px] font-semibold leading-tight text-emerald-700">Pagi</div>
                  <div class="mt-0.5 text-[9px] font-medium leading-none text-emerald-600">{{ cell.shiftTime }}</div>
                </div>

                <div
                  v-else-if="cell.shiftCode === 'Siang'"
                  class="rounded-md border border-blue-200 bg-blue-50 p-1.5 text-center"
                >
                  <div class="text-[11px] font-semibold leading-tight text-blue-700">Siang</div>
                  <div class="mt-0.5 text-[9px] font-medium leading-none text-blue-600">{{ cell.shiftTime }}</div>
                </div>

                <div
                  v-else-if="cell.shiftCode === 'Malam'"
                  class="rounded-md border border-violet-200 bg-violet-50 p-1.5 text-center"
                >
                  <div class="text-[11px] font-semibold leading-tight text-violet-700">Malam</div>
                  <div class="mt-0.5 text-[9px] font-medium leading-none text-violet-600">{{ cell.shiftTime }}</div>
                </div>

                <div v-else class="rounded-md border bg-muted/50 p-1.5 text-center">
                  <div class="text-[11px] font-semibold leading-tight text-muted-foreground">OFF</div>
                  <div class="mt-0.5 text-[9px] leading-none text-muted-foreground/80">Libur</div>
                </div>

                <div
                  v-if="cell.badge === 'Menunggu Rekan'"
                  class="inline-flex w-full items-center justify-center gap-1 truncate rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[8px] font-semibold leading-tight text-amber-700"
                  title="Permintaan tukar shift menunggu persetujuan rekan kerja"
                >
                  <Clock class="size-2.5 shrink-0" />
                  <span class="truncate">Menunggu Rekan</span>
                </div>

                <div
                  v-else-if="cell.badge === 'Menunggu Koordinator'"
                  class="inline-flex w-full items-center justify-center gap-1 truncate rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[8px] font-semibold leading-tight text-amber-700"
                  title="Permintaan tukar shift menunggu verifikasi koordinator shift"
                >
                  <ShieldCheck class="size-2.5 shrink-0" />
                  <span class="truncate">Menunggu Koordinator</span>
                </div>
              </div>

              <div v-else class="h-10" />
            </div>
          </div>

          <div class="flex flex-col items-center justify-between gap-2 border-t pt-3 text-xs sm:flex-row">
            <div class="inline-flex items-center gap-2 text-muted-foreground">
              <span class="size-2 rounded-full bg-primary" />
              <span>Roster ini telah disetujui oleh Kepala Bagian SDM Operasional.</span>
            </div>
            <span class="font-medium text-muted-foreground">
              Versi Roster: v2.4 ({{ monthShortNamesIndo[currentMonthIndex] }} {{ currentYear }})
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- SIDEBAR -->
      <div class="space-y-5 lg:col-span-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
            <div class="flex items-center gap-2">
              <Clock class="size-4 text-primary" />
              <CardTitle class="text-base">Jadwal Shift</CardTitle>
            </div>
            <span class="text-xs text-muted-foreground">4 Kategori</span>
          </CardHeader>

          <CardContent class="space-y-3">
            <div class="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <span class="size-3 shrink-0 rounded-full bg-emerald-500" />
              <div>
                <p class="text-xs font-semibold">Shift Pagi</p>
                <p class="text-xs text-muted-foreground">08:00 - 16:00 (8 Jam)</p>
              </div>
            </div>

            <div class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <span class="size-3 shrink-0 rounded-full bg-blue-500" />
              <div>
                <p class="text-xs font-semibold">Shift Siang</p>
                <p class="text-xs text-muted-foreground">16:00 - 00:00 (8 Jam)</p>
              </div>
            </div>

            <div class="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
              <span class="size-3 shrink-0 rounded-full bg-violet-500" />
              <div>
                <p class="text-xs font-semibold">Shift Malam</p>
                <p class="text-xs text-muted-foreground">00:00 - 08:00 (8 Jam)</p>
              </div>
            </div>

            <div class="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <span class="size-3 shrink-0 rounded-full bg-slate-400" />
              <div>
                <p class="text-xs font-semibold">Hari Libur (OFF)</p>
                <p class="text-xs text-muted-foreground">Istirahat Mingguan / Siklus</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 border-t pt-3 text-center">
              <div>
                <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Total Jam</span>
                <p class="mt-0.5 text-base font-semibold">{{ totalWorkHours }} Jam</p>
              </div>
              <div>
                <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Masuk Kerja</span>
                <p class="mt-0.5 text-base font-semibold text-primary">{{ workShiftsCount }} Hari</p>
              </div>
              <div>
                <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Libur</span>
                <p class="mt-0.5 text-base font-semibold">{{ offDaysCount }} Hari</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- DIALOG: SHIFT SWAP -->
    <Dialog v-model:open="isSwapModalOpen">
      <DialogContent class="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <ArrowLeftRight class="size-4 text-primary" />
            Ajukan Pertukaran Jadwal Shift (Shift Swap)
          </DialogTitle>
          <DialogDescription>
            Pilih shift Anda yang ingin ditukar, lalu tentukan rekan kerja pengganti sesuai kriteria kualifikasi.
          </DialogDescription>
        </DialogHeader>

        <!-- STEPPER -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-3">
            <div class="flex items-center gap-2.5">
              <div class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                1
              </div>
              <div>
                <p class="text-xs font-medium">Langkah 1: Shift Anda yang Ditukar</p>
                <p class="text-xs font-medium text-primary">Jadwal Pemohon Dipilih</p>
              </div>
            </div>
            <span class="flex size-5 items-center justify-center rounded-full border border-primary text-primary">
              <Check class="size-3" />
            </span>
          </div>

          <div class="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-3">
            <div class="flex items-center gap-2.5">
              <div class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                2
              </div>
              <div>
                <p class="text-xs font-medium">Langkah 2: Rekan &amp; Shift Tujuan</p>
                <p class="text-xs font-medium text-primary">Siap Dipilih</p>
              </div>
            </div>
            <span class="flex size-5 items-center justify-center rounded-full border border-primary text-primary">
              <Check class="size-3" />
            </span>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="submitSwapRequest">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- STEP 1 -->
            <div class="flex flex-col justify-between gap-3 rounded-lg border p-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-semibold uppercase tracking-wide">
                    Langkah 1 • Pilih Jadwal Anda
                  </span>
                  <Badge variant="info" class="shrink-0 text-[10px]">Jadwal Aktif</Badge>
                </div>

                <div class="space-y-1.5">
                  <Label>Pilih Hari &amp; Shift Anda</Label>
                  <Select v-model="selectedMyShiftDayModel">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="s in myActiveShifts"
                        :key="s.dayNumber"
                        :value="String(s.dayNumber)"
                      >
                        {{ s.fullLabel }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-3 rounded-lg border bg-muted/40 p-3.5">
                  <div class="flex items-center gap-3">
                    <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {{ currentUser?.avatarInitials || 'AM' }}
                    </div>
                    <div>
                      <p class="text-xs font-medium">
                        {{ currentUser?.nama || 'Asep Milo' }} ({{ currentUser?.nip || 'EMP-018' }})
                      </p>
                      <p class="text-xs font-medium text-muted-foreground">Staff Operasional</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 border-t pt-2">
                    <div>
                      <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Shift</span>
                      <span class="text-xs font-medium text-primary">
                        {{ selectedMyShiftDetail.shiftCode }} ({{ selectedMyShiftDetail.shiftTime }})
                      </span>
                    </div>
                    <div>
                      <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Status Hari</span>
                      <span class="text-xs font-medium text-emerald-600">Hari Kerja Aktif</span>
                    </div>
                  </div>

                  <div class="border-t pt-2">
                    <span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Lokasi Penugasan</span>
                    <span class="text-xs font-medium">Gedung Utama BMIS, Ruang Operasional 302</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info class="size-3.5 shrink-0" />
                <span>Hanya hari aktif (bukan hari OFF) yang dapat ditukar.</span>
              </div>
            </div>

            <!-- STEP 2 -->
            <div class="flex flex-col justify-between gap-3 rounded-lg border p-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-semibold uppercase tracking-wide">
                    Langkah 2 • Rekan &amp; Shift Tujuan
                  </span>
                  <Badge variant="secondary" class="shrink-0 text-[10px]">Kualifikasi Sama</Badge>
                </div>

                <div class="space-y-1.5">
                  <Label>Pilih Rekan Kerja Pengganti</Label>
                  <Select v-model="selectedColleagueId">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="c in qualifiedColleagues" :key="c.id" :value="c.id">
                        {{ c.fullLabel }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <Label>Alasan Pertukaran Shift</Label>
                  <Textarea
                    v-model="swapReason"
                    rows="4"
                    maxlength="250"
                    placeholder="Tuliskan alasan permohonan pertukaran shift..."
                  />
                  <div class="flex justify-end text-[10px] font-medium text-muted-foreground">
                    {{ swapReason.length }} / 250 karakter
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between border-t pt-2.5">
                <span class="text-xs font-medium text-muted-foreground">Konfirmasi Persetujuan</span>
                <span class="text-xs font-medium text-primary">Memerlukan Konfirmasi Rekan</span>
              </div>
            </div>
          </div>

          <!-- SOP -->
          <div class="space-y-2.5 rounded-lg border border-sky-200 bg-sky-50/60 p-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <ShieldCheck class="size-4 text-primary" />
                <span class="text-xs font-semibold uppercase tracking-wide">Real-time SOP Compliance Check</span>
              </div>
              <Badge variant="success">4 / 4 Kriteria Terpenuhi</Badge>
            </div>

            <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div class="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
                <CheckCircle2 class="size-3.5 shrink-0 text-emerald-600" />
                <span class="text-[11px] font-medium">Unit Sama</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
                <CheckCircle2 class="size-3.5 shrink-0 text-emerald-600" />
                <span class="text-[11px] font-medium">Kualifikasi Setara</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
                <CheckCircle2 class="size-3.5 shrink-0 text-emerald-600" />
                <span class="text-[11px] font-medium">Tanggal Valid (&gt;24 jam)</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
                <CheckCircle2 class="size-3.5 shrink-0 text-emerald-600" />
                <span class="text-[11px] font-medium">Rest Interval &gt;16 Jam</span>
              </div>
            </div>
          </div>

          <DialogFooter class="gap-3 sm:justify-between">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <Send class="size-3.5 shrink-0" />
              <span>
                Rekan <strong class="font-semibold text-foreground">{{ selectedColleagueDetail.name }}</strong>
                akan menerima notifikasi otomatis sebelum diteruskan ke koordinator.
              </span>
            </div>

            <div class="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button type="button" variant="outline" @click="isSwapModalOpen = false">
                Batal
              </Button>
              <Button type="submit">
                <ArrowLeftRight />
                Kirim Pengajuan Tukar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: MAP -->
    <Dialog v-model:open="isMapModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <MapPin class="size-4 text-primary" />
            Peta &amp; Radius Lokasi Penugasan
          </DialogTitle>
          <DialogDescription>
            Titik koordinat resmi lokasi penugasan dan radius geofence presensi.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3 text-xs">
          <div class="flex items-start gap-2.5 rounded-lg border bg-muted/40 p-3">
            <Building2 class="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <strong class="block text-xs">Gedung Utama BMIS (Menara 1 BTN)</strong>
              <span class="text-xs text-muted-foreground">Lantai 3, Ruang Operasional 302, Jakarta Pusat</span>
            </div>
          </div>

          <div class="flex h-44 flex-col items-center justify-center rounded-lg border border-sky-200 bg-sky-50/50 p-4 text-center">
            <MapPin class="mb-2 size-8 animate-bounce text-primary" />
            <p class="text-xs font-semibold">Koordinat Presensi Terverifikasi</p>
            <p class="mt-0.5 text-xs text-muted-foreground">Latitude: -6.175392 | Longitude: 106.827153</p>
            <Badge variant="success" class="mt-2">
              <CheckCircle2 class="mr-1 size-3" />
              Radius GPS Resmi 100 Meter
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button @click="isMapModalOpen = false">Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
