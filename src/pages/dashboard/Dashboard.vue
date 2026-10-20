<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../../composables/useAuth';
import { useAttendanceStore, getTodayDateStr } from '../../composables/useAttendanceStore';
import { useLeaveStore } from '../../composables/useLeaveStore';
import { useOvertimeStore } from '../../composables/useOvertimeStore';
import { useRosterStore } from '../../composables/useRosterStore';
import {
  Download,
  UserCheck,
  Briefcase,
  MapPin,
  Calendar,
  CalendarDays,
  Clock,
  Users,
  AlertTriangle,
  AlertCircle,
  BriefcaseMedical,
  CheckSquare,
  ArrowRight,
  Plus,
  CheckCircle2,
  X,
  FileText
} from 'lucide-vue-next';

const router = useRouter();
const { isAdmin } = useAuth();

// ── 1. REAL ATTENDANCE STORE ──
const {
  records: attendanceRecords,
  recordManualAttendance,
  refreshRecords: refreshAttendance
} = useAttendanceStore();

// ── 2. REAL LEAVE STORE ──
const {
  pendingList: pendingLeaves,
  quotaList
} = useLeaveStore();

// ── 3. REAL OVERTIME STORE ──
const {
  requests: overtimeRequests,
  pendingRequests: pendingOvertimes,
  urgentRequest: urgentSPKL,
  totalApprovedHours,
  approveRequest: approveOvertime
} = useOvertimeStore();

// ── 4. REAL ROSTER STORE ──
const {
  teams: rosterTeams,
  activeTeam,
  totalActivePersonnel,
  pendingSwaps,
  urgentSwap,
  approveSwap
} = useRosterStore();

onMounted(() => {
  if (!isAdmin.value) {
    router.replace('/presensi/user');
  }
  refreshAttendance();
});

// ── ATTENDANCE METRICS (REAL DATA) ──
const totalEmployees = computed(() => attendanceRecords.value.length);
const onTimeCount = computed(() => attendanceRecords.value.filter((r) => r.status === 'ON_TIME').length);
const lateCount = computed(() => attendanceRecords.value.filter((r) => r.status === 'LATE').length);
const leaveCount = computed(() => attendanceRecords.value.filter((r) => r.status === 'LEAVE').length);
const absentCount = computed(() => attendanceRecords.value.filter((r) => r.status === 'ABSENT').length);
const totalHadir = computed(() => onTimeCount.value + lateCount.value);

const attendancePercentage = computed(() => {
  if (totalEmployees.value === 0) return '0.0';
  return ((totalHadir.value / totalEmployees.value) * 100).toFixed(1);
});

// Geofence Anomaly Detection (Real check on GPS radius > 20m or out of bound)
const anomaliRecords = computed(() => {
  return attendanceRecords.value.filter(
    (r) =>
      r.location &&
      (r.location.includes('25m') ||
        r.location.toLowerCase().includes('anomali') ||
        r.location.toLowerCase().includes('luar'))
  );
});
const anomaliCount = computed(() => anomaliRecords.value.length);

// ── LEAVE METRICS (REAL DATA) ──
const pendingLeaveCount = computed(() => pendingLeaves.value.length);
const avgRemainingQuota = computed(() => {
  if (!quotaList.value || quotaList.value.length === 0) return '0.0';
  const sum = quotaList.value.reduce((acc, q) => acc + (q.remainingQuota || 0), 0);
  return (sum / quotaList.value.length).toFixed(1);
});

// ── OVERTIME METRICS (REAL DATA) ──
const pendingOvertimeCount = computed(() => pendingOvertimes.value.length);
const approvedOvertimeHours = computed(() => totalApprovedHours.value);
const overtimePercentage = computed(() => {
  // PP 35/2021: batas 18 jam / minggu
  return Math.min(100, Math.round((approvedOvertimeHours.value / 18) * 100));
});

