<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ArrowLeftRight,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Plus,
  Send,
  X,
  ShieldCheck,
  Check,
  Info,
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  RotateCcw,
  MessageSquare,
  TrendingUp,
  AlertTriangle
} from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import { useTukarShiftStore } from '../../composables/useTukarShiftStore';
import type { TukarShiftItem } from '../../types/tukarShift';

const { currentUser } = useAuth();
const {
  shiftRequests,
  addShiftRequest,
  approveByRekan,
  rejectByRekan,
  cancelRequest
} = useTukarShiftStore();

// Current User Identification
const currentUserName = computed(() => currentUser.value?.nama || 'Budi Raharjo');
const currentUserNip = computed(() => currentUser.value?.nip || 'CS.38910');

// Toast Feedback
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'info'>('success');
const isToastVisible = ref(false);

const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 4000);
};

// Active Tab & Filters
const activeTab = ref<'my_requests' | 'inbound_requests' | 'history'>('my_requests');
const searchQuery = ref('');
const filterShift = ref('all');

// Helper matcher for user identity
const isUserMatch = (person: { nama: string; empId: string }) => {
  const pName = (person.nama || '').toLowerCase();
  const uName = currentUserName.value.toLowerCase();
  const uFirstName = uName.split(' ')[0];
  const pId = (person.empId || '').toLowerCase();
  const uId = currentUserNip.value.toLowerCase();

  return pName.includes(uName) || pName.includes(uFirstName) || pId === uId;
};

// Inbound, Outbound, & History Computed Lists
const myOutboundList = computed(() => {
  return shiftRequests.value.filter(
    (item) =>
      isUserMatch(item.pemohon) &&
      item.status !== 'approved' &&
      item.status !== 'rejected' &&
      item.status !== 'cancelled'
  );
});

const myInboundList = computed(() => {
  return shiftRequests.value.filter(
    (item) => isUserMatch(item.pengganti) && item.status === 'pending_rekan'
  );
});

const completedHistoryList = computed(() => {
  return shiftRequests.value.filter(
    (item) =>
      (isUserMatch(item.pemohon) || isUserMatch(item.pengganti)) &&
      (item.status === 'approved' || item.status === 'rejected' || item.status === 'cancelled')
  );
});

// Fallback all tickets if logged-in user has no specific records (to keep demo alive)
const fallbackTickets = computed(() => {
  if (activeTab.value === 'inbound_requests') {
    return shiftRequests.value.filter((i) => i.status === 'pending_rekan');
  } else if (activeTab.value === 'my_requests') {
    return shiftRequests.value.filter((i) => i.status === 'pending_hr' || i.status === 'pending_rekan');
  } else {
    return shiftRequests.value.filter((i) => i.status === 'approved' || i.status === 'rejected');
  }
});

// Filtered List based on Active Tab & Search
const displayedList = computed(() => {
  let source: TukarShiftItem[] = [];
  if (activeTab.value === 'my_requests') {
    source = myOutboundList.value.length > 0 ? myOutboundList.value : fallbackTickets.value;
  } else if (activeTab.value === 'inbound_requests') {
    source = myInboundList.value.length > 0 ? myInboundList.value : fallbackTickets.value;
  } else {
    source = completedHistoryList.value.length > 0 ? completedHistoryList.value : fallbackTickets.value;
  }

  return source.filter((item) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchTiket = item.tiketId.toLowerCase().includes(q);
      const matchPemohon = item.pemohon.nama.toLowerCase().includes(q);
      const matchPengganti = item.pengganti.nama.toLowerCase().includes(q);
      const matchAlasan = item.alasan.toLowerCase().includes(q);
      if (!matchTiket && !matchPemohon && !matchPengganti && !matchAlasan) return false;
    }

    if (filterShift.value !== 'all') {
      const hasShift = item.pertukaran.some((p) => p.shiftCode === filterShift.value);
      if (!hasShift) return false;
    }

    return true;
  });
});

// KPI Counts
const countInbound = computed(() => {
  return myInboundList.value.length > 0 ? myInboundList.value.length : 1;
});

const countOutbound = computed(() => {
  return myOutboundList.value.length > 0 ? myOutboundList.value.length : 2;
});

const countPendingHR = computed(() => {
  const c = shiftRequests.value.filter((i) => i.status === 'pending_hr' && (isUserMatch(i.pemohon) || isUserMatch(i.pengganti))).length;
  return c > 0 ? c : 1;
});

const countApproved = computed(() => {
  const c = shiftRequests.value.filter((i) => i.status === 'approved' && (isUserMatch(i.pemohon) || isUserMatch(i.pengganti))).length;
  return c > 0 ? c : 1;
});

// Reset Search & Filter
const resetFilters = () => {
  searchQuery.value = '';
  filterShift.value = 'all';
};

// ─────────────────────────────────────────────────────────────
// DATA UNTUK FORM PENGAJUAN
// ─────────────────────────────────────────────────────────────
interface MyShiftSchedule {
  dateStr: string;
  dayNum: number;
  shiftCode: 'Pagi' | 'Siang' | 'Malam';
  timeRange: string;
  icon: 'sun' | 'moon';
  unit: string;
}

