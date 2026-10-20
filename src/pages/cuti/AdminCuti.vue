<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Check,
  X,
  Hourglass,
  Clock,
  Search,
  Filter,
  Download,
  CalendarPlus,
  RotateCcw,
  AlertCircle,
  FileText,
  Eye,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  Send,
  UploadCloud,
  ChevronDown
} from 'lucide-vue-next';

import {
  useLeaveStore,
  type LeaveRecord,
  type EmployeeQuota,
  type ApprovalStep
} from '../../composables/useLeaveStore';

type LeaveApprovalRecord = LeaveRecord;

// ── Shared Store Data & Methods ──
const {
  pendingList,
  historyList,
  quotaList,
  approveLeave,
  rejectLeave,
  addLeaveRequest
} = useLeaveStore();

// Active Tab
const activeTab = ref<'pending' | 'history' | 'quota'>('pending');

// Summary Metrics
const countApprovedMonth = computed(() => {
  return historyList.value.filter(item => item.status === 'Disetujui').length;
});
const countPending = computed(() => pendingList.value.length);
const countRejectedMonth = computed(() => {
  return historyList.value.filter(item => item.status === 'Ditolak').length;
});

// Filters State
const searchQuery = ref('');
const selectedLeaveType = ref('Semua');
const selectedDepartment = ref('Semua');

// Filtered Lists
const filteredPendingList = computed(() => {
  return pendingList.value.filter(item => {
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.empName.toLowerCase().includes(q) ||
      item.empId.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    const matchType =
      selectedLeaveType.value === 'Semua' ||
      item.leaveType.toLowerCase().includes(selectedLeaveType.value.toLowerCase());
    const matchDept =
      selectedDepartment.value === 'Semua' ||
      item.department.toLowerCase() === selectedDepartment.value.toLowerCase();
    return matchSearch && matchType && matchDept;
  });
});

const filteredHistoryList = computed(() => {
  return historyList.value.filter(item => {
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.empName.toLowerCase().includes(q) ||
      item.empId.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    const matchType =
      selectedLeaveType.value === 'Semua' ||
      item.leaveType.toLowerCase().includes(selectedLeaveType.value.toLowerCase());
    const matchDept =
      selectedDepartment.value === 'Semua' ||
      item.department.toLowerCase() === selectedDepartment.value.toLowerCase();
    return matchSearch && matchType && matchDept;
  });
});

const filteredQuotaList = computed(() => {
  return quotaList.value.filter(item => {
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.empName.toLowerCase().includes(q) ||
      item.empId.toLowerCase().includes(q);
    const matchDept =
      selectedDepartment.value === 'Semua' ||
      item.department.toLowerCase() === selectedDepartment.value.toLowerCase();
    return matchSearch && matchDept;
  });
});

// Toast notification
const toastMessage = ref('');
const isToastVisible = ref(false);
const triggerToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
};

// ── MODAL 1: KONFIRMASI SETUJU ──
const showApproveModal = ref(false);
const itemToApprove = ref<LeaveApprovalRecord | null>(null);

const openApproveModal = (item: LeaveApprovalRecord) => {
  itemToApprove.value = item;
  showApproveModal.value = true;
};

const closeApproveModal = () => {
  showApproveModal.value = false;
  itemToApprove.value = null;
};

const executeApprove = () => {
  if (!itemToApprove.value) return;
  const target = itemToApprove.value;
  approveLeave(target.id, 'Lucia Maria (HR Admin)');
  triggerToast(`Pengajuan cuti ${target.empName} (${target.id}) berhasil disetujui.`);

  // Jika modal detail juga terbuka, tutup
  if (isDetailModalOpen.value && selectedDetail.value?.id === target.id) {
    isDetailModalOpen.value = false;
  }
  closeApproveModal();
};

// ── MODAL 2: KONFIRMASI TOLAK (DENGAN ALASAN) ──
const showRejectModal = ref(false);
const itemToReject = ref<LeaveApprovalRecord | null>(null);
const rejectionNote = ref('');
const rejectionError = ref(false);

const openRejectModal = (item: LeaveApprovalRecord) => {
  itemToReject.value = item;
  rejectionNote.value = '';
  rejectionError.value = false;
  showRejectModal.value = true;
};

const closeRejectModal = () => {
  showRejectModal.value = false;
  itemToReject.value = null;
  rejectionNote.value = '';
  rejectionError.value = false;
};

const executeReject = () => {
  if (!itemToReject.value) return;
  if (!rejectionNote.value.trim()) {
    rejectionError.value = true;
    return;
  }

  const target = itemToReject.value;
  rejectLeave(target.id, rejectionNote.value.trim(), 'Lucia Maria (HR Admin)');
  triggerToast(`Pengajuan cuti ${target.empName} (${target.id}) telah ditolak.`);

  if (isDetailModalOpen.value && selectedDetail.value?.id === target.id) {
    isDetailModalOpen.value = false;
  }
  closeRejectModal();
};

// ── MODAL 3: DETAIL LENGKAP PENGAJUAN ──
const isDetailModalOpen = ref(false);
const selectedDetail = ref<LeaveApprovalRecord | null>(null);