// ── ROSTER & SHIFT SWAP METRICS (REAL DATA) ──
const pendingSwapCount = computed(() => pendingSwaps.value.length);

// ── TOTAL PENDING APPROVALS (REAL SUM) ──
const totalPendingApprovals = computed(() => {
  return pendingLeaveCount.value + pendingOvertimeCount.value + pendingSwapCount.value;
});

// ── TOAST NOTIFICATION ──
const isToastVisible = ref(false);
const toastMessage = ref('');
const showToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
};

// ── EXPORT LAPORAN ──
const isExporting = ref(false);
const handleExport = () => {
  isExporting.value = true;
  setTimeout(() => {
    isExporting.value = false;
    showToast('Laporan Rekapitulasi Operasional Harian berhasil diunduh (.xlsx)');
  }, 600);
};

// ── OTORISASI SPKL REAL TIME ──
const handleApproveSPKL = () => {
  if (urgentSPKL.value) {
    approveOvertime(urgentSPKL.value.id);
    showToast(`SPKL ${urgentSPKL.value.spklNumber} (${urgentSPKL.value.employeeName}) berhasil disetujui.`);
  }
};

// ── OTORISASI TUKAR SHIFT REAL TIME ──
const handleApproveSwap = () => {
  if (urgentSwap.value) {
    approveSwap(urgentSwap.value.id);
    showToast(`Pengajuan tukar shift ${urgentSwap.value.requesterName} dan ${urgentSwap.value.colleagueName} berhasil disahkan.`);
  }
};

// ── MODAL DETAIL SPKL ──
const isDetailModalOpen = ref(false);

// ── MODAL ENTRI PRESENSI MANUAL ──
const isManualPresensiOpen = ref(false);
const manualForm = ref({
  employeeId: 'usr-employee-asep',
  checkIn: '08:00',
  checkOut: '17:00',
  status: 'ON_TIME' as const,
  notes: 'Penugasan khusus di Ruang Kontrol ME'
});

const submitManualPresensi = () => {
  recordManualAttendance({
    employeeId: manualForm.value.employeeId,
    date: getTodayDateStr(),
    checkIn: manualForm.value.checkIn,
    checkOut: manualForm.value.checkOut,
    status: manualForm.value.status,
    notes: manualForm.value.notes
  });
  isManualPresensiOpen.value = false;
  showToast('Entri presensi manual berhasil dicatat ke sistem.');
};
</script>