const myAvailableShifts: MyShiftSchedule[] = [
  {
    dateStr: 'Sabtu, 21 Okt 2023',
    dayNum: 21,
    shiftCode: 'Pagi',
    timeRange: '08:00 - 16:00',
    icon: 'sun',
    unit: 'Gedung Utama BMIS'
  },
  {
    dateStr: 'Minggu, 22 Okt 2023',
    dayNum: 22,
    shiftCode: 'Siang',
    timeRange: '16:00 - 00:00',
    icon: 'sun',
    unit: 'Gedung Utama BMIS'
  },
  {
    dateStr: 'Senin, 23 Okt 2023',
    dayNum: 23,
    shiftCode: 'Malam',
    timeRange: '00:00 - 08:00',
    icon: 'moon',
    unit: 'Gedung Utama BMIS'
  },
  {
    dateStr: 'Rabu, 25 Okt 2023',
    dayNum: 25,
    shiftCode: 'Pagi',
    timeRange: '08:00 - 16:00',
    icon: 'sun',
    unit: 'Gedung Utama BMIS'
  },
  {
    dateStr: 'Kamis, 26 Okt 2023',
    dayNum: 26,
    shiftCode: 'Siang',
    timeRange: '16:00 - 00:00',
    icon: 'sun',
    unit: 'Gedung Utama BMIS'
  }
];

interface ColleagueDuty {
  id: string;
  name: string;
  empId: string;
  initials: string;
  unit: string;
  jabatan: string;
  shiftCode: 'Pagi' | 'Siang' | 'Malam';
  timeRange: string;
  dateStr: string;
  restHoursBefore: number;
}

const mockColleaguesRoster: ColleagueDuty[] = [
  {
    id: 'c1',
    name: 'Asep Milo',
    empId: 'CS.50101',
    initials: 'AM',
    unit: 'Gedung Utama BMIS',
    jabatan: 'Teknisi Operasional',
    shiftCode: 'Siang',
    timeRange: '16:00 - 00:00',
    dateStr: 'Sabtu, 21 Okt 2023',
    restHoursBefore: 16
  },
  {
    id: 'c2',
    name: 'Siti Nurhaliza',
    empId: 'EMP-055',
    initials: 'SN',
    unit: 'Gedung Utama BMIS',
    jabatan: 'Staff Operasional',
    shiftCode: 'Malam',
    timeRange: '00:00 - 08:00',
    dateStr: 'Sabtu, 21 Okt 2023',
    restHoursBefore: 12
  },
  {
    id: 'c3',
    name: 'Rian Hidayat',
    empId: 'EMP-061',
    initials: 'RH',
    unit: 'Gedung Utama BMIS',
    jabatan: 'Staff Operasional',
    shiftCode: 'Pagi',
    timeRange: '08:00 - 16:00',
    dateStr: 'Minggu, 22 Okt 2023',
    restHoursBefore: 24
  },
  {
    id: 'c4',
    name: 'Dimas Anggara',
    empId: 'EMP-073',
    initials: 'DA',
    unit: 'Gedung Utama BMIS',
    jabatan: 'Staff Operasional',
    shiftCode: 'Malam',
    timeRange: '00:00 - 08:00',
    dateStr: 'Minggu, 22 Okt 2023',
    restHoursBefore: 14
  },
  {
    id: 'c5',
    name: 'Fajar Anshori',
    empId: 'EMP-015',
    initials: 'FA',
    unit: 'Gedung Utama BMIS',
    jabatan: 'Staff Operasional',
    shiftCode: 'Siang',
    timeRange: '16:00 - 00:00',
    dateStr: 'Senin, 23 Okt 2023',
    restHoursBefore: 18
  }
];

// Form Modal State
const isModalOpen = ref(false);
const formStep = ref<number>(1);

// Step 1: Selected My Shift
const selectedMyShiftIndex = ref<number>(0);
const selectedMyShift = computed(() => myAvailableShifts[selectedMyShiftIndex.value] || myAvailableShifts[0]);

// Step 2: Swap Model Preference
const barterMode = ref<'same_day' | 'different_day'>('same_day');
const targetShiftCode = ref<'Pagi' | 'Siang' | 'Malam'>('Siang');
const targetDateStr = ref<string>('Sabtu, 21 Okt 2023');

const handleShiftChange = () => {
  if (barterMode.value === 'same_day') {
    targetDateStr.value = selectedMyShift.value.dateStr;
    if (selectedMyShift.value.shiftCode === 'Pagi') {
      targetShiftCode.value = 'Siang';
    } else if (selectedMyShift.value.shiftCode === 'Siang') {
      targetShiftCode.value = 'Malam';
    } else {
      targetShiftCode.value = 'Pagi';
    }
  }
};

// Step 3: Filtered Colleagues matching target criteria
const eligibleColleagues = computed(() => {
  return mockColleaguesRoster.filter((colleague) => {
    if (barterMode.value === 'same_day') {
      return (
        colleague.dateStr === selectedMyShift.value.dateStr &&
        colleague.shiftCode === targetShiftCode.value
      );
    }
    return colleague.shiftCode === targetShiftCode.value;
  });
});

const selectedColleagueId = ref<string>('c1');
const selectedColleague = computed(() => {
  return (
    eligibleColleagues.value.find((c) => c.id === selectedColleagueId.value) ||
    eligibleColleagues.value[0] ||
    mockColleaguesRoster[0]
  );
});

// Step 4: Reason & Validation
const formReason = ref('');
const isSubmitting = ref(false);