const openDetailModal = (item: LeaveApprovalRecord) => {
  selectedDetail.value = item;
  isDetailModalOpen.value = true;
};

// ── MODAL 4: AJUKAN CUTI MANUAL (ADMIN INPUT) ──
const showManualModal = ref(false);
const manualDivisionFilter = ref('Semua Divisi');
const manualSearchQuery = ref('');
const isEmployeeDropdownOpen = ref(false);
const selectedEmployee = ref<EmployeeQuota | null>(null);

const manualForm = ref({
  leaveType: '',
  startDate: '',
  endDate: '',
  reason: ''
});

const manualErrors = ref({
  emp: '',
  leaveType: '',
  startDate: '',
  endDate: '',
  reason: ''
});

const fileInputRef = ref<HTMLInputElement | null>(null);
const manualAttachment = ref<File | null>(null);
const isDragging = ref(false);

const filteredEmployeesForManual = computed(() => {
  return quotaList.value.filter(emp => {
    const matchDept =
      manualDivisionFilter.value === 'Semua Divisi' ||
      emp.department.toLowerCase() === manualDivisionFilter.value.toLowerCase();
    const q = manualSearchQuery.value.toLowerCase().trim();
    if (selectedEmployee.value && manualSearchQuery.value === `${selectedEmployee.value.empName} (${selectedEmployee.value.empId})`) {
      return matchDept;
    }
    const matchSearch =
      !q ||
      emp.empName.toLowerCase().includes(q) ||
      emp.empId.toLowerCase().includes(q);
    return matchDept && matchSearch;
  });
});

const selectEmployee = (emp: EmployeeQuota) => {
  selectedEmployee.value = emp;
  manualSearchQuery.value = `${emp.empName} (${emp.empId})`;
  isEmployeeDropdownOpen.value = false;
  manualErrors.value.emp = '';
};

const handleSearchInput = () => {
  if (selectedEmployee.value && manualSearchQuery.value !== `${selectedEmployee.value.empName} (${selectedEmployee.value.empId})`) {
    selectedEmployee.value = null;
  }
  isEmployeeDropdownOpen.value = true;
};

const clearSelectedEmployee = () => {
  selectedEmployee.value = null;
  manualSearchQuery.value = '';
  isEmployeeDropdownOpen.value = false;
};

const handleSearchBlur = () => {
  setTimeout(() => {
    isEmployeeDropdownOpen.value = false;
  }, 200);
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    processFile(target.files[0]);
  }
};

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0]);
  }
};

const processFile = (file: File) => {
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    triggerToast('Ukuran berkas melebihi batas maksimal 5 MB.');
    return;
  }
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    triggerToast('Format berkas tidak didukung. Harap pilih berkas PDF atau JPG.');
    return;
  }
  manualAttachment.value = file;
};

const removeAttachment = () => {
  manualAttachment.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const resetManualForm = () => {
  selectedEmployee.value = null;
  manualSearchQuery.value = '';
  manualDivisionFilter.value = 'Semua Divisi';
  manualForm.value = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  };
  manualAttachment.value = null;
  manualErrors.value = {
    emp: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  };
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const closeManualModal = () => {
  showManualModal.value = false;
  resetManualForm();
};

const validateManualForm = () => {
  let isValid = true;
  manualErrors.value = {
    emp: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  };

  if (!selectedEmployee.value) {
    manualErrors.value.emp = 'Karyawan wajib dipilih';
    isValid = false;
  }

  if (!manualForm.value.leaveType) {
    manualErrors.value.leaveType = 'Pilih jenis cuti';
    isValid = false;
  }

  if (!manualForm.value.startDate) {
    manualErrors.value.startDate = 'Tanggal mulai wajib diisi';
    isValid = false;
  }

  if (!manualForm.value.endDate) {
    manualErrors.value.endDate = 'Tanggal selesai wajib diisi';
    isValid = false;
  } else if (manualForm.value.startDate && manualForm.value.endDate < manualForm.value.startDate) {
    manualErrors.value.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai';
    isValid = false;
  }

  if (!manualForm.value.reason.trim()) {
    manualErrors.value.reason = 'Alasan permohonan wajib diisi';
    isValid = false;
  }

  return isValid;
};

const submitManualLeave = () => {
  if (!validateManualForm()) {
    triggerToast('Harap lengkapi semua bidang yang ditandai bintang merah (*).');
    return;
  }

  const emp = selectedEmployee.value!;
  const newId = `CT-${new Date().getFullYear()}-M-${String(pendingList.value.length + 10).padStart(3, '0')}`;

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const startD = parseLocalDate(manualForm.value.startDate);
  const endD = parseLocalDate(manualForm.value.endDate);
  const diffDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)) + 1);

  const formatDateId = (dateStr: string) => {
    if (!dateStr) return '';
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const dateRangeStr = manualForm.value.startDate === manualForm.value.endDate
    ? formatDateId(manualForm.value.startDate)
    : `${formatDateId(manualForm.value.startDate)} - ${formatDateId(manualForm.value.endDate)}`;

  addLeaveRequest({
    id: newId,
    empId: emp.empId,
    empName: emp.empName,
    initials: emp.initials,
    avatarColor: emp.avatarColor,
    department: emp.department,
    leaveType: manualForm.value.leaveType.replace('Cuti ', ''),
    startDate: manualForm.value.startDate,
    endDate: manualForm.value.endDate,
    dateRange: dateRangeStr,
    dateRangeLabel: dateRangeStr,
    durationDays: diffDays,
    status: 'Menunggu HR',
    submitDate: 'Hari Ini',
    reason: manualForm.value.reason,
    attachmentName: manualAttachment.value ? manualAttachment.value.name : undefined,
    attachmentSize: manualAttachment.value
      ? `${(manualAttachment.value.size / 1024).toFixed(0)} KB • Dokumen Terlampir`
      : undefined,
    approvalSteps: [
      {
        level: 'Level 1 (Manual Admin)',
        role: 'HR Admin Input',
        name: 'Diajukan Manual oleh HR',
        status: 'Disetujui',
        statusText: 'Disetujui Langsung',
        timestamp: 'Hari Ini'
      },
      {
        level: 'Level 2 (HRD)',
        role: 'HR Operations',
        name: 'HR Operations',
        status: 'Menunggu',
        statusText: 'Menunggu Verifikasi Akhir',
        badge: 'Dalam Antrean Verifikasi',
        description: 'Verifikasi pengajuan cuti manual oleh tim HRD.'
      }
    ]
  });

  triggerToast(`Pengajuan cuti baru untuk ${emp.empName} berhasil dikirim.`);
  closeManualModal();
};