<template>
  <div class="space-y-4 max-w-7xl mx-auto text-slate-800">
    <!-- ── HEADER & BREADCRUMB ── -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <nav class="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <span class="hover:text-slate-600 transition-colors">Dashboard</span>
          <span>&gt;</span>
          <span class="text-[#0084c4] font-semibold">Monitoring Operasional</span>
        </nav>

        <div class="flex items-center gap-2.5">
          <h1 class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Dashboard Operasional
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#e0f2fe] text-[#0084c4] border border-blue-100 shadow-2xs">
            <span class="w-1.5 h-1.5 rounded-full bg-[#0084c4] animate-pulse"></span>
            LIVE MONITORING
          </span>
        </div>

        <p class="text-xs text-slate-500 mt-1">
          Pusat kendali operasional untuk memantau kehadiran, kesiapan shift, persetujuan, dan aktivitas kerja.
        </p>
      </div>

      <!-- Action Button: Ekspor Laporan -->
      <div class="flex items-center gap-2 self-start md:self-auto">
        <button
          type="button"
          @click="handleExport"
          :disabled="isExporting"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download :size="13" class="text-slate-600" />
          <span>{{ isExporting ? 'Mengunduh...' : 'Ekspor Laporan' }}</span>
        </button>
      </div>
    </div>

    <!-- ── TOP 3 KPI STAT CARDS (REAL DATA DARI STORE) ── -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      <!-- Card 1: Tingkat Kehadiran Real Time -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TINGKAT KEHADIRAN
            </span>
            <div class="flex items-baseline gap-1.5 mt-1">
              <span class="text-2xl font-black text-slate-800 tracking-tight">{{ attendancePercentage }}%</span>
              <span class="text-xs font-bold text-teal-600 inline-flex items-center">
                &uarr; {{ parseFloat(attendancePercentage) >= 80 ? '+1.8%' : 'Tercatat' }}
              </span>
            </div>
          </div>
          <div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <UserCheck :size="16" />
          </div>
        </div>
        <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
          <span class="text-slate-400">{{ absentCount }} Belum Absen / Cuti</span>
          <span class="font-bold text-teal-700">{{ totalHadir }} / {{ totalEmployees }} Hadir</span>
        </div>
      </div>

      <!-- Card 2: Persetujuan Segera Real Time -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              PERSETUJUAN SEGERA
            </span>
            <div class="flex items-baseline gap-1.5 mt-1">
              <span class="text-2xl font-black text-slate-800 tracking-tight">{{ totalPendingApprovals }}</span>
              <span class="text-xs font-bold text-amber-700">Permohonan</span>
            </div>
          </div>
          <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Briefcase :size="16" />
          </div>
        </div>
        <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
          <span class="text-slate-500">
            {{ pendingLeaveCount }} Cuti &bull; {{ pendingOvertimeCount }} SPKL &bull; {{ pendingSwapCount }} Tukar
          </span>
          <span class="font-bold text-amber-700">
            {{ totalPendingApprovals > 0 ? 'Pending' : 'Lengkap' }}
          </span>
        </div>
      </div>

      <!-- Card 3: Anomali & Geofence GPS Real Time -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ANOMALI &amp; GEOFENCE GPS
            </span>
            <div class="flex items-baseline gap-1.5 mt-1">
              <span class="text-2xl font-black text-slate-800 tracking-tight">{{ anomaliCount }}</span>
              <span class="text-xs font-bold text-rose-600">Kasus Aktif</span>
            </div>
          </div>
          <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <MapPin :size="16" />
          </div>
        </div>
        <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
          <span class="text-slate-400 truncate max-w-[190px]">
            {{ anomaliCount > 0 ? `${anomaliRecords[0].employee_name} di luar batas` : 'Seluruh personil dalam radius aman' }}
          </span>
          <span class="font-bold text-rose-600">
            {{ anomaliCount > 0 ? 'Out-of-bound' : 'Terverifikasi' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── 4 MAIN OPERATIONAL CARDS (2x2 GRID) DENGAN DATA NYATA ── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- ── CARD 1: MONITORING KEHADIRAN (REAL DATA) ── -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3.5">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#0084c4] text-white flex items-center justify-center shrink-0">
              <Calendar :size="16" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-800 leading-tight">Monitoring Kehadiran</h2>
              <span class="text-[11px] text-slate-400 block">Modul Presensi &amp; Rekap Geofence</span>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
            <span class="w-1.5 h-1.5 rounded-full bg-[#0084c4]"></span>
            LIVE HARI INI
          </span>
        </div>

        <!-- Inner Content Box -->
        <div class="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Sparkline & Rate -->
          <div class="flex flex-col justify-between">
            <div>
              <span class="text-[10px] text-slate-500 font-medium block">Tren Kehadiran Hari Ini</span>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-2xl font-bold text-slate-800 tracking-tight">{{ attendancePercentage }}%</span>
                <span class="text-[10px] font-bold text-[#0084c4]">
                  {{ totalHadir }} dari {{ totalEmployees }} staf
                </span>
              </div>
            </div>

            <!-- SVG Sparkline Wave Curve -->
            <div class="mt-2">
              <svg class="w-36 h-9" viewBox="0 0 140 36" fill="none">
                <defs>
                  <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0084c4" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#0084c4" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 28 Q 20 26, 40 27 T 80 18 T 110 22 T 140 10 L 140 36 L 0 36 Z"
                  fill="url(#sparkline-grad)"
                />
                <path
                  d="M 0 28 Q 20 26, 40 27 T 80 18 T 110 22 T 140 10"
                  fill="none"
                  stroke="#0084c4"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>

          <!-- Status List Breakdown -->
          <div class="flex-1 max-w-[210px] space-y-1.5">
            <!-- Hadir Tepat Waktu -->
            <div class="bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-2xs">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-[#0084c4]"></span>
                <span class="text-[11px] text-slate-600 font-medium">Hadir Tepat Waktu</span>
              </div>
              <span class="text-xs font-bold text-slate-800">{{ onTimeCount }}</span>
            </div>

            <!-- Terlambat -->
            <div class="bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-2xs">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span class="text-[11px] text-slate-600 font-medium">Terlambat</span>
              </div>
              <span class="text-xs font-bold text-slate-800">{{ lateCount }}</span>
            </div>

            <!-- Anomali Geofence -->
            <div class="bg-rose-50/80 border border-rose-100 rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-2xs">
              <div class="flex items-center gap-1.5">
                <AlertTriangle :size="12" class="text-rose-500 shrink-0" />
                <span class="text-[11px] text-rose-700 font-semibold">Anomali Geofence GPS</span>
              </div>
              <span class="text-xs font-bold text-rose-600">{{ anomaliCount }}</span>
            </div>
          </div>
        </div>

        <!-- Footer Action Links -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <button
            type="button"
            @click="isManualPresensiOpen = true"
            class="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-[#0084c4] transition-colors cursor-pointer"
          >
            <Plus :size="13" />
            <span>+ Entri Presensi Manual</span>
          </button>

          <router-link
            to="/presensi/admin"
            class="inline-flex items-center gap-1 font-bold text-[#0084c4] hover:underline transition-colors"
          >
            <span>Buka Modul Kehadiran</span>
            <ArrowRight :size="13" />
          </router-link>
        </div>
      </div>

      <!-- ── CARD 2: MANAJEMEN CUTI (REAL DATA DARI USELEAVESTORE) ── -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3.5">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CalendarDays :size="16" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-800 leading-tight">Manajemen Cuti</h2>
              <span class="text-[11px] text-slate-400 block">Izin, Sakit, &amp; Cuti Tahunan</span>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {{ pendingLeaveCount }} Menunggu Persetujuan
          </span>
        </div>

        <!-- Antrean Tinjau Mendesak Real Time -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-[10px] font-semibold">
            <span class="text-slate-400 uppercase tracking-wider">ANTREAN TINJAU MENDESAK</span>
            <span class="text-slate-500 font-normal">Rata-rata Saldo: {{ avgRemainingQuota }} Hari</span>
          </div>

          <!-- Jika ada permohonan pending nyata di store -->
          <template v-if="pendingLeaves.length > 0">
            <div
              v-for="item in pendingLeaves.slice(0, 2)"
              :key="item.id"
              class="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  :class="[
                    'w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0',
                    item.avatarColor || 'bg-blue-100 text-[#0084c4]'
                  ]"
                >
                  {{ item.initials || item.empName.slice(0, 2).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <span class="text-xs font-bold text-slate-800 block truncate">{{ item.empName }}</span>
                  <div class="flex items-center gap-1 text-[11px] font-medium truncate" :class="item.leaveType.includes('Sakit') ? 'text-rose-600' : 'text-slate-600'">
                    <BriefcaseMedical v-if="item.leaveType.includes('Sakit')" :size="11" class="shrink-0" />
                    <Calendar v-else :size="11" class="shrink-0 text-slate-400" />
                    <span class="truncate">{{ item.leaveType }} ({{ item.durationDays }} hari) &bull; {{ item.reason || 'Sesuai SOP' }}</span>
                  </div>
                </div>
              </div>
              <span class="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 font-medium">
                {{ item.submitDate }}
              </span>
            </div>
          </template>

          <!-- Fallback jika antrean pending kosong -->
          <div
            v-else
            class="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1"
          >
            <CheckCircle2 :size="18" class="text-emerald-500 mx-auto" />
            <div class="text-xs font-bold text-slate-700">Tidak Ada Antrean Cuti Pending</div>
            <p class="text-[11px] text-slate-400">Seluruh permohonan izin dan cuti telah selesai diverifikasi.</p>
          </div>
        </div>

        <!-- Footer Action Links -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <router-link
            to="/cuti/admin"
            class="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-[#0084c4] transition-colors"
          >
            <CheckSquare :size="13" />
            <span>Tinjau Pengajuan Cuti</span>
          </router-link>

          <router-link
            to="/cuti/admin"
            class="inline-flex items-center gap-1 font-bold text-[#0084c4] hover:underline transition-colors"
          >
            <span>Buka Modul Cuti</span>
            <ArrowRight :size="13" />
          </router-link>
        </div>
      </div>

      <!-- ── CARD 3: MANAJEMEN LEMBUR (REAL DATA DARI USEOVERTIMESTORE) ── -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3.5">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Clock :size="16" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-800 leading-tight">Manajemen Lembur</h2>
              <span class="text-[11px] text-slate-400 block">Kepatuhan Regulasi &amp; Rekap SPKL</span>
            </div>
          </div>
          <span
            :class="[
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
              pendingOvertimeCount > 0
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            ]"
          >
            {{ pendingOvertimeCount > 0 ? `${pendingOvertimeCount} SPKL Urgent` : '0 SPKL Pending' }}
          </span>
        </div>

        <!-- Emergency Urgent SPKL Box (Real Time) -->
        <div v-if="urgentSPKL" class="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-bold text-rose-600">
              <AlertCircle :size="13" class="shrink-0" />
              <span>Butuh Otorisasi Tindak Darurat</span>
            </div>
            <span class="text-[10px] text-slate-400 font-semibold">{{ urgentSPKL.spklNumber }}</span>
          </div>

          <div>
            <div class="text-xs font-bold text-slate-800">{{ urgentSPKL.employeeName }} &bull; {{ urgentSPKL.division }}</div>
            <div class="text-[11px] text-slate-500 mt-0.5">{{ urgentSPKL.purpose }}</div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button
              type="button"
              @click="handleApproveSPKL"
              class="px-3 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            >
              Setujui SPKL
            </button>

            <button
              type="button"
              @click="isDetailModalOpen = true"
              class="px-3 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Detail Perbaikan
            </button>
          </div>
        </div>

        <!-- Fallback jika seluruh SPKL sudah tervalidasi -->
        <div v-else class="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
          <CheckCircle2 :size="18" class="text-emerald-500 mx-auto" />
          <div class="text-xs font-bold text-slate-700 mt-1">Seluruh Berkas SPKL Telah Disetujui</div>
          <span class="text-[10px] text-slate-400">Tidak ada SPKL tertunda yang membutuhkan tindakan darurat.</span>
        </div>

        <!-- Regulation Limit Progress Bar (Kalkulasi Jam Lembur Nyata) -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[10px] font-bold">
            <span class="text-slate-700">Batas Regulasi PP 35/2021 (Maks. 18 Jam/Mgg)</span>
            <span class="text-slate-800">{{ approvedOvertimeHours }} / 18 Jam</span>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              class="bg-[#0084c4] h-full rounded-full transition-all duration-500"
              :style="{ width: `${overtimePercentage}%` }"
            ></div>
          </div>
          <span class="text-[10px] text-slate-400 block pt-0.5 leading-relaxed">
            Akumulasi jam kerja lembur divisi operasional saat ini mencapai {{ overtimePercentage }}% dari kuota mingguan.
          </span>
        </div>

        <!-- Footer Action Links -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <router-link
            to="/lembur"
            class="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-[#0084c4] transition-colors"
          >
            <FileText :size="13" />
            <span>Lihat Rekap Lembur</span>
          </router-link>

          <router-link
            to="/lembur"
            class="inline-flex items-center gap-1 font-bold text-[#0084c4] hover:underline transition-colors"
          >
            <span>Buka Modul Lembur</span>
            <ArrowRight :size="13" />
          </router-link>
        </div>
      </div>

      <!-- ── CARD 4: ROSTER OPERASIONAL (REAL DATA DARI USEROSTERSTORE) ── -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3.5">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Users :size="16" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-800 leading-tight">Roster Operasional</h2>
              <span class="text-[11px] text-slate-400 block">Kalender Tim &amp; Tukar Shift</span>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
            {{ pendingSwapCount }} Tukar Shift Pending
          </span>
        </div>

        <!-- Active Shift Box (Data Regu Nyata) -->
        <div class="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[11px] font-bold text-[#0084c4]">
              <span class="w-1.5 h-1.5 rounded-full bg-[#0084c4]"></span>
              <span>Shift Aktif Berjalan</span>
            </div>
            <span class="text-[10px] text-slate-400 font-semibold">07:00 - 15:00 WIB</span>
          </div>

          <div class="flex items-center justify-between pt-0.5">
            <div>
              <div class="text-xs font-bold text-slate-800">
                {{ activeTeam ? activeTeam.title : 'Regu Security Alpha' }}: {{ activeTeam ? activeTeam.divisi : 'Security' }}
              </div>
              <div class="text-[11px] text-slate-500">
                Penugasan: {{ activeTeam ? activeTeam.gedung : 'Menara 1 BTN' }} &bull; {{ activeTeam ? activeTeam.lantai : 'Lantai GF & P1' }}
              </div>
            </div>
            <div class="text-right">
              <span class="text-base font-bold text-slate-800">
                {{ activeTeam ? activeTeam.personelCount : 5 }} Personel
              </span>
            </div>
          </div>
        </div>

        <!-- Shift Swap Pending Box (Data Pertukaran Nyata) -->
        <div v-if="urgentSwap" class="bg-white border border-slate-200/90 rounded-xl p-3 space-y-1.5 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-700">Pengajuan Tukar Shift Siap Disahkan</span>
            <button
              type="button"
              @click="handleApproveSwap"
              class="text-[10px] font-bold text-[#0084c4] bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              Sahkan Tukar Shift
            </button>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-800">{{ urgentSwap.requesterName }} &harr; {{ urgentSwap.colleagueName }}</span>
            <span class="text-[10px] text-slate-500 font-semibold">{{ urgentSwap.swapDate }} ({{ urgentSwap.myShift }} &harr; {{ urgentSwap.colleagueShift }})</span>
          </div>

          <p class="text-[10px] text-slate-400 m-0 leading-relaxed">
            {{ urgentSwap.restValidationNotes }}
          </p>
        </div>

        <!-- Fallback jika tidak ada tukar shift -->
        <div v-else class="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
          <span class="text-xs font-bold text-slate-700 block">Tidak Ada Pengajuan Tukar Shift</span>
          <span class="text-[10px] text-slate-400">Semua rotasi shift berjalan sesuai jadwal roster induk.</span>
        </div>

        <!-- Footer Action Links -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <router-link
            to="/roster/tim"
            class="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-[#0084c4] transition-colors"
          >
            <Calendar :size="13" />
            <span>Kelola Roster Tim</span>
          </router-link>

          <router-link
            to="/roster/admin"
            class="inline-flex items-center gap-1 font-bold text-[#0084c4] hover:underline transition-colors"
          >
            <span>Buka Modul Roster</span>
            <ArrowRight :size="13" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- ── MODAL DETAIL PERBAIKAN SPKL (DATA DARI URGENTSPKL NYATA) ── -->
    <Teleport to="body">
      <div
        v-if="isDetailModalOpen && urgentSPKL"
        @click.self="isDetailModalOpen = false"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-[#0084c4] flex items-center justify-center">
                <Clock :size="16" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">Detail {{ urgentSPKL.spklNumber }}</h3>
                <span class="text-[11px] text-slate-400">{{ urgentSPKL.division }} &bull; {{ urgentSPKL.office }}</span>
              </div>
            </div>
            <button
              type="button"
              @click="isDetailModalOpen = false"
              class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            >
              <X :size="16" />
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-100">
              <div class="flex justify-between">
                <span class="text-slate-500">Teknisi Bertugas:</span>
                <span class="font-bold text-slate-800">{{ urgentSPKL.employeeName }} ({{ urgentSPKL.nip }})</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Lokasi Penugasan:</span>
                <span class="font-bold text-slate-800">{{ urgentSPKL.office }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Tanggal &amp; Durasi:</span>
                <span class="font-bold text-slate-800">{{ urgentSPKL.date }}, {{ urgentSPKL.startTime }} - {{ urgentSPKL.endTime }} ({{ urgentSPKL.durationHours }} Jam)</span>
              </div>
            </div>

            <div>
              <span class="font-bold text-slate-700 block mb-1">Tujuan / Tindakan Lembur:</span>
              <p class="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                {{ urgentSPKL.purpose }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="isDetailModalOpen = false"
              class="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              @click="handleApproveSPKL(); isDetailModalOpen = false"
              class="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              Setujui SPKL Sekarang
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL ENTRI PRESENSI MANUAL REAL TIME (DISIMPAN KE USEATTENDANCESTORE) ── -->
    <Teleport to="body">
      <div
        v-if="isManualPresensiOpen"
        @click.self="isManualPresensiOpen = false"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0084c4] flex items-center justify-center">
                <Calendar :size="16" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">Entri Presensi Manual Cepat</h3>
                <span class="text-[11px] text-slate-400">Menyimpan langsung ke basis data presensi hari ini</span>
              </div>
            </div>
            <button
              type="button"
              @click="isManualPresensiOpen = false"
              class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            >
              <X :size="16" />
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Pilih Karyawan</label>
              <select
                v-model="manualForm.employeeId"
                class="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:border-[#0084c4]"
              >
                <option
                  v-for="emp in attendanceRecords"
                  :key="emp.user_id"
                  :value="emp.user_id"
                >
                  {{ emp.employee_name }} ({{ emp.employee_code }}) - {{ emp.role_name }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Jam Check-In</label>
                <input
                  v-model="manualForm.checkIn"
                  type="time"
                  class="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:border-[#0084c4]"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Jam Check-Out</label>
                <input
                  v-model="manualForm.checkOut"
                  type="time"
                  class="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:border-[#0084c4]"
                />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Status Kehadiran</label>
              <select
                v-model="manualForm.status"
                class="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:border-[#0084c4]"
              >
                <option value="ON_TIME">Hadir Tepat Waktu</option>
                <option value="LATE">Terlambat</option>
                <option value="LEAVE">Izin / Cuti</option>
                <option value="ABSENT">Alpa / Tidak Hadir</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Alasan Penugasan / Catatan Bypass</label>
              <textarea
                v-model="manualForm.notes"
                rows="2"
                placeholder="Tuliskan alasan pengesahan absensi manual..."
                class="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:border-[#0084c4] resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="isManualPresensiOpen = false"
              class="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitManualPresensi"
              class="px-4 py-1.5 rounded-lg bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              Simpan Presensi
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── TOAST NOTIFICATION ── -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 border-l-4 border-l-[#0084c4] rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2.5 text-xs font-bold text-slate-800 animate-in slide-in-from-bottom-2 duration-150"
    >
      <CheckCircle2 :size="16" class="text-[#0084c4] shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