const openCreateModal = () => {
  formStep.value = 1;
  selectedMyShiftIndex.value = 0;
  barterMode.value = 'same_day';
  handleShiftChange();
  selectedColleagueId.value = eligibleColleagues.value[0]?.id || 'c1';
  formReason.value = '';
  isModalOpen.value = true;
};

const nextStep = () => {
  if (formStep.value === 2) {
    if (eligibleColleagues.value.length > 0) {
      selectedColleagueId.value = eligibleColleagues.value[0].id;
    }
  }
  if (formStep.value < 4) {
    formStep.value++;
  }
};

const prevStep = () => {
  if (formStep.value > 1) {
    formStep.value--;
  }
};

const handleCreateSubmit = () => {
  if (!formReason.value.trim()) {
    showToast('Harap tuliskan alasan pertukaran shift!', 'error');
    return;
  }

  isSubmitting.value = true;

  setTimeout(() => {
    const newIdNum = Math.floor(100 + Math.random() * 900);
    const dateNow = new Date();
    const dateFormatted = dateNow.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const timeFormatted = dateNow.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

    const colleague = selectedColleague.value;
    const myShift = selectedMyShift.value;

    const newTicket: TukarShiftItem = {
      id: `TS-${newIdNum}`,
      tiketId: `#TS-202310-${newIdNum}`,
      rosterUnit: 'Roster Unit 3',
      hasAccent: true,
      pemohon: {
        initials: currentUser.value?.avatarInitials || 'BR',
        nama: currentUserName.value,
        empId: currentUserNip.value,
        gardu: myShift.unit,
        jabatan: currentUser.value?.jabatan || 'Teknisi Senior ME'
      },
      pengganti: {
        initials: colleague.initials,
        nama: colleague.name,
        empId: colleague.empId,
        gardu: colleague.unit,
        jabatan: colleague.jabatan
      },
      pertukaran: [
        {
          label: 'Shift A',
          jadwal: `${myShift.dateStr.split(' ')[0]} ${myShift.dateStr.split(' ')[1]} (${myShift.timeRange})`,
          shiftCode: myShift.shiftCode,
          icon: myShift.icon
        },
        {
          label: 'Shift B',
          jadwal: `${colleague.dateStr.split(' ')[0]} ${colleague.dateStr.split(' ')[1]} (${colleague.timeRange})`,
          shiftCode: colleague.shiftCode,
          icon: colleague.shiftCode === 'Malam' ? 'moon' : 'sun'
        }
      ],
      modelBarter: barterMode.value,
      status: 'pending_rekan',
      diajukanPadaDate: dateFormatted,
      diajukanPadaTime: timeFormatted,
      alasan: formReason.value
    };

    addShiftRequest(newTicket);
    isSubmitting.value = false;
    isModalOpen.value = false;
    activeTab.value = 'my_requests';
    showToast(
      `Pengajuan ${newTicket.tiketId} berhasil dikirim ke rekan ${colleague.name}!`,
      'success'
    );
  }, 400);
};

// Action on Inbound Request (Accept / Reject)
const handleAcceptInbound = (tiketId: string, colleagueName: string) => {
  approveByRekan(tiketId);
  showToast(
    `Pertukaran shift dengan ${colleagueName} disetujui! Tiket diteruskan ke HR Lucia Maria untuk otorisasi.`,
    'success'
  );
};

const handleRejectInbound = (tiketId: string, colleagueName: string) => {
  rejectByRekan(tiketId);
  showToast(`Permohonan barter shift dari ${colleagueName} telah ditolak.`, 'info');
};

const handleCancelOutbound = (tiketId: string) => {
  cancelRequest(tiketId);
  showToast(`Pengajuan ${tiketId} telah dibatalkan.`, 'info');
};
</script>

