<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Download,
  PlusCircle,
  Filter,
  Users,
  Clock,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2
} from 'lucide-vue-next';

import { onMounted, onUnmounted } from 'vue';
import { useAttendanceStore, getTodayDateStr } from '../../composables/useAttendanceStore';

const {
  records: allRecords,
  recordManualAttendance,
  refreshRecords,
  approveAttendanceNote,
  deleteRecord,
} = useAttendanceStore();

const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'bmis_shared_attendance_records') {
    refreshRecords();
  }
};

onMounted(() => {
  refreshRecords();
  window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
});

// Filter State (100% matching AdminPresensi.vue)
const filterDate = ref(getTodayDateStr());
const isFilterDateActive = ref(true); // Toggle to filter by date or see all
const filterDept = ref('ALL');
const deptOptions = [
  { value: 'ALL', text: 'Semua Departemen' },
  { value: 'Housekeeping', text: 'Housekeeping' },
  { value: 'Security', text: 'Security' },
  { value: 'Engineering', text: 'Engineering' },
  { value: 'Admin', text: 'Admin Unit' },
  { value: 'Kepala Unit', text: 'Kepala Unit' },
];

const filterStatus = ref('ALL');
const statusFilterOptions = [
  { value: 'ALL', text: 'Semua Status' },
  { value: 'ON_TIME', text: 'Hadir Tepat Waktu' },
  { value: 'LATE', text: 'Terlambat' },
  { value: 'LEAVE', text: 'Cuti / Izin' },
  { value: 'ABSENT', text: 'Tidak Hadir / Alpa' },
];


// Search & Pagination State
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = ref(10);

// Watchers (reset currentPage = 1 on filter change)
watch([searchQuery, filterDate, isFilterDateActive, filterDept, filterStatus], () => {
  currentPage.value = 1;
});

// Filtered & Transformed List (Exact mapping from AdminPresensi.vue lines 411-433)
const filteredRawRecords = computed(() => {
  return allRecords.value.filter((emp) => {
    const matchDate = !isFilterDateActive.value || !filterDate.value || emp.date === filterDate.value;
    const matchDept = filterDept.value === 'ALL' || emp.role_name === filterDept.value;
    const matchStatus = filterStatus.value === 'ALL' || emp.status === filterStatus.value;
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !q ||
      emp.employee_name.toLowerCase().includes(q) ||
      emp.employee_code.toLowerCase().includes(q);
    return matchDate && matchDept && matchStatus && matchSearch;
  });
});

// Summary Statistics Calculation
const summary = computed(() => {
  const baseList = allRecords.value.filter((emp) => {
    return !isFilterDateActive.value || !filterDate.value || emp.date === filterDate.value;
  });
  const total_karyawan = baseList.length;
  const hadir_tepat_waktu = baseList.filter((r) => r.status === 'ON_TIME').length;
  const terlambat = baseList.filter((r) => r.status === 'LATE').length;
  const cuti_izin = baseList.filter((r) => r.status === 'LEAVE').length;
  const tanpa_keterangan = baseList.filter((r) => r.status === 'ABSENT').length;
  const persentase_kehadiran =
    total_karyawan > 0 ? ((hadir_tepat_waktu + terlambat) / total_karyawan) * 100 : 0.0;

  return {
    total_karyawan,
    hadir_tepat_waktu,
    terlambat,
    cuti_izin,
    tanpa_keterangan,
    persentase_kehadiran,
  };
});

const attendancePercentText = computed(() => {
  return (summary.value.persentase_kehadiran || 0).toFixed(1) + '%';
});

const totalEmployees = computed(() => filteredRawRecords.value.length);
const totalPages = computed(() => Math.ceil(totalEmployees.value / perPage.value) || 1);