const handleRefresh = () => {
  triggerToast('Data permohonan dan saldo cuti diperbarui.');
};

const handleExport = () => {
  triggerToast('Mengekspor laporan persetujuan cuti ke format Excel/CSV...');
};
</script>

<template>
  <div class="admin-cuti-page space-y-4 max-w-7xl mx-auto text-slate-800">
    <!-- ── HEADER & TOP ACTION BUTTONS ── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <nav class="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <span>Cuti</span>
          <span class="text-slate-300">&gt;</span>
          <span class="text-[#0084c4] font-semibold">Manajemen Cuti</span>
        </nav>
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Cuti
          </h1>
          <span class="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
            Mode Supervisor / HR
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Kelola pengajuan cuti, persetujuan (approval), dan monitoring saldo karyawan operasional.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          @click="handleExport"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
        >
          <Download :size="14" class="text-slate-500" />
          <span>Ekspor Laporan</span>
        </button>
        <button
          type="button"
          @click="showManualModal = true"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <CalendarPlus :size="14" />
          <span>Ajukan Cuti Manual</span>
        </button>
      </div>
    </div>

    <!-- ── 3 METRIC SUMMARY CARDS ── -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <!-- Card 1: DITERIMA -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
            DITERIMA
          </span>
          <div class="w-7 h-7 rounded-lg bg-blue-50 text-[#0084c4] border border-blue-100 flex items-center justify-center shrink-0">
            <Check :size="14" class="stroke-[3]" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-1.5">
          <span class="text-3xl font-extrabold text-slate-800 tracking-tight">{{ countApprovedMonth }}</span>
          <span class="text-xs font-semibold text-slate-400">Pengajuan</span>
        </div>
        <div class="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
          <span class="text-slate-400">Bulan ini</span>
          <span class="font-bold text-emerald-600">100% diproses</span>
        </div>
      </div>

      <!-- Card 2: PENDING APPROVAL (HIGHLIGHT ORANGE) -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
            PENDING APPROVAL
          </span>
          <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Clock :size="14" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-slate-800 tracking-tight">{{ countPending }}</span>
          <span class="text-xs font-bold text-amber-600">Perlu Tindakan Segera</span>
        </div>
        <div class="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
          <span class="text-slate-400">Menunggu HR review</span>
          <span class="font-semibold text-slate-600">Operasional</span>
        </div>
      </div>

      <!-- Card 3: DITOLAK -->
      <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
            DITOLAK
          </span>
          <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <X :size="14" class="stroke-[3]" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-1.5">
          <span class="text-3xl font-extrabold text-slate-800 tracking-tight">{{ countRejectedMonth }}</span>
          <span class="text-xs font-semibold text-slate-400">Pengajuan</span>
        </div>
        <div class="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
          <span class="text-slate-400">Bulan ini</span>
          <span class="font-semibold text-slate-400">0% ditolak</span>
        </div>
      </div>
    </div>

    <!-- ── MAIN CONTENT CONTAINER WITH TABS ── -->
    <div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      <!-- Tab Bar & Refresh -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div class="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            @click="activeTab = 'pending'"
            :class="[
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'pending'
                ? 'bg-blue-50 text-[#0084c4]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            ]"
          >
            <span>Menunggu Persetujuan</span>
            <span
              :class="[
                'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                activeTab === 'pending'
                  ? 'bg-[#0084c4] text-white'
                  : 'bg-slate-200 text-slate-700'
              ]"
            >
              {{ countPending }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'history'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'history'
                ? 'bg-blue-50 text-[#0084c4]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            ]"
          >
            Riwayat Cuti
          </button>

          <button
            type="button"
            @click="activeTab = 'quota'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'quota'
                ? 'bg-blue-50 text-[#0084c4]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            ]"
          >
            Saldo Cuti Karyawan
          </button>
        </div>

        <button
          type="button"
          @click="handleRefresh"
          class="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
          title="Segarkan Data"
        >
          <RotateCcw :size="14" />
        </button>
      </div>

      <!-- Filter Controls Bar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama karyawan atau NIK..."
            class="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0084c4] focus:ring-1 focus:ring-[#0084c4]/20 transition-all bg-white"
          />
        </div>

        <!-- Filter Jenis Cuti -->
        <div v-if="activeTab !== 'quota'" class="w-full sm:w-44">
          <select
            v-model="selectedLeaveType"
            class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#0084c4] focus:ring-1 focus:ring-[#0084c4]/20 font-medium"
          >
            <option value="Semua">Semua Jenis Cuti</option>
            <option value="Sakit">Sakit</option>
            <option value="Tahunan">Tahunan</option>
            <option value="Khusus">Izin Khusus</option>
          </select>
        </div>

        <!-- Filter Departemen -->
        <div class="w-full sm:w-48">
          <select
            v-model="selectedDepartment"
            class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#0084c4] focus:ring-1 focus:ring-[#0084c4]/20 font-medium"
          >
            <option value="Semua">Semua Departemen</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Operasional Lapangan">Operasional Lapangan</option>
            <option value="Logistik & Gudang">Logistik & Gudang</option>
            <option value="Operator Alat Berat">Operator Alat Berat</option>
            <option value="Security">Security</option>
            <option value="ME">ME</option>
          </select>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
        >
          <Filter :size="13" class="text-slate-500" />
          <span>Filter</span>
        </button>
      </div>

      <!-- ── TAB 1: TABEL MENUNGGU PERSETUJUAN ── -->
      <div v-if="activeTab === 'pending'" class="space-y-3">
        <div class="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-3.5">Nama Karyawan</th>
                <th class="py-3 px-3">Jenis Cuti</th>
                <th class="py-3 px-3">Tanggal</th>
                <th class="py-3 px-3">Durasi</th>
                <th class="py-3 px-3">Tahap Persetujuan</th>
                <th class="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredPendingList"
                :key="item.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <!-- Nama Karyawan & Avatar -->
                <td class="py-3 px-3.5 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      :class="item.avatarColor"
                    >
                      {{ item.initials }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-800 text-xs">{{ item.empName }}</div>
                      <div class="text-[11px] text-slate-400 mt-0.5">
                        {{ item.empId }} • {{ item.department }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Jenis Cuti -->
                <td class="py-3 px-3 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border',
                      item.leaveType === 'Sakit'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-blue-50 text-[#0084c4] border-blue-200'
                    ]"
                  >
                    {{ item.leaveType }}
                  </span>
                </td>

                <!-- Tanggal -->
                <td class="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">
                  {{ item.dateRange }}
                </td>

                <!-- Durasi -->
                <td class="py-3 px-3 whitespace-nowrap text-slate-500">
                  {{ item.durationDays }} hari
                </td>

                <!-- Tahap Persetujuan -->
                <td class="py-3 px-3 whitespace-nowrap">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {{ item.status }}
                  </span>
                </td>

                <!-- Aksi: Detail, Setuju, Tolak -->
                <td class="py-3 px-3.5 whitespace-nowrap text-center">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      @click="openDetailModal(item)"
                      class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                    <button
                      type="button"
                      @click="openApproveModal(item)"
                      class="px-3 py-1 rounded-lg bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Setuju
                    </button>
                    <button
                      type="button"
                      @click="openRejectModal(item)"
                      class="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Tolak
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredPendingList.length === 0">
                <td colspan="6" class="py-8 text-center text-slate-400 text-xs">
                  Tidak ada permohonan cuti yang menunggu persetujuan.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer -->
        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div>
            Menampilkan {{ filteredPendingList.length > 0 ? 1 : 0 }}-{{ filteredPendingList.length }} dari {{ pendingList.length }} pengajuan cuti
          </div>
          <div class="inline-flex items-center gap-1">
            <button
              type="button"
              class="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
            >
              &lt;
            </button>
            <span class="w-6 h-6 rounded bg-[#0084c4] text-white flex items-center justify-center font-bold text-xs">
              1
            </span>
            <button
              type="button"
              class="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <!-- ── TAB 2: TABEL RIWAYAT CUTI ── -->
      <div v-else-if="activeTab === 'history'" class="space-y-3">
        <div class="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-3.5">Nama Karyawan</th>
                <th class="py-3 px-3">Jenis Cuti</th>
                <th class="py-3 px-3">Tanggal</th>
                <th class="py-3 px-3">Durasi</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3">Waktu Proses & Catatan</th>
                <th class="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredHistoryList"
                :key="item.id"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <td class="py-3 px-3.5 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      :class="item.avatarColor"
                    >
                      {{ item.initials }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-800 text-xs">{{ item.empName }}</div>
                      <div class="text-[11px] text-slate-400 mt-0.5">
                        {{ item.empId }} • {{ item.department }}
                      </div>
                    </div>
                  </div>
                </td>

                <td class="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                  {{ item.leaveType }}
                </td>

                <td class="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">
                  {{ item.dateRange }}
                </td>

                <td class="py-3 px-3 whitespace-nowrap text-slate-500">
                  {{ item.durationDays }} hari
                </td>

                <td class="py-3 px-3 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                      item.status === 'Disetujui'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    ]"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="item.status === 'Disetujui' ? 'bg-emerald-500' : 'bg-rose-500'"
                    ></span>
                    {{ item.status }}
                  </span>
                </td>

                <td class="py-3 px-3 text-slate-500">
                  <div class="text-[11px] font-medium text-slate-700">{{ item.processedDate || '-' }}</div>
                  <div v-if="item.rejectionReason" class="text-[11px] text-rose-600 italic mt-0.5">
                    Alasan: “{{ item.rejectionReason }}”
                  </div>
                  <div v-else class="text-[10px] text-slate-400">
                    Oleh: {{ item.processedBy || 'Admin' }}
                  </div>
                </td>

                <td class="py-3 px-3.5 whitespace-nowrap text-center">
                  <button
                    type="button"
                    @click="openDetailModal(item)"
                    class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Detail
                  </button>
                </td>
              </tr>

              <tr v-if="filteredHistoryList.length === 0">
                <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
                  Tidak ditemukan riwayat cuti yang sesuai.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── TAB 3: TABEL SALDO CUTI KARYAWAN ── -->
      <div v-else-if="activeTab === 'quota'" class="space-y-3">
        <div class="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-3.5">Karyawan</th>
                <th class="py-3 px-3">Departemen</th>
                <th class="py-3 px-3 text-center">Total Kuota</th>
                <th class="py-3 px-3 text-center">Cuti Terpakai</th>
                <th class="py-3 px-3 text-center">Sisa Saldo</th>
                <th class="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="q in filteredQuotaList"
                :key="q.empId"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <td class="py-3 px-3.5 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      :class="q.avatarColor"
                    >
                      {{ q.initials }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-800 text-xs">{{ q.empName }}</div>
                      <div class="text-[11px] text-slate-400 mt-0.5">{{ q.empId }}</div>
                    </div>
                  </div>
                </td>

                <td class="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                  {{ q.department }}
                </td>

                <td class="py-3 px-3 whitespace-nowrap text-center font-bold text-slate-800">
                  {{ q.totalQuota }} Hari
                </td>

                <td class="py-3 px-3 whitespace-nowrap text-center font-semibold text-amber-600">
                  {{ q.usedQuota }} Hari
                </td>

                <td class="py-3 px-3 whitespace-nowrap text-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ q.remainingQuota }} Hari Tersedia
                  </span>
                </td>

                <td class="py-3 px-3 whitespace-nowrap">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {{ q.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── POP-UP KONFIRMASI 1: SETUJUI CUTI ── -->
    <Teleport to="body">
      <div
        v-if="showApproveModal && itemToApprove"
        @click.self="closeApproveModal"
        class="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      >
        <div class="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center space-y-3.5 animate-in zoom-in-95 duration-150">
          <div class="w-12 h-12 rounded-full bg-blue-50 text-[#0084c4] border border-blue-100 flex items-center justify-center mx-auto">
            <Check :size="24" class="stroke-[3]" />
          </div>

          <div>
            <h3 class="text-base font-bold text-slate-800">Setujui Pengajuan Cuti?</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Anda akan menyetujui permohonan cuti untuk:
            </p>
            <div class="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Nama:</span>
                <span class="font-bold text-slate-800">{{ itemToApprove.empName }} ({{ itemToApprove.empId }})</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Jenis Cuti:</span>
                <span class="font-semibold text-slate-700">{{ itemToApprove.leaveType }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Durasi:</span>
                <span class="font-bold text-[#0084c4]">{{ itemToApprove.durationDays }} Hari ({{ itemToApprove.dateRange }})</span>
              </div>
            </div>
            <p class="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Saldo cuti akan dipotong dan jadwal roster karyawan otomatis disesuaikan.
            </p>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button
              type="button"
              @click="closeApproveModal"
              class="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="executeApprove"
              class="flex-1 py-2 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Ya, Setujui
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── POP-UP KONFIRMASI 2: TOLAK CUTI DENGAN ALASAN ── -->
    <Teleport to="body">
      <div
        v-if="showRejectModal && itemToReject"
        @click.self="closeRejectModal"
        class="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-3.5 animate-in zoom-in-95 duration-150">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">Tolak Permohonan Cuti?</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Karyawan: <span class="font-bold text-slate-700">{{ itemToReject.empName }}</span> ({{ itemToReject.leaveType }} • {{ itemToReject.durationDays }} hari)
              </p>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 text-xs mb-1">
              Alasan Penolakan <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="rejectionNote"
              rows="3"
              placeholder="Contoh: Kuota personel regu shift pada tanggal tersebut sudah batas minimal operasional..."
              :class="[
                rejectionError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-200 focus:border-[#0084c4] focus:ring-[#0084c4]/20'
              ]"
              class="w-full p-2.5 rounded-xl border text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-1 transition-all placeholder:text-slate-400"
            ></textarea>
            <p v-if="rejectionError" class="text-[11px] text-red-500 mt-1">
              Alasan penolakan wajib diisi agar transparan bagi karyawan.
            </p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              @click="closeRejectModal"
              class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="executeReject"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Tolak Pengajuan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── POP-UP 3: DETAIL LENGKAP PENGAJUAN (SESUAI DESAIN BMIS) ── -->
    <Teleport to="body">
      <div
        v-if="isDetailModalOpen && selectedDetail"
        @click.self="isDetailModalOpen = false"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-200 overflow-hidden">
          <!-- Header Modal -->
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 bg-white">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-[#0084c4] border border-blue-100 flex items-center justify-center shrink-0">
                <FileText :size="16" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-800 truncate">Detail Pengajuan Cuti / Izin</h3>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {{ selectedDetail.id }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 truncate">
                  Pemohon: {{ selectedDetail.empName }} ({{ selectedDetail.empId }} • {{ selectedDetail.department }})
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="isDetailModalOpen = false"
              class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
              title="Tutup"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Body Modal -->
          <div class="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
            <!-- Ringkasan Info Card -->
            <div class="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-2.5">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">JENIS PENGAJUAN</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="font-bold text-xs sm:text-sm text-slate-800">{{ selectedDetail.leaveType }}</span>
                    <span
                      v-if="selectedDetail.categoryTag"
                      class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100"
                    >
                      {{ selectedDetail.categoryTag }}
                    </span>
                  </div>
                </div>

                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TANGGAL PENGAJUAN</span>
                  <div class="flex items-center gap-1.5 mt-0.5 font-bold text-xs sm:text-sm text-slate-800">
                    <Calendar :size="13" class="text-slate-400 shrink-0" />
                    <span>{{ selectedDetail.submitDate }}</span>
                  </div>
                </div>
              </div>

              <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RENTANG TANGGAL &amp; DURASI</span>
                  <div class="flex items-center gap-1.5 mt-0.5 font-bold text-xs text-slate-800">
                    <Calendar :size="13" class="text-slate-400 shrink-0" />
                    <span>{{ selectedDetail.dateRange }}</span>
                    <span class="text-[11px] text-slate-400 font-normal">({{ selectedDetail.durationDays }} Hari Kerja)</span>
                  </div>
                </div>

                <div class="px-2.5 py-0.5 rounded-md text-[10px] font-semibold text-[#0084c4] border border-blue-200 bg-blue-50/50 shrink-0">
                  {{ selectedDetail.shiftLabel || 'Shift Pagi: 08:00 - 17:00' }}
                </div>
              </div>
            </div>

            <!-- Alasan Pengajuan -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-slate-800">Alasan Permohonan</span>
                <span class="text-[10px] text-slate-400">Keterangan Mandiri Pegawai</span>
              </div>
              <div class="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs text-slate-700 italic">
                “{{ selectedDetail.reason }}”
              </div>
            </div>

            <!-- Lampiran Berkas Medis (Jika Ada) -->
            <div v-if="selectedDetail.attachmentName">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-slate-800">Lampiran Dokumen</span>
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                  <CheckCircle2 :size="12" />
                  1 Berkas Terverifikasi
                </span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white">
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                  <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                    <FileText :size="16" />
                  </div>
                  <div class="min-w-0">
                    <span class="text-xs font-bold text-slate-800 block truncate">
                      {{ selectedDetail.attachmentName }}
                    </span>
                    <span class="text-[10px] text-slate-400 block mt-0.5">
                      {{ selectedDetail.attachmentSize || '842 KB • PDF Document' }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    @click="triggerToast(`Membuka pratinjau: ${selectedDetail.attachmentName}`)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Eye :size="12" class="text-slate-500" />
                    <span>Pratinjau</span>
                  </button>
                  <button
                    type="button"
                    @click="triggerToast(`Mengunduh berkas: ${selectedDetail.attachmentName}`)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download :size="12" class="text-slate-500" />
                    <span>Unduh</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Riwayat Persetujuan Berjenjang -->
            <div v-if="selectedDetail.approvalSteps">
              <span class="text-xs font-bold text-slate-800 block mb-1.5">Riwayat Persetujuan Berjenjang</span>
              <div class="p-3 rounded-xl border border-slate-200/90 bg-white space-y-3">
                <div
                  v-for="(step, sIdx) in selectedDetail.approvalSteps"
                  :key="sIdx"
                  class="relative pl-6"
                  :class="[sIdx < selectedDetail.approvalSteps.length - 1 ? 'pb-3' : '']"
                >
                  <div
                    v-if="sIdx < selectedDetail.approvalSteps.length - 1"
                    class="absolute left-[9px] top-5 bottom-0 w-0.5 bg-slate-200"
                  ></div>

                  <div
                    class="absolute left-0 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border"
                    :class="[
                      step.status === 'Disetujui'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                        : step.status === 'Ditolak'
                          ? 'bg-rose-50 text-rose-600 border-rose-300'
                          : 'bg-amber-50 text-amber-600 border-amber-300'
                    ]"
                  >
                    <Check v-if="step.status === 'Disetujui'" :size="11" class="stroke-[3]" />
                    <X v-else-if="step.status === 'Ditolak'" :size="11" class="stroke-[3]" />
                    <Hourglass v-else :size="10" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-800">{{ step.level }}</span>
                      <span v-if="step.timestamp" class="text-[10px] text-slate-400">{{ step.timestamp }}</span>
                      <span v-else-if="step.badge" class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {{ step.badge }}
                      </span>
                    </div>

                    <div class="text-xs text-slate-700 mt-0.5">
                      <span class="font-bold text-slate-800">{{ step.statusText }}</span>
                      <span v-if="step.name && step.status !== 'Menunggu'" class="text-slate-500 text-[11px]"> ({{ step.name }})</span>
                    </div>

                    <div v-if="step.notes" class="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                      “{{ step.notes }}”
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Modal Detail -->
          <div class="flex items-center justify-between px-5 py-3 border-t border-slate-100 shrink-0 bg-slate-50/60">
            <div class="text-[11px] text-slate-500">
              Status: <span class="font-bold text-amber-600">{{ selectedDetail.status }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="selectedDetail.status === 'Menunggu HR'"
                type="button"
                @click="openRejectModal(selectedDetail)"
                class="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Tolak
              </button>
              <button
                v-if="selectedDetail.status === 'Menunggu HR'"
                type="button"
                @click="openApproveModal(selectedDetail)"
                class="px-3.5 py-1.5 rounded-lg bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Setuju
              </button>
              <button
                type="button"
                @click="isDetailModalOpen = false"
                class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 4: FORM AJUKAN CUTI MANUAL (ADMIN) ── -->
    <Teleport to="body">
      <div
        v-if="showManualModal"
        @click.self="closeManualModal"
        class="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 my-auto text-slate-800">
          <!-- Header -->
          <div class="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Pengajuan Cuti Baru</h3>
              <p class="text-xs text-slate-500 mt-0.5">Isi rincian permohonan cuti / izin</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200/60">
                Form
              </span>
              <button
                type="button"
                @click="closeManualModal"
                class="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
                title="Tutup Form"
              >
                <X :size="18" />
              </button>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="space-y-3.5">
            <!-- Field 1: Diajukan Untuk * -->
            <div>
              <label class="block text-xs font-semibold text-slate-800 mb-1.5">
                Diajukan Untuk <span class="text-rose-500 font-bold">*</span>
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <!-- Dropdown Divisi -->
                <div class="relative">
                  <select
                    v-model="manualDivisionFilter"
                    class="w-full h-10 pl-3 pr-8 rounded-xl border text-xs text-slate-700 bg-white appearance-none focus:outline-none focus:border-[#0084c4] transition-colors cursor-pointer border-slate-200"
                  >
                    <option value="Semua Divisi">Semua Divisi</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Operasional Lapangan">Operasional Lapangan</option>
                    <option value="Logistik & Gudang">Logistik & Gudang</option>
                    <option value="Operator Alat Berat">Operator Alat Berat</option>
                    <option value="Security">Security</option>
                    <option value="ME">ME</option>
                  </select>
                  <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <!-- Input Search Karyawan -->
                <div class="relative">
                  <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    v-model="manualSearchQuery"
                    @input="handleSearchInput"
                    @focus="isEmployeeDropdownOpen = true"
                    @blur="handleSearchBlur"
                    type="text"
                    placeholder="Cari nama atau NIP"
                    class="w-full h-10 pl-9 pr-7 rounded-xl border text-xs text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:border-[#0084c4] transition-colors"
                    :class="manualErrors.emp ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'"
                  />
                  <button
                    v-if="manualSearchQuery"
                    type="button"
                    @click="clearSelectedEmployee"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X :size="13" />
                  </button>

                  <!-- Autocomplete Dropdown List -->
                  <div
                    v-if="isEmployeeDropdownOpen"
                    class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100"
                  >
                    <div
                      v-if="filteredEmployeesForManual.length === 0"
                      class="p-3 text-xs text-slate-400 text-center"
                    >
                      Tidak ada karyawan yang sesuai
                    </div>
                    <button
                      v-for="emp in filteredEmployeesForManual"
                      :key="emp.empId"
                      type="button"
                      @mousedown.prevent="selectEmployee(emp)"
                      class="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <div class="font-bold text-slate-800">{{ emp.empName }}</div>
                        <div class="text-[11px] text-slate-400">{{ emp.empId }} • {{ emp.department }}</div>
                      </div>
                      <span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Sisa: {{ emp.remainingQuota }} hari
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <p v-if="manualErrors.emp" class="text-[11px] text-rose-500 mt-1">
                {{ manualErrors.emp }}
              </p>
            </div>

            <!-- Field 2: Jenis Cuti * -->
            <div>
              <label class="block text-xs font-semibold text-slate-800 mb-1.5">
                Jenis Cuti <span class="text-rose-500 font-bold">*</span>
              </label>
              <div class="relative">
                <select
                  v-model="manualForm.leaveType"
                  @change="manualErrors.leaveType = ''"
                  class="w-full h-10 pl-3 pr-8 rounded-xl border text-xs bg-white appearance-none focus:outline-none focus:border-[#0084c4] transition-colors cursor-pointer"
                  :class="[
                    !manualForm.leaveType ? 'text-slate-400' : 'text-slate-800 font-medium',
                    manualErrors.leaveType ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'
                  ]"
                >
                  <option value="" disabled selected>Pilih Jenis Cuti...</option>
                  <option value="Cuti Tahunan">Cuti Tahunan</option>
                  <option value="Cuti Sakit">Cuti Sakit</option>
                  <option value="Izin Khusus">Izin Khusus</option>
                  <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                  <option value="Cuti Alasan Penting">Cuti Alasan Penting</option>
                </select>
                <ChevronDown :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <p v-if="manualErrors.leaveType" class="text-[11px] text-rose-500 mt-1">
                {{ manualErrors.leaveType }}
              </p>
            </div>

            <!-- Field 3: Tanggal Mulai * & Tanggal Selesai * -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-800 mb-1.5">
                  Tanggal Mulai <span class="text-rose-500 font-bold">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="manualForm.startDate"
                    @change="manualErrors.startDate = ''"
                    type="date"
                    placeholder="DD/MM/YYYY"
                    class="w-full h-10 px-3 pr-9 rounded-xl border text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0084c4] transition-colors cursor-pointer custom-date-input"
                    :class="manualErrors.startDate ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'"
                  />
                  <Calendar :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <p v-if="manualErrors.startDate" class="text-[11px] text-rose-500 mt-1">
                  {{ manualErrors.startDate }}
                </p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-800 mb-1.5">
                  Tanggal Selesai <span class="text-rose-500 font-bold">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="manualForm.endDate"
                    @change="manualErrors.endDate = ''"
                    type="date"
                    placeholder="DD/MM/YYYY"
                    class="w-full h-10 px-3 pr-9 rounded-xl border text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0084c4] transition-colors cursor-pointer custom-date-input"
                    :class="manualErrors.endDate ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'"
                  />
                  <Calendar :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <p v-if="manualErrors.endDate" class="text-[11px] text-rose-500 mt-1">
                  {{ manualErrors.endDate }}
                </p>
              </div>
            </div>

            <!-- Field 4: Alasan Permohonan * -->
            <div>
              <label class="block text-xs font-semibold text-slate-800 mb-1.5">
                Alasan Permohonan <span class="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                v-model="manualForm.reason"
                @input="manualErrors.reason = ''"
                rows="3"
                placeholder="Jelaskan keperluan cuti atau izin secara ringkas..."
                class="w-full p-3 rounded-xl border text-xs text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:border-[#0084c4] transition-colors resize-none"
                :class="manualErrors.reason ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'"
              ></textarea>
              <p v-if="manualErrors.reason" class="text-[11px] text-rose-500 mt-1">
                {{ manualErrors.reason }}
              </p>
            </div>

            <!-- Field 5: Lampiran Pendukung (Opsional) -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-semibold text-slate-800">Lampiran Pendukung</label>
                <span class="text-xs text-slate-400 font-normal">Opsional</span>
              </div>

              <!-- Dashed Upload Area -->
              <div
                @click="triggerFileInput"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
                :class="[
                  'border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all',
                  isDragging ? 'border-[#0084c4] bg-blue-50/40' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                ]"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  class="hidden"
                  @change="handleFileSelect"
                />

                <template v-if="!manualAttachment">
                  <div class="flex flex-col items-center justify-center">
                    <UploadCloud :size="30" class="text-slate-400 stroke-[1.6] mb-1.5" />
                    <p class="text-xs font-semibold text-slate-700">
                      Pilih berkas PDF atau JPG
                    </p>
                    <p class="text-[11px] text-slate-400 mt-0.5">
                      Maksimal file 5 MB
                    </p>
                  </div>
                </template>

                <template v-else>
                  <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-8 h-8 rounded-lg bg-blue-50 text-[#0084c4] flex items-center justify-center shrink-0">
                        <FileText :size="18" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-slate-800 truncate">{{ manualAttachment.name }}</p>
                        <p class="text-[11px] text-slate-400">{{ (manualAttachment.size / 1024).toFixed(1) }} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click.stop="removeAttachment"
                      class="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus berkas"
                    >
                      <X :size="16" />
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <!-- Submit Button (Full Width Blue) -->
            <div class="pt-2">
              <button
                type="button"
                @click="submitManualLeave"
                class="w-full py-3 px-4 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] active:scale-[0.99] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Send :size="15" />
                <span>Kirim Permohonan Cuti</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── TOAST NOTIFICATION ── -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 border-l-4 border-l-[#0084c4] rounded-xl px-3.5 py-2.5 shadow-xl flex items-center gap-2.5 text-xs font-bold text-slate-800 animate-in slide-in-from-bottom-2 duration-200"
    >
      <CheckCircle2 :size="16" class="text-[#0084c4] flex-shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Ensure custom calendar icon clickable across the native date picker */
.custom-date-input::-webkit-calendar-picker-indicator {
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
</style>