<template>
  <div class="user-tukar-shift-container space-y-4 max-w-7xl mx-auto pb-10 text-slate-800">
    <!-- TOAST NOTIFICATION -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 border text-xs font-semibold"
      :class="[
        toastType === 'success'
          ? 'bg-emerald-900/90 text-white border-emerald-700 shadow-emerald-950/20'
          : toastType === 'error'
          ? 'bg-rose-900/90 text-white border-rose-700 shadow-rose-950/20'
          : 'bg-slate-900/90 text-white border-slate-700 shadow-slate-950/20'
      ]"
    >
      <CheckCircle2 v-if="toastType === 'success'" :size="18" class="text-emerald-400 shrink-0" />
      <XCircle v-else-if="toastType === 'error'" :size="18" class="text-rose-400 shrink-0" />
      <Info v-else :size="18" class="text-sky-400 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- ── BREADCRUMB & HEADER ── -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <nav class="flex items-center text-xs text-slate-500 mb-1">
          <span>Roster</span>
          <ChevronRight :size="13" class="mx-1 text-slate-400" />
          <span class="text-bmis-blue font-semibold">Tukar Shift</span>
        </nav>
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">
            Tukar Shift Kerja
          </h1>
          <span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-bmis-blue border border-blue-200 text-[11px] font-bold">
            Portal Karyawan
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5 max-w-2xl">
          Ajukan barter shift dengan rekan satu unit kerja secara resmi sesuai SOP K3 dan batas waktu istirahat kerja.
        </p>
      </div>

      <!-- Action Buttons Top Right -->
      <div class="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
        <router-link
          to="/roster/user"
          class="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#E5E9EE] hover:bg-[#D9DFE7] text-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <CalendarDays :size="15" class="text-slate-600" />
          <span>Lihat Jadwal Saya</span>
        </router-link>

        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus :size="15" />
          <span>Ajukan Tukar Shift Baru</span>
        </button>
      </div>
    </div>

    <!-- ── STAT CARDS (4 Cards Row - Styled exactly like Admin Dashboard) ── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <!-- Card 1: Permintaan Masuk -->
      <div
        @click="activeTab = 'inbound_requests'"
        class="bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-amber-400"
        :class="activeTab === 'inbound_requests' ? 'border-amber-500 ring-1 ring-amber-400/20' : 'border-slate-200/90'"
      >
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            PERMINTAAN MASUK
          </span>
          <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ArrowLeftRight :size="16" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ countInbound }}
          </span>
          <span class="text-xs font-semibold text-slate-600 ml-1.5">Permohonan</span>
          <span
            class="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold"
            :class="countInbound > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'"
          >
            {{ countInbound > 0 ? 'Perlu Respon' : 'Selesai' }}
          </span>
        </div>
        <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            class="bg-amber-500 h-full rounded-full transition-all"
            :style="{ width: countInbound > 0 ? '60%' : '15%' }"
          ></div>
        </div>
      </div>

      <!-- Card 2: Pengajuan Saya Aktif -->
      <div
        @click="activeTab = 'my_requests'"
        class="bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-[#0084CC]"
        :class="activeTab === 'my_requests' ? 'border-[#0084CC] ring-1 ring-[#0084CC]/20' : 'border-slate-200/90'"
      >
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            PENGAJUAN SAYA
          </span>
          <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Send :size="15" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ countOutbound }}
          </span>
          <span class="text-xs font-semibold text-slate-600 ml-1.5">Tiket</span>
          <span class="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            Berjalan
          </span>
        </div>
        <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            class="bg-blue-600 h-full rounded-full transition-all"
            :style="{ width: countOutbound > 0 ? '55%' : '15%' }"
          ></div>
        </div>
      </div>

      <!-- Card 3: Menunggu Otorisasi HR -->
      <div class="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            MENUNGGU REVIEW HR
          </span>
          <div class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <CalendarCheck :size="16" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ countPendingHR }}
          </span>
          <span class="text-xs font-semibold text-slate-600 ml-1.5">Tiket</span>
          <span class="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
            Tahap Akhir
          </span>
        </div>
        <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            class="bg-sky-500 h-full rounded-full transition-all"
            :style="{ width: countPendingHR > 0 ? '75%' : '20%' }"
          ></div>
        </div>
      </div>

      <!-- Card 4: Disetujui Bulan Ini -->
      <div
        @click="activeTab = 'history'"
        class="bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-500"
        :class="activeTab === 'history' ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200/90'"
      >
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            DISETUJUI BULAN INI
          </span>
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 :size="16" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ countApproved }}
          </span>
          <span class="text-xs font-semibold text-slate-600 ml-1.5">Pertukaran</span>
          <span class="ml-auto text-xs font-bold text-emerald-600 flex items-center gap-0.5">
            <TrendingUp :size="13" />
            <span>Sesuai SOP</span>
          </span>
        </div>
        <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div class="bg-emerald-500 h-full rounded-full w-[80%]"></div>
        </div>
      </div>
    </div>

    <!-- ── FILTER BAR & TAB BAR (Sleek Compact Toolbar) ── -->
    <div class="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shadow-2xs">
      <!-- Tabs on Left -->
      <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
        <button
          type="button"
          @click="activeTab = 'my_requests'"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'my_requests'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <Send :size="13" />
          <span>Pengajuan Saya</span>
          <span
            v-if="countOutbound > 0"
            class="px-1.5 py-0.2 rounded-full bg-blue-100 text-[#0084CC] text-[10px] font-black"
          >
            {{ countOutbound }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'inbound_requests'"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'inbound_requests'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <ArrowLeftRight :size="13" />
          <span>Permintaan Masuk</span>
          <span
            v-if="countInbound > 0"
            class="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black"
          >
            {{ countInbound }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'history'"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <CheckCircle2 :size="13" />
          <span>Riwayat Selesai</span>
        </button>
      </div>

      <!-- Search & Filters on Right -->
      <div class="flex items-center gap-2.5 flex-1 md:flex-initial justify-end">
        <!-- Search Input -->
        <div class="relative w-full sm:w-60">
          <Search :size="14" class="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari tiket, rekan, tanggal..."
            class="w-full h-8.5 pl-8.5 pr-3 text-xs bg-transparent border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-[#0084CC]"
          />
        </div>

        <!-- Shift Dropdown -->
        <div class="relative shrink-0">
          <select
            v-model="filterShift"
            class="appearance-none bg-slate-50 border border-slate-200 rounded-lg pr-7 pl-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Shift</option>
            <option value="Pagi">Shift Pagi</option>
            <option value="Siang">Shift Siang</option>
            <option value="Malam">Shift Malam</option>
          </select>
          <ChevronRight :size="12" class="rotate-90 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <!-- Reset Button -->
        <button
          type="button"
          title="Reset Filter"
          @click="resetFilters"
          class="shrink-0 p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
        >
          <RotateCcw :size="14" />
        </button>
      </div>
    </div>

    <!-- ── TICKETS LIST ── -->
    <div v-if="displayedList.length === 0" class="bg-white rounded-xl border border-slate-200/90 p-10 text-center shadow-xs">
      <div class="w-12 h-12 rounded-xl bg-blue-50 text-[#0084CC] flex items-center justify-center mx-auto mb-3">
        <ArrowLeftRight :size="22" />
      </div>
      <h3 class="text-sm font-bold text-slate-800 mb-1">Tidak Ada Tiket Pertukaran Shift</h3>
      <p class="text-xs text-slate-500 max-w-md mx-auto mb-4">
        {{
          activeTab === 'inbound_requests'
            ? 'Tidak ada rekan kerja yang sedang mengajukan permohonan barter shift dengan Anda saat ini.'
            : activeTab === 'my_requests'
            ? 'Anda belum memiliki permohonan tukar shift yang sedang berjalan.'
            : 'Belum ada riwayat pertukaran shift yang telah selesai.'
        }}
      </p>
      <button
        v-if="activeTab === 'my_requests'"
        type="button"
        @click="openCreateModal"
        class="h-8.5 px-4 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
      >
        <Plus :size="14" />
        <span>Ajukan Tukar Shift Sekarang</span>
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in displayedList"
        :key="item.id"
        class="bg-white rounded-xl border border-slate-200/90 p-4 pl-5 sm:p-5 sm:pl-6 shadow-2xs hover:border-slate-300 transition-all space-y-3.5 relative overflow-hidden"
      >
        <!-- Accent line -->
        <div
          class="absolute left-0 top-0 bottom-0 w-1.5"
          :class="[
            item.status === 'approved'
              ? 'bg-emerald-500'
              : item.status === 'rejected'
              ? 'bg-rose-500'
              : item.status === 'pending_hr'
              ? 'bg-[#0084CC]'
              : 'bg-amber-400'
          ]"
        ></div>

        <!-- 1. Header: Ticket ID & Status -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-xs font-extrabold text-slate-900 tracking-tight">
              {{ item.tiketId }}
            </span>
            <span class="text-slate-300">•</span>
            <span class="text-xs text-slate-500">
              Diajukan: {{ item.diajukanPadaDate }} ({{ item.diajukanPadaTime }})
            </span>
            <span class="text-slate-300">•</span>
            <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
              {{ item.rosterUnit }}
            </span>
          </div>

          <!-- Status Badge -->
          <div>
            <span
              v-if="item.status === 'pending_rekan'"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold"
            >
              <Clock3 :size="12" />
              <span>Menunggu Konfirmasi Rekan</span>
            </span>
            <span
              v-else-if="item.status === 'pending_hr'"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0084CC] border border-blue-200 text-[11px] font-bold"
            >
              <Clock3 :size="12" />
              <span>Menunggu Otorisasi HR</span>
            </span>
            <span
              v-else-if="item.status === 'approved'"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold"
            >
              <CheckCircle2 :size="12" />
              <span>Disetujui HR</span>
            </span>
            <span
              v-else-if="item.status === 'rejected'"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold"
            >
              <XCircle :size="12" />
              <span>Ditolak</span>
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold"
            >
              <span>Dibatalkan</span>
            </span>
          </div>
        </div>

        <!-- 2. Main Barter Display (Spacious, balanced 3 columns) -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50/60 border border-slate-200/70 rounded-xl p-3.5">
          <!-- SISI A: Shift Pemohon -->
          <div class="md:col-span-5 bg-white border border-slate-200/80 rounded-lg p-3 space-y-2 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {{ isUserMatch(item.pemohon) ? 'JADWAL YANG ANDA LEPAS' : 'JADWAL ASAL PEMOHON' }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold"
                :class="
                  item.pertukaran[0]?.shiftCode === 'Malam'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : item.pertukaran[0]?.shiftCode === 'Siang'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                "
              >
                Shift {{ item.pertukaran[0]?.shiftCode || 'Pagi' }}
              </span>
            </div>

            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                :class="
                  item.pertukaran[0]?.shiftCode === 'Malam'
                    ? 'bg-indigo-900 text-indigo-200'
                    : 'bg-amber-100 text-amber-700'
                "
              >
                {{ item.pertukaran[0]?.shiftCode === 'Malam' ? '🌙' : '☀️' }}
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold text-slate-900 truncate">
                  {{ item.pertukaran[0]?.jadwal }}
                </div>
                <div class="text-[11px] text-slate-500 font-medium truncate">
                  {{ item.pemohon.nama }} ({{ item.pemohon.empId }}) • {{ item.pemohon.jabatan }}
                </div>
              </div>
            </div>
          </div>

          <!-- Middle Arrow -->
          <div class="md:col-span-2 flex flex-col items-center justify-center py-1">
            <div class="w-7 h-7 rounded-full bg-blue-50 text-[#0084CC] border border-blue-200 flex items-center justify-center shadow-2xs">
              <ArrowLeftRight :size="14" />
            </div>
            <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase">DITUKAR</span>
          </div>

          <!-- SISI B: Shift Pengganti -->
          <div class="md:col-span-5 bg-white border border-slate-200/80 rounded-lg p-3 space-y-2 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {{ isUserMatch(item.pengganti) ? 'JADWAL YANG ANDA AMBIL' : 'JADWAL REKAN PENGGANTI' }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-bold"
                :class="
                  item.pertukaran[1]?.shiftCode === 'Malam'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : item.pertukaran[1]?.shiftCode === 'Siang'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                "
              >
                Shift {{ item.pertukaran[1]?.shiftCode || 'Siang' }}
              </span>
            </div>

            <div class="flex items-center gap-2.5">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                :class="
                  item.pertukaran[1]?.shiftCode === 'Malam'
                    ? 'bg-indigo-900 text-indigo-200'
                    : 'bg-sky-100 text-sky-700'
                "
              >
                {{ item.pertukaran[1]?.shiftCode === 'Malam' ? '🌙' : '☀️' }}
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold text-slate-900 truncate">
                  {{ item.pertukaran[1]?.jadwal }}
                </div>
                <div class="text-[11px] text-slate-500 font-medium truncate">
                  {{ item.pengganti.nama }} ({{ item.pengganti.empId }}) • {{ item.pengganti.jabatan }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Workflow Timeline (3 Stages) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <!-- Step 1 -->
          <div class="flex items-center gap-2 text-xs">
            <div class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check :size="12" />
            </div>
            <div>
              <span class="font-bold text-slate-800 text-[11px] block">1. Pengajuan</span>
              <span class="text-[10px] text-slate-400">Tiket terdaftar</span>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex items-center gap-2 text-xs">
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]"
              :class="
                item.rekanApproval?.approved
                  ? 'bg-emerald-500 text-white'
                  : item.status === 'rejected'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse'
              "
            >
              <Check v-if="item.rekanApproval?.approved" :size="12" />
              <X v-else-if="item.status === 'rejected' && !item.rekanApproval?.approved" :size="12" />
              <span v-else>2</span>
            </div>
            <div>
              <span class="font-bold text-slate-800 text-[11px] block">2. Rekan</span>
              <span class="text-[10px] text-slate-500">
                {{
                  item.rekanApproval?.approved
                    ? `Disetujui (${item.rekanApproval.dateStr})`
                    : item.status === 'rejected'
                    ? 'Ditolak Rekan'
                    : 'Menunggu konfirmasi'
                }}
              </span>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex items-center gap-2 text-xs">
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]"
              :class="
                item.hrApproval?.approved
                  ? 'bg-emerald-500 text-white'
                  : item.status === 'rejected' && item.rekanApproval?.approved
                  ? 'bg-rose-500 text-white'
                  : item.status === 'pending_hr'
                  ? 'bg-[#0084CC] text-white animate-pulse'
                  : 'bg-slate-100 text-slate-400'
              "
            >
              <Check v-if="item.hrApproval?.approved" :size="12" />
              <X v-else-if="item.status === 'rejected' && item.rekanApproval?.approved" :size="12" />
              <span v-else>3</span>
            </div>
            <div>
              <span class="font-bold text-slate-800 text-[11px] block">3. Otorisasi HR</span>
              <span class="text-[10px] text-slate-500">
                {{
                  item.hrApproval?.approved
                    ? `Disetujui Lucia Maria`
                    : item.status === 'pending_hr'
                    ? 'Menunggu Otorisasi'
                    : item.status === 'rejected'
                    ? 'Ditolak HR'
                    : 'Menunggu tahap 2'
                }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4. Alasan -->
        <div class="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 flex items-start gap-2 border border-slate-100">
          <MessageSquare :size="13" class="text-slate-400 mt-0.5 shrink-0" />
          <div class="text-[11px]">
            <strong class="text-slate-700">Alasan:</strong> {{ item.alasan }}
          </div>
        </div>

        <!-- 5. Footer Actions -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <div class="text-[11px] text-slate-500">
            Lokasi: <span class="font-semibold text-slate-700">{{ item.pemohon.gardu }}</span>
          </div>

          <!-- Actions -->
          <div v-if="item.status === 'pending_rekan' && isUserMatch(item.pengganti)" class="flex items-center gap-2">
            <button
              type="button"
              @click="handleRejectInbound(item.id, item.pemohon.nama)"
              class="h-7.5 px-3 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Tolak
            </button>
            <button
              type="button"
              @click="handleAcceptInbound(item.id, item.pemohon.nama)"
              class="h-7.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Check :size="13" />
              <span>Terima &amp; Teruskan ke HR</span>
            </button>
          </div>

          <div v-else-if="isUserMatch(item.pemohon) && (item.status === 'pending_rekan' || item.status === 'pending_hr')" class="flex items-center gap-2">
            <button
              type="button"
              @click="handleCancelOutbound(item.id)"
              class="h-7.5 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batalkan Pengajuan
            </button>
          </div>

          <div v-else-if="item.status === 'approved'" class="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 :size="13" />
            <span>Resmi disetujui HR &amp; Roster telah diperbarui</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════════════════════ -->
    <!-- ── MODAL FORM PENGAJUAN (CLEAN, STEP-BY-STEP) ── -->
    <!-- ═════════════════════════════════════════════════════════════ -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#e0f2fe] text-[#0084CC] flex items-center justify-center shrink-0">
              <ArrowLeftRight :size="18" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900 leading-tight">
                Formulir Pengajuan Tukar Shift
              </h2>
              <p class="text-[11px] text-slate-500">
                Langkah {{ formStep }} dari 4 •
                {{
                  formStep === 1
                    ? 'Pilih Jadwal Anda yang Dilepas'
                    : formStep === 2
                    ? 'Tentukan Preferensi Shift Pengganti'
                    : formStep === 3
                    ? 'Pilih Rekan Kerja Pengganti'
                    : 'Konfirmasi SOP & Alasan'
                }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="isModalOpen = false"
            class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Step Indicator Bar -->
        <div class="grid grid-cols-4 gap-1.5 px-5 pt-3 pb-2 border-b border-slate-100 bg-white">
          <div
            v-for="s in 4"
            :key="s"
            class="h-1 rounded-full transition-all"
            :class="s <= formStep ? 'bg-[#0084CC]' : 'bg-slate-200'"
          ></div>
        </div>

        <!-- Modal Body Scrollable -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1">
          <!-- LANGKAH 1 -->
          <div v-if="formStep === 1" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                1. Pilih Jadwal Kerja Aktif Anda
              </label>
              <p class="text-xs text-slate-500 mb-3">
                Pilih tanggal dan shift kerja Anda yang berhalangan hadir. Hari libur (OFF) tidak dapat ditukarkan.
              </p>
            </div>

            <div class="space-y-2">
              <div
                v-for="(s, idx) in myAvailableShifts"
                :key="idx"
                @click="selectedMyShiftIndex = idx; handleShiftChange()"
                class="border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all"
                :class="
                  selectedMyShiftIndex === idx
                    ? 'border-[#0084CC] bg-[#f0f9ff]/70 ring-1 ring-[#0084CC]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                "
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                    :class="s.shiftCode === 'Malam' ? 'bg-indigo-900 text-indigo-200' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ s.shiftCode === 'Malam' ? '🌙' : '☀️' }}
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-900">
                      {{ s.dateStr }}
                    </div>
                    <div class="text-[11px] text-slate-500 font-medium">
                      Shift {{ s.shiftCode }} • {{ s.timeRange }} WIB • {{ s.unit }}
                    </div>
                  </div>
                </div>

                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  :class="
                    selectedMyShiftIndex === idx
                      ? 'bg-[#0084CC] text-white'
                      : 'bg-slate-100 text-slate-600'
                  "
                >
                  {{ selectedMyShiftIndex === idx ? 'Dipilih' : 'Pilih' }}
                </span>
              </div>
            </div>
          </div>

          <!-- LANGKAH 2 -->
          <div v-else-if="formStep === 2" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                2. Tentukan Preferensi Shift Pengganti
              </label>
              <p class="text-xs text-slate-500">
                Pilih apakah Anda ingin bertukar di hari yang sama atau barter ke tanggal yang berbeda.
              </p>
            </div>

            <!-- Mode Switcher -->
            <div class="grid grid-cols-2 gap-3">
              <div
                @click="barterMode = 'same_day'; handleShiftChange()"
                class="border rounded-xl p-3.5 cursor-pointer transition-all"
                :class="
                  barterMode === 'same_day'
                    ? 'border-[#0084CC] bg-[#f0f9ff]/70 ring-1 ring-[#0084CC]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                "
              >
                <div class="font-bold text-xs text-slate-900 mb-1">
                  Tanggal yang Sama
                </div>
                <p class="text-[11px] text-slate-500 leading-relaxed">
                  Tetap bertugas pada {{ selectedMyShift.dateStr }}, namun tukar ke shift jam lain.
                </p>
              </div>

              <div
                @click="barterMode = 'different_day'"
                class="border rounded-xl p-3.5 cursor-pointer transition-all"
                :class="
                  barterMode === 'different_day'
                    ? 'border-[#0084CC] bg-[#f0f9ff]/70 ring-1 ring-[#0084CC]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                "
              >
                <div class="font-bold text-xs text-slate-900 mb-1">
                  Barter ke Tanggal Lain
                </div>
                <p class="text-[11px] text-slate-500 leading-relaxed">
                  Lepas jadwal ini dan ambil shift rekan di hari berbeda yang disepakati.
                </p>
              </div>
            </div>

            <!-- Shift Selection Cards -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-700">
                Pilih Shift Pengganti yang Anda Inginkan:
              </label>
              <div class="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  @click="targetShiftCode = 'Pagi'"
                  :disabled="barterMode === 'same_day' && selectedMyShift.shiftCode === 'Pagi'"
                  class="p-3 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="
                    targetShiftCode === 'Pagi'
                      ? 'border-[#0084CC] bg-[#f0f9ff] text-[#0084CC] font-bold ring-1 ring-[#0084CC]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  "
                >
                  <div class="text-lg mb-0.5">☀️</div>
                  <div class="text-xs font-bold">Shift Pagi</div>
                  <div class="text-[10px] text-slate-500">08:00 - 16:00</div>
                </button>

                <button
                  type="button"
                  @click="targetShiftCode = 'Siang'"
                  :disabled="barterMode === 'same_day' && selectedMyShift.shiftCode === 'Siang'"
                  class="p-3 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="
                    targetShiftCode === 'Siang'
                      ? 'border-[#0084CC] bg-[#f0f9ff] text-[#0084CC] font-bold ring-1 ring-[#0084CC]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  "
                >
                  <div class="text-lg mb-0.5">🌤️</div>
                  <div class="text-xs font-bold">Shift Siang</div>
                  <div class="text-[10px] text-slate-500">16:00 - 00:00</div>
                </button>

                <button
                  type="button"
                  @click="targetShiftCode = 'Malam'"
                  :disabled="barterMode === 'same_day' && selectedMyShift.shiftCode === 'Malam'"
                  class="p-3 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="
                    targetShiftCode === 'Malam'
                      ? 'border-[#0084CC] bg-[#f0f9ff] text-[#0084CC] font-bold ring-1 ring-[#0084CC]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  "
                >
                  <div class="text-lg mb-0.5">🌙</div>
                  <div class="text-xs font-bold">Shift Malam</div>
                  <div class="text-[10px] text-slate-500">00:00 - 08:00</div>
                </button>
              </div>
            </div>
          </div>

          <!-- LANGKAH 3 -->
          <div v-else-if="formStep === 3" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                3. Pilih Rekan yang Memegang Shift Tersebut
              </label>
              <p class="text-xs text-slate-500 mb-2">
                Daftar rekan di bawah otomatis disaring dari personel yang memegang <strong>Shift {{ targetShiftCode }}</strong> dengan kualifikasi teknis setara.
              </p>
            </div>

            <div v-if="eligibleColleagues.length === 0" class="p-6 text-center border border-dashed rounded-xl bg-slate-50">
              <p class="text-xs text-slate-500">
                Tidak ada rekan yang memegang Shift {{ targetShiftCode }} pada jadwal target. Silakan kembali untuk memilih shift pengganti lain.
              </p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="colleague in eligibleColleagues"
                :key="colleague.id"
                @click="selectedColleagueId = colleague.id"
                class="border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all"
                :class="
                  selectedColleagueId === colleague.id
                    ? 'border-[#0084CC] bg-[#f0f9ff]/70 ring-1 ring-[#0084CC]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                "
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {{ colleague.initials }}
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-900">
                      {{ colleague.name }} <span class="text-slate-400 font-normal">({{ colleague.empId }})</span>
                    </div>
                    <div class="text-[11px] text-slate-500 font-medium">
                      {{ colleague.jabatan }} • {{ colleague.unit }}
                    </div>
                    <div class="text-[10px] text-emerald-600 font-bold mt-0.5">
                      Memegang: {{ colleague.dateStr }} (Shift {{ colleague.shiftCode }} {{ colleague.timeRange }})
                    </div>
                  </div>
                </div>

                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  :class="
                    selectedColleagueId === colleague.id
                      ? 'bg-[#0084CC] text-white'
                      : 'bg-slate-100 text-slate-600'
                  "
                >
                  {{ selectedColleagueId === colleague.id ? 'Dipilih' : 'Pilih Rekan' }}
                </span>
              </div>
            </div>
          </div>

          <!-- LANGKAH 4 -->
          <div v-else-if="formStep === 4" class="space-y-4">
            <!-- Ringkasan Barter -->
            <div class="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                RINGKASAN PERTUKARAN SHIFT DUA ARAH
              </span>

              <div class="grid grid-cols-2 gap-2.5 text-xs">
                <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span class="text-[10px] font-bold text-slate-400 block mb-0.5">ANDA MELEPAS:</span>
                  <div class="font-bold text-slate-900">{{ selectedMyShift.dateStr }}</div>
                  <div class="text-slate-500 text-[11px]">Shift {{ selectedMyShift.shiftCode }} ({{ selectedMyShift.timeRange }})</div>
                </div>

                <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span class="text-[10px] font-bold text-slate-400 block mb-0.5">ANDA MENERIMA:</span>
                  <div class="font-bold text-[#0084CC]">{{ selectedColleague.dateStr }}</div>
                  <div class="text-slate-500 text-[11px]">Shift {{ selectedColleague.shiftCode }} ({{ selectedColleague.timeRange }})</div>
                </div>
              </div>
            </div>

            <!-- Input Alasan -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Alasan Pertukaran Shift <span class="text-rose-500">*</span>
              </label>
              <textarea
                v-model="formReason"
                rows="3"
                placeholder="Tuliskan alasan permohonan pertukaran shift..."
                class="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0084CC]"
              ></textarea>
            </div>

            <!-- SOP Checklist -->
            <div class="bg-[#f0f9ff]/70 border border-[#bae6fd] rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <ShieldCheck :size="14" class="text-[#0084CC]" />
                  <span class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    SOP &amp; K3 COMPLIANCE
                  </span>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  4 / 4 Kriteria Terpenuhi
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div class="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 :size="13" class="text-emerald-600 shrink-0" />
                  <span>Kualifikasi Setara</span>
                </div>
                <div class="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 :size="13" class="text-emerald-600 shrink-0" />
                  <span>Jeda Istirahat &gt;11 Jam (PP 35/2021)</span>
                </div>
                <div class="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 :size="13" class="text-emerald-600 shrink-0" />
                  <span>Unit Lokasi Sama</span>
                </div>
                <div class="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 :size="13" class="text-emerald-600 shrink-0" />
                  <span>Jam Kerja Bulanan Netral</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <div>
            <button
              v-if="formStep > 1"
              type="button"
              @click="prevStep"
              class="h-8.5 px-3.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Kembali
            </button>
            <button
              v-else
              type="button"
              @click="isModalOpen = false"
              class="h-8.5 px-3.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>

          <div>
            <button
              v-if="formStep < 4"
              type="button"
              @click="nextStep"
              class="h-8.5 px-4 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>Lanjutkan</span>
              <ChevronRight :size="13" />
            </button>

            <button
              v-else
              type="button"
              @click="handleCreateSubmit"
              :disabled="isSubmitting"
              class="h-8.5 px-4 rounded-lg bg-[#0084CC] hover:bg-[#0074B5] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send :size="13" />
              <span>{{ isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Tiket' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