const filteredEmployees = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const sliced = filteredRawRecords.value.slice(start, start + perPage.value);

  return sliced.map((emp) => {
    const cin = emp.check_in || '-';
    const cout = emp.check_out || '-';
    const fallbackNote =
      emp.late_duration_minutes > 0
        ? `Keterlambatan ${emp.late_duration_minutes}m`
        : emp.status === 'LEAVE'
          ? 'Cuti Resmi'
          : emp.status === 'ABSENT'
            ? 'Tanpa Keterangan'
            : cin !== '-'
              ? 'Hadir Tepat Waktu'
              : 'Belum Absen';

    return {
      id: emp.user_id,
      name: emp.employee_name,
      code: emp.employee_code || 'EMP-' + emp.user_id,
      gedung: emp.role_name || 'Karyawan',
      kehadiran: cin !== '-' ? `${cin} - ${cout}` : 'Belum Absen',
      terlambat: emp.late_duration_minutes > 0 ? `${emp.late_duration_minutes}m` : '0m',
      tidakHadir: emp.status === 'ABSENT' ? 'Ya' : 'Tidak',
      catatan: emp.notes || fallbackNote,
      raw: emp,
    };
  });
});

// Helper Initials (Exact match with getInitials in AdminPresensi.vue)
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substr(0, 2).toUpperCase();
};

// Toast Notification
const toastMessage = ref('');
const isToastVisible = ref(false);
const showToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
};

// Modal 1: Input Absen Manual
const isManualModalOpen = ref(false);
const manualForm = ref({
  employeeId: null as string | number | null,
  date: new Date().toISOString().substr(0, 10),
  checkIn: '08:00',
  checkOut: '17:00',
  status: 'ON_TIME' as 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT',
  notes: '',
});

const employeeOptions = computed(() => [
  { value: null, text: '-- Pilih Karyawan --' },
  ...allRecords.value.map((u) => ({
    value: u.user_id,
    text: `${u.employee_name} (${u.employee_code})`,
  })),
]);

const statusOptions = [
  { value: 'ON_TIME', text: 'Tepat Waktu' },
  { value: 'LATE', text: 'Terlambat' },
  { value: 'LEAVE', text: 'Cuti / Izin' },
  { value: 'ABSENT', text: 'Tanpa Keterangan / Alpa' },
];

const openManualModal = () => {
  manualForm.value = {
    employeeId: null,
    date: new Date().toISOString().substr(0, 10),
    checkIn: '08:00',
    checkOut: '17:00',
    status: 'ON_TIME',
    notes: '',
  };
  isManualModalOpen.value = true;
};

const closeManualModal = () => {
  isManualModalOpen.value = false;
};

const submitManualAttendance = () => {
  if (!manualForm.value.employeeId) {
    showToast('Silakan pilih karyawan terlebih dahulu!');
    return;
  }

  recordManualAttendance({
    employeeId: manualForm.value.employeeId,
    date: manualForm.value.date,
    checkIn: manualForm.value.checkIn,
    checkOut: manualForm.value.checkOut,
    status: manualForm.value.status,
    notes: manualForm.value.notes,
  });

  isManualModalOpen.value = false;
  showToast('Absen manual berhasil disimpan dan disinkronkan!');
};

// Modal 2: Detail Riwayat Karyawan
const isDetailModalOpen = ref(false);
const selectedEmployee = ref<any>(null);

const formatDayDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const weekday = d.toLocaleDateString('id-ID', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('id-ID', { month: 'short' });
  const year = d.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

const viewDetail = (emp: any) => {
  selectedEmployee.value = emp;
  isDetailModalOpen.value = true;
};

const handleApproveLateNote = (emp: any) => {
  const targetId = emp.id || emp.raw?.user_id;
  approveAttendanceNote(targetId, emp.raw?.date);
  if (selectedEmployee.value && selectedEmployee.value.id === emp.id) {
    if (!selectedEmployee.value.catatan.includes('(Disetujui Admin)')) {
      selectedEmployee.value.catatan += ' (Disetujui Admin)';
    }
  }
  showToast(`Alasan kehadiran ${emp.name || emp.employee_name} berhasil disetujui.`);
};

const handleDeleteEmployeeRecord = (emp: any) => {
  const empName = emp.name || emp.employee_name;
  const targetId = emp.id || emp.raw?.user_id;
  if (confirm(`Apakah Anda yakin ingin menghapus data presensi karyawan ${empName}?`)) {
    deleteRecord(targetId);
    if (isDetailModalOpen.value && selectedEmployee.value?.id === emp.id) {
      isDetailModalOpen.value = false;
    }
    showToast(`Data presensi ${empName} berhasil dihapus.`);
  }
};

const applyFilters = () => {
  showToast('Filter diterapkan!');
};

const handleExport = () => {
  const headers = [
    'No',
    'Nama Karyawan',
    'NIP / Kode',
    'Departemen / Gedung',
    'Tanggal',
    'Jam Masuk',
    'Jam Keluar',
    'Keterlambatan (Menit)',
    'Status Presensi',
    'Catatan / Alasan'
  ];

  const rows = filteredRawRecords.value.map((emp, index) => [
    index + 1,
    `"${emp.employee_name.replace(/"/g, '""')}"`,
    `"${(emp.employee_code || '-').replace(/"/g, '""')}"`,
    `"${(emp.role_name || '-').replace(/"/g, '""')}"`,
    `"${(emp.date || '-').replace(/"/g, '""')}"`,
    `"${(emp.check_in || '-').replace(/"/g, '""')}"`,
    `"${(emp.check_out || '-').replace(/"/g, '""')}"`,
    emp.late_duration_minutes || 0,
    `"${emp.status}"`,
    `"${(emp.notes || '-').replace(/"/g, '""')}"`
  ]);

  const dateLabel = isFilterDateActive.value ? (filterDate.value || 'Hari Ini') : 'Semua Tanggal';

  const csvContent = '\uFEFF' + [
    `"LAPORAN MONITORING KEHADIRAN KARYAWAN BMIS"`,
    `"Tanggal Filter: ${dateLabel} | Departemen: ${filterDept.value} | Status: ${filterStatus.value}"`,
    `"Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}"`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeDate = filterDate.value || new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Monitoring_Kehadiran_BMIS_${safeDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Laporan monitoring kehadiran berhasil diekspor ke CSV/Excel.');
};
</script>

<template>
  <div class="admin-presensi-page space-y-6">
    <!-- Page Header & Action Buttons -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-[#1a3a5c] mb-1">Monitoring Kehadiran</h2>
        <p class="text-slate-500 text-xs mb-0">
          Gambaran umum mengenai kehadiran, ketepatan waktu, dan cuti karyawan.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="handleExport"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Download :size="14" />
          <span>Ekspor Laporan</span>
        </button>
        <button
          type="button"
          @click="openManualModal"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-[#547fff] hover:bg-[#436fe6] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <PlusCircle :size="14" />
          <span>Masuk Manual</span>
        </button>
      </div>
    </div>

    <!-- Filter Card (Widget) -->
    <div class="bg-white rounded-xl shadow-sm p-5 border-0">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-slate-500 text-[11px] font-bold uppercase">
              Tanggal Presensi
            </label>
            <button
              type="button"
              @click="isFilterDateActive = !isFilterDateActive"
              class="text-[10px] text-[#547fff] hover:underline font-semibold cursor-pointer"
            >
              {{ isFilterDateActive ? 'Lihat Semua Tanggal' : 'Filter Tanggal Ini' }}
            </button>
          </div>
          <input
            v-model="filterDate"
            type="date"
            :disabled="!isFilterDateActive"
            :class="[
              'w-full h-9 px-3 rounded-[6px] border text-xs focus:outline-none focus:border-[#547fff] transition-colors',
              isFilterDateActive
                ? 'border-[#cbd5e1] text-slate-700 bg-white'
                : 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'
            ]"
          />
        </div>

        <div>
          <label class="block text-slate-500 text-[11px] font-bold uppercase mb-1.5">
            Departemen / Role
          </label>
          <select
            v-model="filterDept"
            class="w-full h-9 px-3 rounded-[6px] border border-[#cbd5e1] text-xs text-slate-700 bg-white focus:outline-none focus:border-[#547fff]"
          >
            <option v-for="opt in deptOptions" :key="opt.value" :value="opt.value">
              {{ opt.text }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-slate-500 text-[11px] font-bold uppercase mb-1.5">
            Status Kehadiran
          </label>
          <select
            v-model="filterStatus"
            class="w-full h-9 px-3 rounded-[6px] border border-[#cbd5e1] text-xs text-slate-700 bg-white focus:outline-none focus:border-[#547fff]"
          >
            <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">
              {{ opt.text }}
            </option>
          </select>
        </div>

        <div>
          <button
            type="button"
            @click="applyFilters"
            class="w-full h-9 rounded-[6px] bg-[#547fff] hover:bg-[#436fe6] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Filter :size="13" />
            <span>Terapkan Filter</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Section (2 Cards) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-center">
        <span class="text-slate-400 text-[11px] font-bold uppercase tracking-[0.8px] block mb-2">
          RATA-RATA KEHADIRAN
        </span>
        <div class="flex items-baseline gap-3">
          <h1 class="text-[2.2rem] font-bold text-slate-800 m-0 leading-none">
            {{ attendancePercentText }}
          </h1>
          <span class="inline-flex items-center text-emerald-600 font-bold text-xs whitespace-nowrap">
            <Users :size="13" class="mr-1" />
            Total: {{ summary.total_karyawan }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-center">
        <span class="text-slate-400 text-[11px] font-bold uppercase tracking-[0.8px] block mb-2">
          TOTAL KETERLAMBATAN
        </span>
        <div class="flex items-baseline gap-3">
          <h1 class="text-[2.2rem] font-bold text-slate-800 m-0 leading-none">
            {{ summary.terlambat }}
          </h1>
          <span class="inline-flex items-center text-red-500 font-bold text-xs whitespace-nowrap">
            <Clock :size="13" class="mr-1" />
            Karyawan Terlambat
          </span>
        </div>
      </div>
    </div>

    <!-- Table Section: Detail Riwayat Karyawan -->
    <div class="bg-white rounded-xl shadow-sm p-5">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h5 class="font-bold text-slate-800 text-base m-0">Detail Riwayat</h5>
        <div class="flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Nama Karyawan..."
            class="w-[220px] h-8 pl-3.5 pr-3 rounded-full border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-[#547fff]"
          />
          <span class="text-slate-400 text-xs">
            Tampilkan 1-{{ filteredEmployees.length }} dari {{ totalEmployees }}
          </span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#f8f9fa] text-[#6c757d] text-[0.75rem] uppercase tracking-[0.5px] border-b border-[#e9ecef]">
              <th class="py-3 px-4 font-bold">NAMA KARYAWAN</th>
              <th class="py-3 px-4 font-bold">GEDUNG / DEPARTEMEN</th>
              <th class="py-3 px-4 font-bold">KEHADIRAN</th>
              <th class="py-3 px-4 font-bold">TERLAMBAT</th>
              <th class="py-3 px-4 font-bold">TIDAK HADIR</th>
              <th class="py-3 px-4 font-bold">CATATAN / ALASAN</th>
              <th class="py-3 px-4 font-bold text-center">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs">
            <tr
              v-for="(emp, idx) in filteredEmployees"
              :key="idx"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="py-3 px-4">
                <div class="flex items-center">
                  <div class="w-[38px] h-[38px] min-w-[38px] rounded-full bg-[#e2e8f0] text-slate-600 font-bold text-[0.82rem] flex items-center justify-center mr-3.5">
                    {{ getInitials(emp.name) }}
                  </div>
                  <div>
                    <strong class="block text-slate-800 font-bold">{{ emp.name }}</strong>
                    <span class="text-slate-400 text-[11px]">{{ emp.code }}</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-slate-800 font-medium">{{ emp.gedung }}</td>
              <td class="py-3 px-4 font-bold text-slate-800">{{ emp.kehadiran }}</td>
              <td class="py-3 px-4 font-bold text-red-500">{{ emp.terlambat }}</td>
              <td class="py-3 px-4 font-bold text-slate-800">{{ emp.tidakHadir }}</td>
              <td class="py-3 px-4 text-slate-700">
                <span
                  :class="[
                    'inline-block px-2.5 py-1 rounded text-xs font-semibold max-w-[200px] truncate',
                    emp.raw.status === 'LATE'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : emp.raw.status === 'LEAVE'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : emp.raw.status === 'ABSENT'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                  ]"
                  :title="emp.catatan"
                >
                  {{ emp.catatan }}
                </span>
              </td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    @click="viewDetail(emp)"
                    class="px-3 py-1 rounded-full border border-[#cbd5e1] text-[#475569] text-[0.78rem] hover:bg-[#547fff] hover:border-[#547fff] hover:text-white transition-colors cursor-pointer"
                  >
                    Detil
                  </button>
                  <button
                    type="button"
                    @click="handleDeleteEmployeeRecord(emp)"
                    class="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Hapus Record Presensi"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>Showing 1-{{ filteredEmployees.length }} of {{ totalEmployees }} entries</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            :disabled="currentPage === 1"
            @click="currentPage--"
            class="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="px-2.5 py-1 rounded bg-[#547fff] text-white font-bold text-xs">
            {{ currentPage }}
          </span>
          <button
            type="button"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            class="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal 1: Input Presensi Manual Karyawan (#modal-absen-manual) -->
    <Teleport to="body">
      <div
        v-if="isManualModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h5 class="font-bold text-slate-800 text-sm m-0">Input Presensi Manual Karyawan</h5>
            <button type="button" @click="closeManualModal" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="submitManualAttendance" class="p-5 space-y-3.5 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Pilih Karyawan</label>
              <select
                v-model="manualForm.employeeId"
                required
                class="w-full h-9 px-3 rounded-[6px] border border-[#cbd5e1] bg-white text-slate-700 focus:outline-none focus:border-[#547fff]"
              >
                <option v-for="opt in employeeOptions" :key="String(opt.value)" :value="opt.value">
                  {{ opt.text }}
                </option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Tanggal Presensi</label>
              <input
                v-model="manualForm.date"
                type="date"
                required
                class="w-full h-9 px-3 rounded-[6px] border border-[#cbd5e1] text-slate-700 focus:outline-none focus:border-[#547fff]"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Jam Masuk</label>
                <input
                  v-model="manualForm.checkIn"
                  type="time"
                  required
                  class="w-full h-9 px-3 rounded-[6px] border border-[#cbd5e1] text-slate-700 focus:outline-none focus:border-[#547fff]"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Jam Keluar</label>
                <input
                  v-model="manualForm.checkOut"
                  type="time"
                  class="w-full h-9 px-3 rounded-[6px] border border-[#cbd5e1] text-slate-700 focus:outline-none focus:border-[#547fff]"
                />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Status Presensi</label>
              <select
                v-model="manualForm.status"
                required
                class="w-full h-9 px-3 rounded-[6px] border border-[#cbd5e1] bg-white text-slate-700 focus:outline-none focus:border-[#547fff]"
              >
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.text }}
                </option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Catatan / Alasan Manual</label>
              <textarea
                v-model="manualForm.notes"
                rows="3"
                placeholder="Masukkan catatan / alasan penginputan manual oleh admin..."
                class="w-full p-2.5 rounded-[6px] border border-[#cbd5e1] text-slate-700 focus:outline-none focus:border-[#547fff]"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                @click="closeManualModal"
                class="px-3.5 py-2 rounded-[6px] border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                class="px-4 py-2 rounded-[6px] bg-[#547fff] hover:bg-[#436fe6] text-white font-bold cursor-pointer"
              >
                Simpan Presensi
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal 2: Detail Karyawan (#modal-detail-karyawan) -->
    <Teleport to="body">
      <div
        v-if="isDetailModalOpen && selectedEmployee"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white w-full max-w-xl rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h5 class="font-bold text-slate-800 text-sm m-0">
              Riwayat Kehadiran — {{ selectedEmployee.name }}
            </h5>
            <button type="button" @click="isDetailModalOpen = false" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X :size="18" />
            </button>
          </div>

          <div class="p-5 space-y-3 text-xs">
            <p class="text-slate-500 m-0">
              Departemen: <strong class="text-slate-800">{{ selectedEmployee.gedung }}</strong> | Code:
              <strong class="text-slate-800">{{ selectedEmployee.code }}</strong>
            </p>

            <div class="overflow-x-auto">
              <table class="w-full text-left border border-slate-200 border-collapse">
                <thead class="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th class="p-2.5 border border-slate-200">Tanggal</th>
                    <th class="p-2.5 border border-slate-200">Check-In</th>
                    <th class="p-2.5 border border-slate-200">Check-Out</th>
                    <th class="p-2.5 border border-slate-200">Status</th>
                    <th class="p-2.5 border border-slate-200">Catatan / Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="p-2.5 border border-slate-200 whitespace-nowrap">{{ formatDayDate(0) }} (Hari ini)</td>
                    <td class="p-2.5 border border-slate-200 font-medium">
                      {{ selectedEmployee?.raw?.check_in ? selectedEmployee.raw.check_in + ' WIB' : '08:15 WIB' }}
                    </td>
                    <td class="p-2.5 border border-slate-200 font-medium">
                      {{ selectedEmployee?.raw?.check_out ? selectedEmployee.raw.check_out + ' WIB' : '17:00 WIB' }}
                    </td>
                    <td class="p-2.5 border border-slate-200">
                      <span
                        :class="[
                          'px-2 py-0.5 rounded font-bold text-[10px]',
                          selectedEmployee?.raw?.status === 'LATE'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-600'
                        ]"
                      >
                        {{ selectedEmployee?.raw?.status === 'LATE' ? 'Terlambat' : 'Tepat Waktu' }}
                      </span>
                    </td>
                    <td class="p-2.5 border border-slate-200 text-slate-800 font-medium">
                      {{ selectedEmployee?.raw?.notes || (selectedEmployee?.raw?.status === 'LATE' ? `Keterlambatan ${selectedEmployee.raw.late_duration_minutes}m` : 'Hadir Tepat Waktu') }}
                    </td>
                  </tr>
                  <tr>
                    <td class="p-2.5 border border-slate-200 whitespace-nowrap">{{ formatDayDate(1) }} (Kemarin)</td>
                    <td class="p-2.5 border border-slate-200 font-medium">08:00 WIB</td>
                    <td class="p-2.5 border border-slate-200 font-medium">17:00 WIB</td>
                    <td class="p-2.5 border border-slate-200">
                      <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                        Tepat Waktu
                      </span>
                    </td>
                    <td class="p-2.5 border border-slate-200 text-slate-500">
                      Presensi Normal Sesuai Jadwal
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                @click="handleDeleteEmployeeRecord(selectedEmployee)"
                class="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 :size="13" />
                <span>Hapus Record</span>
              </button>

              <div class="flex items-center gap-2">
                <button
                  v-if="selectedEmployee?.raw?.status === 'LATE' && !selectedEmployee?.catatan?.includes('(Disetujui Admin)')"
                  type="button"
                  @click="handleApproveLateNote(selectedEmployee)"
                  class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Check :size="13" />
                  <span>Setujui Alasan Terlambat</span>
                </button>

                <button
                  type="button"
                  @click="isDetailModalOpen = false"
                  class="px-4 py-1.5 rounded-lg bg-[#547fff] hover:bg-[#436fe6] text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast Notification -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 border-l-4 border-l-[#547fff] rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 text-xs font-bold text-slate-800"
    >
      <CheckCircle2 :size="18" class="text-[#547fff] flex-shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
