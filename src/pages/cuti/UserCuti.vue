<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Clock,
  Check,
  X,
  Hourglass,
  Send,
  Search,
  Filter,
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Calendar,
  Download
} from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import {
  useLeaveStore,
  type LeaveRecord,
  type ApprovalStep
} from '../../composables/useLeaveStore';

const { currentUser } = useAuth();
const {
  getUserLeaveHistory,
  getUserQuota,
  addLeaveRequest,
  cancelLeave,
  updateLeave
} = useLeaveStore();

// Tahun aktif
const currentYear = new Date().getFullYear();
const activeYearLabel = `Tahun Aktif 2023 / 2024`;

// Dynamic leave history based on current logged in user
const leaveHistory = computed(() => {
  return getUserLeaveHistory(currentUser.value?.nama || currentUser.value?.nip || 'Asep Milo');
});

// Dynamic quotas and stats based on current user
const userQuota = computed(() => {
  return getUserQuota(currentUser.value?.nama || currentUser.value?.nip || 'Asep Milo');
});

const sisaCuti = computed(() => userQuota.value.remainingQuota);
const totalCutiTahunan = computed(() => userQuota.value.totalQuota);

const cutiDisetujuiList = computed(() => leaveHistory.value.filter(item => item.status === 'Disetujui'));
const cutiDisetujuiHari = computed(() => cutiDisetujuiList.value.reduce((acc, curr) => acc + (curr.durationDays || 0), 0));
const cutiDisetujuiCount = computed(() => cutiDisetujuiList.value.length);

const menungguPersetujuanHari = computed(() => {
  return leaveHistory.value
    .filter(item => item.status === 'Menunggu HR' || item.status === 'Menunggu Approval' || item.status === 'Menunggu' || item.status === 'Menunggu Surat Dokter')
    .reduce((acc, curr) => acc + (curr.durationDays || 0), 0);
});

const ditolakHari = computed(() => {
  return leaveHistory.value
    .filter(item => item.status === 'Ditolak')
    .reduce((acc, curr) => acc + (curr.durationDays || 0), 0);
});

// Jenis Cuti Options
const leaveTypes = [
  'Cuti Tahunan',
  'Cuti Sakit',
  'Izin Kerja Khusus',
  'Cuti Alasan Penting',
  'Cuti Melahirkan / Bersalin'
];

// Form Pengajuan
const form = ref({
  leaveType: '',
  startDate: '',
  endDate: '',
  reason: '',
  fileName: '',
  fileSize: ''
});

const isSubmitted = ref(false);

const fileInputRef = ref<HTMLInputElement | null>(null);

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    form.value.fileName = file.name;
    form.value.fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  }
};

const removeFile = () => {
  form.value.fileName = '';
  form.value.fileSize = '';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// Hitung estimasi hari jika tanggal dipilih
const estimatedDays = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0;
  const start = new Date(form.value.startDate);
  const end = new Date(form.value.endDate);
  if (end < start) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
});

// ── Search & Filter ──
const searchQuery = ref('');
const selectedStatusFilter = ref('Semua');

const filteredHistory = computed(() => {
  return leaveHistory.value.filter((item) => {
    const rangeText = item.dateRangeLabel || item.dateRange || '';
    const matchesSearch =
      item.leaveType.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.submitDate.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      rangeText.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatusFilter.value === 'Semua' ||
      item.status === selectedStatusFilter.value ||
      (selectedStatusFilter.value === 'Menunggu' && item.status.includes('Menunggu'));

    return matchesSearch && matchesStatus;
  });
});

// ── Pagination State (Standar Biru BMIS) ──
const currentPage = ref(1);
const itemsPerPage = ref(5);

const totalPages = computed(() => {
  return Math.ceil(filteredHistory.value.length / itemsPerPage.value) || 1;
});

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredHistory.value.slice(start, start + itemsPerPage.value);
});

watch([selectedStatusFilter, searchQuery], () => {
  currentPage.value = 1;
});

// Toast
const toastMessage = ref('');
const isToastVisible = ref(false);
const triggerToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 4000);
};

// Modal Detail & Kelola Pengajuan
const selectedDetail = ref<LeaveRecord | null>(null);
const isDetailModalOpen = ref(false);

// State upload susulan surat dokter di dalam modal
const modalUploadFile = ref<File | null>(null);
const modalUploadFileName = ref('');
const modalFileInputRef = ref<HTMLInputElement | null>(null);

const handleModalFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    modalUploadFile.value = file;
    modalUploadFileName.value = file.name;
  }
};

const removeModalUpload = () => {
  modalUploadFile.value = null;
  modalUploadFileName.value = '';
  if (modalFileInputRef.value) modalFileInputRef.value.value = '';
};

const openDetailModal = (record: LeaveRecord) => {
  selectedDetail.value = record;
  modalUploadFile.value = null;
  modalUploadFileName.value = '';
  isDetailModalOpen.value = true;
};

// Simpan surat dokter susulan
const saveDoctorNoteToRecord = () => {
  if (!modalUploadFileName.value || !selectedDetail.value) return;

  const targetId = selectedDetail.value.id;
  updateLeave(targetId, {
    attachmentName: modalUploadFileName.value,
    status: 'Menunggu HR',
    statusLabel: 'MENUNGGU HRD'
  });

  selectedDetail.value.attachmentName = modalUploadFileName.value;
  selectedDetail.value.status = 'Menunggu HR';

  modalUploadFile.value = null;
  modalUploadFileName.value = '';
  triggerToast('Surat dokter berhasil diunggah. Pengajuan kini diteruskan ke atasan untuk disetujui.');
};

// Mode Edit Pengajuan
const isEditing = ref(false);
const editingRecordId = ref<string | null>(null);

const openEditFromDetail = (record: LeaveRecord) => {
  isDetailModalOpen.value = false;
  isEditing.value = true;
  editingRecordId.value = record.id;
  form.value.leaveType = record.leaveType.includes('Sakit') ? 'Cuti Sakit' : record.leaveType;
  form.value.reason = record.reason;
  form.value.fileName = record.attachmentName || '';
  form.value.fileSize = record.attachmentSize || '';
  triggerToast(`Mode edit aktif untuk pengajuan ${record.id}. Silakan perbarui form di sebelah kiri.`);
};

const cancelEdit = () => {
  isEditing.value = false;
  editingRecordId.value = null;
  isSubmitted.value = false;
  form.value = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    fileName: '',
    fileSize: ''
  };
  if (fileInputRef.value) fileInputRef.value.value = '';
};

const previewAttachment = (fileName?: string) => {
  triggerToast(`Pratinjau berkas: ${fileName || 'Surat_Keterangan_Dokter.pdf'}`);
};

const downloadAttachment = (fileName?: string) => {
  triggerToast(`Mengunduh berkas: ${fileName || 'Surat_Keterangan_Dokter.pdf'}`);
};

// Batalkan / Hapus Pengajuan Cuti dengan Konfirmasi
const showCancelConfirmModal = ref(false);
const itemToCancel = ref<LeaveRecord | null>(null);

const requestCancelLeave = (record: LeaveRecord) => {
  itemToCancel.value = record;
  showCancelConfirmModal.value = true;
};

const dismissCancelConfirm = () => {
  showCancelConfirmModal.value = false;
  itemToCancel.value = null;
};

const confirmCancelLeave = () => {
  if (!itemToCancel.value) return;
  const targetId = itemToCancel.value.id;
  const leaveName = itemToCancel.value.leaveType;
  cancelLeave(targetId);
  triggerToast(`Pengajuan ${targetId} (${leaveName}) berhasil dibatalkan.`);
  showCancelConfirmModal.value = false;
  itemToCancel.value = null;
  isDetailModalOpen.value = false;
};

// Format Tanggal Indonesia
const formatDateLabel = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Submit Pengajuan
const submitLeave = () => {
  isSubmitted.value = true;

  if (!form.value.leaveType || !form.value.startDate || !form.value.endDate || !form.value.reason.trim()) {
    triggerToast('Formulir belum lengkap. Silakan isi semua sebelum mengajukan cuti.');
    return;
  }
  if (new Date(form.value.endDate) < new Date(form.value.startDate)) {
    triggerToast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai!');
    return;
  }

  const days = estimatedDays.value;
  const startLbl = formatDateLabel(form.value.startDate);
  const endLbl = formatDateLabel(form.value.endDate);
  const rangeLbl = startLbl === endLbl ? startLbl : `${startLbl} - ${endLbl}`;

  if (isEditing.value && editingRecordId.value) {
    updateLeave(editingRecordId.value, {
      leaveType: form.value.leaveType,
      reason: form.value.reason,
      attachmentName: form.value.fileName || undefined,
      attachmentSize: form.value.fileSize || undefined,
      durationDays: days,
      dateRange: rangeLbl,
      dateRangeLabel: rangeLbl,
      status: 'Menunggu HR',
      statusLabel: 'MENUNGGU HRD'
    });
    triggerToast(`Pengajuan ${editingRecordId.value} berhasil diperbarui.`);
    cancelEdit();
    return;
  }

  // Logika Khusus Cuti Sakit:
  let initialStatus: 'Disetujui' | 'Ditolak' | 'Menunggu HR' | 'Menunggu Surat Dokter' = 'Menunggu HR';
  if (form.value.leaveType === 'Cuti Sakit' && !form.value.fileName) {
    initialStatus = 'Menunggu Surat Dokter';
  }

  const newRecord = addLeaveRequest({
    empId: currentUser.value?.nip || 'EMP-031',
    empName: currentUser.value?.nama || 'Asep Milo',
    initials: currentUser.value?.avatarInitials || 'AM',
    avatarColor: 'bg-blue-100 text-[#0084c4]',
    department: currentUser.value?.divisi || 'Housekeeping',
    leaveType: form.value.leaveType,
    categoryTag: form.value.leaveType.includes('Sakit') ? 'Medis' : (form.value.leaveType.includes('Tahunan') ? 'Tahunan' : 'Izin Khusus'),
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    dateRange: rangeLbl,
    dateRangeLabel: rangeLbl,
    durationDays: days,
    shiftLabel: 'Shift Pagi: 08:00 - 17:00',
    status: initialStatus,
    reason: form.value.reason,
    attachmentName: form.value.fileName || undefined,
    attachmentSize: form.value.fileSize || undefined
  });

  // Reset form
  isSubmitted.value = false;
  form.value = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    fileName: '',
    fileSize: ''
  };
  if (fileInputRef.value) fileInputRef.value.value = '';

  if (initialStatus === 'Menunggu Surat Dokter') {
    triggerToast('Laporan sakit dicatat. Silakan unggah surat dokter susulan melalui tombol kelola pengajuan.');
  } else {
    triggerToast(`Permohonan cuti (${newRecord.id}) berhasil diajukan dan diteruskan ke admin/atasan.`);
  }
};
</script>

<template>
  <div class="user-cuti-page space-y-3.5 max-w-7xl mx-auto text-slate-800">
    <!-- Breadcrumb & Top Bar -->
    <div>
      <nav class="flex items-center gap-1.5 text-[11px] text-[#64748b] mb-0.5">
        <span>Roster</span>
        <span class="text-slate-300">&gt;</span>
        <span class="text-[#0284c7] font-semibold">Jadwal Roster</span>
      </nav>
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="text-xl font-bold text-[#1e293b] tracking-tight">
          Manajemen Cuti
        </h1>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {{ activeYearLabel }}
        </span>
      </div>
      <p class="text-[11px] text-[#64748b] mt-0.5">
        Kelola kuota, permohonan cuti, dan riwayat izin kerja Anda.
      </p>
    </div>

    <!-- ── 4 STAT METRIC CARDS ── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Card 1: Sisa Cuti Per Tahun -->
      <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              SISA CUTI PER TAHUN
            </span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-bold text-slate-800 tracking-tight">{{ sisaCuti }}</span>
              <span class="text-[11px] font-semibold text-slate-500">Hari</span>
            </div>
          </div>
          <div class="w-7 h-7 rounded-lg bg-[#e0f2fe] text-[#0084c4] flex items-center justify-center shrink-0">
            <Clock :size="15" />
          </div>
        </div>
        <div class="flex items-center justify-between pt-1.5 mt-2 border-t border-slate-100 text-[10px]">
          <span class="text-slate-500">Dari total {{ totalCutiTahunan }} hari</span>
          <span class="font-bold text-[#0084c4]">{{ Math.round((sisaCuti / (totalCutiTahunan || 1)) * 100) }}% Tersedia</span>
        </div>
      </div>

      <!-- Card 2: Cuti Disetujui -->
      <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              CUTI DISETUJUI
            </span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-bold text-slate-800 tracking-tight">{{ cutiDisetujuiHari }}</span>
              <span class="text-[11px] font-semibold text-slate-500">Hari</span>
            </div>
          </div>
          <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Check :size="15" />
          </div>
        </div>
        <div class="flex items-center justify-between pt-1.5 mt-2 border-t border-slate-100 text-[10px]">
          <span class="text-slate-500">{{ cutiDisetujuiCount }} Permohonan lolos</span>
          <span class="font-bold text-emerald-600">Aktif Disetujui</span>
        </div>
      </div>

      <!-- Card 3: Menunggu Persetujuan -->
      <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              MENUNGGU PERSETUJUAN
            </span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-bold text-slate-800 tracking-tight">{{ menungguPersetujuanHari }}</span>
              <span class="text-[11px] font-semibold text-slate-500">Hari</span>
            </div>
          </div>
          <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Hourglass :size="15" />
          </div>
        </div>
        <div class="flex items-center justify-between pt-1.5 mt-2 border-t border-slate-100 text-[10px]">
          <span class="text-slate-500">Tahun berjalan</span>
          <span class="font-bold text-amber-600">{{ menungguPersetujuanHari }} Hari</span>
        </div>
      </div>

      <!-- Card 4: Ditolak -->
      <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              DITOLAK
            </span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-bold text-slate-800 tracking-tight">{{ ditolakHari }}</span>
              <span class="text-[11px] font-semibold text-slate-500">Hari</span>
            </div>
          </div>
          <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <X :size="15" />
          </div>
        </div>
        <div class="flex items-center justify-between pt-1.5 mt-2 border-t border-slate-100 text-[10px]">
          <span class="text-slate-500">Tahun berjalan</span>
          <span class="font-bold text-slate-400">{{ ditolakHari > 0 ? `${ditolakHari} Hari` : 'Nihil' }}</span>
        </div>
      </div>
    </div>

    <!-- ── MAIN TWO-COLUMN CONTENT GRID ── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
      <!-- ── KOLOM KIRI: PENGAJUAN CUTI BARU (FORM) ── -->
      <div class="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
        <!-- Form Header -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 class="text-xs font-bold text-slate-800">
              Pengajuan Cuti Baru
            </h2>
            <p class="text-[10px] text-slate-400 mt-0.5">
              Isi rincian permohonan cuti / izin
            </p>
          </div>
          <span class="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold tracking-wider">
            Form
          </span>
        </div>

        <form @submit.prevent="submitLeave" novalidate class="space-y-2.5 text-xs">
          <!-- Jenis Cuti -->
          <div>
            <label class="block font-semibold text-slate-700 text-[11px] mb-1">
              Jenis Cuti <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.leaveType"
              :class="[
                isSubmitted && !form.leaveType
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-200 focus:border-[#0084c4] focus:ring-[#0084c4]/20'
              ]"
              class="w-full h-8 px-2.5 rounded-lg border text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 transition-all font-medium"
            >
              <option value="" disabled>Pilih Jenis Cuti...</option>
              <option v-for="type in leaveTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
            <p v-if="isSubmitted && !form.leaveType" class="text-[11px] text-red-500 mt-1 font-normal">
              Jenis Cuti wajib dipilih.
            </p>
          </div>

          <!-- Date Range (Mulai & Selesai) -->
          <div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-semibold text-slate-700 text-[11px] mb-1">
                  Tanggal Mulai <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.startDate"
                  type="date"
                  :class="[
                    isSubmitted && (!form.startDate || !form.endDate)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 focus:border-[#0084c4] focus:ring-[#0084c4]/20'
                  ]"
                  class="w-full h-8 px-2 rounded-lg border text-xs text-slate-800 focus:outline-none focus:ring-1 transition-all"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 text-[11px] mb-1">
                  Tanggal Selesai <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.endDate"
                  type="date"
                  :class="[
                    isSubmitted && (!form.startDate || !form.endDate)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 focus:border-[#0084c4] focus:ring-[#0084c4]/20'
                  ]"
                  class="w-full h-8 px-2 rounded-lg border text-xs text-slate-800 focus:outline-none focus:ring-1 transition-all"
                />
              </div>
            </div>
            <p v-if="isSubmitted && (!form.startDate || !form.endDate)" class="text-[11px] text-red-500 mt-1 font-normal">
              Tanggal Mulai dan Selesai Cuti wajib diisi.
            </p>
          </div>

          <!-- Estimasi Hari Terpilih -->
          <div v-if="estimatedDays > 0" class="p-1.5 bg-blue-50/70 border border-[#bae6fd] rounded-lg flex items-center justify-between text-[11px]">
            <span class="text-slate-600 font-medium">Total Estimasi Durasi:</span>
            <span class="font-bold text-[#0084c4]">{{ estimatedDays }} Hari Kerja</span>
          </div>

          <!-- Alasan Permohonan -->
          <div>
            <label class="block font-semibold text-slate-700 text-[11px] mb-1">
              Alasan Permohonan <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.reason"
              rows="2"
              placeholder="Jelaskan keperluan cuti atau izin secara ringkas..."
              :class="[
                isSubmitted && !form.reason.trim()
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-200 focus:border-[#0084c4] focus:ring-[#0084c4]/20'
              ]"
              class="w-full p-2 rounded-lg border text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-1 transition-all placeholder:text-slate-400"
            ></textarea>
            <p v-if="isSubmitted && !form.reason.trim()" class="text-[11px] text-red-500 mt-1 font-normal">
              Alasan Cuti tidak boleh kosong.
            </p>
          </div>

          <!-- Lampiran Pendukung -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-semibold text-slate-700 text-[11px]">Lampiran Pendukung</label>
              <span
                v-if="form.leaveType === 'Cuti Sakit'"
                class="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 font-semibold px-1.5 py-0.5 rounded"
              >
                Bisa Susulan
              </span>
              <span v-else class="text-[9px] text-slate-400 font-medium">Opsional</span>
            </div>

            <!-- Upload Box -->
            <div
              v-if="!form.fileName"
              @click="fileInputRef?.click()"
              class="border border-dashed border-slate-200 hover:border-[#0084c4] rounded-lg py-2.5 px-3 text-center bg-slate-50/60 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                @change="handleFileUpload"
                class="hidden"
              />
              <UploadCloud :size="18" class="mx-auto text-slate-400 group-hover:text-[#0084c4] transition-colors mb-0.5" />
              <div class="text-[11px] font-bold text-slate-700 group-hover:text-[#0084c4] transition-colors">
                {{ form.leaveType === 'Cuti Sakit' ? 'Pilih Surat Dokter (PDF / JPG)' : 'Pilih berkas PDF atau JPG' }}
              </div>
              <div class="text-[9px] text-slate-400 mt-0.5">
                {{ form.leaveType === 'Cuti Sakit' ? 'Dapat diunggah susulan setelah berobat' : 'Maksimal file 5 MB' }}
              </div>
            </div>

            <!-- Selected File Badge -->
            <div
              v-else
              class="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
            >
              <div class="flex items-center gap-1.5 truncate pr-2">
                <FileText :size="14" class="text-[#0084c4] shrink-0" />
                <div class="truncate">
                  <div class="text-xs font-semibold text-slate-800 truncate">{{ form.fileName }}</div>
                  <div class="text-[9px] text-slate-400">{{ form.fileSize }}</div>
                </div>
              </div>
              <button
                type="button"
                @click="removeFile"
                class="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
              >
                <Trash2 :size="13" />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-1.5 space-y-2">
            <button
              type="submit"
              class="w-full h-10 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Send :size="15" />
              <span>{{ isEditing ? 'Perbarui Permohonan Cuti' : 'Kirim Permohonan Cuti' }}</span>
            </button>
            <button
              v-if="isEditing"
              type="button"
              @click="cancelEdit"
              class="w-full h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
            >
              Batal Sunting
            </button>
          </div>
        </form>
      </div>

      <!-- ── KOLOM KANAN: RIWAYAT PENGAJUAN CUTI (TABLE) ── -->
      <div class="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between">
        <!-- Header & Search/Filter Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 class="text-xs font-bold text-slate-800">
              Riwayat Pengajuan Cuti
            </h2>
            <p class="text-[10px] text-slate-400 mt-0.5">
              Daftar rekam jejak pengajuan cuti dan izin operasional Anda
            </p>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative w-40 sm:w-48">
              <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari tanggal / tipe..."
                class="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0084c4]"
              />
            </div>
            <button
              type="button"
              class="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Filter :size="13" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <!-- Table Responsive Container -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <th class="py-2 px-2.5">TANGGAL PENGAJUAN</th>
                <th class="py-2 px-2.5">JENIS CUTI</th>
                <th class="py-2 px-2.5">DURASI &amp; TANGGAL</th>
                <th class="py-2 px-2.5 text-center">STATUS PENGAJUAN</th>
                <th class="py-2 px-2.5 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              <tr
                v-for="item in paginatedHistory"
                :key="item.id"
                class="hover:bg-slate-50/70 transition-colors"
              >
                <!-- Tanggal Pengajuan -->
                <td class="py-2 px-2.5 font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                  {{ item.submitDate }}
                </td>

                <!-- Jenis Cuti -->
                <td class="py-2 px-2.5 whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="w-1.5 h-1.5 rounded-full shrink-0"
                      :class="[
                        item.leaveType === 'Cuti Tahunan' ? 'bg-emerald-500' :
                        item.leaveType === 'Izin Kerja Khusus' ? 'bg-rose-500' :
                        item.leaveType === 'Cuti Sakit' ? 'bg-amber-500' :
                        'bg-blue-500'
                      ]"
                    ></span>
                    <span class="font-medium text-slate-800 text-[11px]">{{ item.leaveType }}</span>
                  </div>
                </td>

                <!-- Durasi & Tanggal Pelaksanaan -->
                <td class="py-2 px-2.5">
                  <div class="font-bold text-slate-800 text-xs">{{ item.durationDays }} Hari</div>
                  <div class="text-[10px] text-slate-400">{{ item.dateRangeLabel }}</div>
                </td>

                <!-- Status Pengajuan (Dinamis: Disetujui, Ditolak, Menunggu Approval, Menunggu Surat Dokter) -->
                <td class="py-2 px-2.5 text-center whitespace-nowrap">
                  <span
                    v-if="item.status === 'Disetujui'"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold"
                  >
                    <Check :size="11" />
                    <span>Disetujui</span>
                  </span>
                  <span
                    v-else-if="item.status === 'Ditolak'"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold"
                  >
                    <X :size="11" />
                    <span>Ditolak</span>
                  </span>
                  <span
                    v-else-if="item.status === 'Menunggu Surat Dokter'"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold"
                    title="Surat dokter belum diunggah"
                  >
                    <AlertCircle :size="11" class="text-amber-600" />
                    <span>Menunggu Surat Dokter</span>
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold"
                  >
                    <Clock :size="11" />
                    <span>Menunggu Approval</span>
                  </span>
                </td>

                <!-- Aksi (Ikon Mata & Pensil seperti di Desain) -->
                <td class="py-2 px-2.5 text-center whitespace-nowrap">
                  <div class="inline-flex items-center gap-1">
                    <button
                      type="button"
                      @click="openDetailModal(item)"
                      class="w-7 h-7 rounded-lg text-slate-400 hover:text-[#0084c4] hover:bg-blue-50 inline-flex items-center justify-center transition-colors cursor-pointer"
                      title="Lihat Detail Pengajuan"
                    >
                      <Eye :size="14" />
                    </button>
                    <button
                      v-if="item.status.includes('Menunggu')"
                      type="button"
                      @click="openEditFromDetail(item)"
                      class="w-7 h-7 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 inline-flex items-center justify-center transition-colors cursor-pointer"
                      title="Sunting Pengajuan"
                    >
                      <Edit2 :size="13" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredHistory.length === 0">
                <td colspan="5" class="py-6 text-center text-slate-400 text-xs">
                  Tidak ditemukan riwayat pengajuan cuti yang sesuai.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer & Pagination (Standar Biru BMIS) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Menampilkan {{ filteredHistory.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0 }}-{{ Math.min(currentPage * itemsPerPage, filteredHistory.length) }} dari {{ filteredHistory.length }} pengajuan
          </div>
          <div class="inline-flex items-center gap-1 self-center sm:self-auto">
            <button
              type="button"
              :disabled="currentPage === 1"
              @click="currentPage--"
              class="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer text-xs"
              title="Halaman Sebelumnya"
            >
              &lt;
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
                currentPage === page
                  ? 'bg-[#0084c4] text-white shadow-xs'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              ]"
            >
              {{ page }}
            </button>
            <button
              type="button"
              :disabled="currentPage === totalPages || totalPages === 0"
              @click="currentPage++"
              class="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer text-xs"
              title="Halaman Selanjutnya"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODAL RINCIAN & KELOLA PENGAJUAN CUTI / IZIN (PERSIS SESUAI DESAIN BMIS) ── -->
    <Teleport to="body">
      <div
        v-if="isDetailModalOpen && selectedDetail"
        @click.self="isDetailModalOpen = false"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      >
        <div
          class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-200 overflow-hidden"
        >
          <!-- 1. Modal Header (Fixed at top, always visible) -->
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
                  Informasi detail permohonan dan riwayat persetujuan berjenjang.
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

          <!-- Modal Scrollable Body -->
          <div class="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
            <!-- 2. Ringkasan Pengajuan Card -->
            <div class="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-2.5">
              <!-- Row 1: Jenis Pengajuan & Tanggal Pengajuan -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">JENIS PENGAJUAN</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="font-bold text-xs sm:text-sm text-slate-800">{{ selectedDetail.leaveType }}</span>
                    <span
                      v-if="selectedDetail.categoryTag || selectedDetail.leaveType.toLowerCase().includes('sakit')"
                      class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100"
                    >
                      {{ selectedDetail.categoryTag || 'Medis' }}
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

              <!-- Row 2: Rentang Tanggal & Durasi + Shift Badge -->
              <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RENTANG TANGGAL &amp; DURASI</span>
                  <div class="flex items-center gap-1.5 mt-0.5 font-bold text-xs text-slate-800">
                    <Calendar :size="13" class="text-slate-400 shrink-0" />
                    <span>{{ selectedDetail.dateRangeLabel }}</span>
                    <span class="text-[11px] text-slate-400 font-normal">({{ selectedDetail.durationDays }} Hari Kerja)</span>
                  </div>
                </div>

                <div class="px-2.5 py-0.5 rounded-md text-[10px] font-semibold text-[#0084c4] border border-blue-200 bg-blue-50/50 shrink-0">
                  {{ selectedDetail.shiftLabel || 'Shift Pagi: 08:00 - 17:00' }}
                </div>
              </div>
            </div>

            <!-- 3. Alasan Pengajuan -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-slate-800">Alasan Pengajuan</span>
                <span class="text-[10px] text-slate-400">Keterangan Mandiri Pegawai</span>
              </div>
              <div class="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs text-slate-700 italic">
                “{{ selectedDetail.reason }}”
              </div>
            </div>

            <!-- 4. Lampiran Dokumen -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-slate-800">Lampiran Dokumen</span>
                <span v-if="selectedDetail.attachmentName" class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                  <CheckCircle2 :size="12" />
                  1 Berkas Terverifikasi
                </span>
                <span v-else class="text-[10px] text-slate-400">
                  Tidak Ada Lampiran
                </span>
              </div>

              <!-- File Item Card -->
              <div v-if="selectedDetail.attachmentName" class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors">
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                  <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                    <FileText :size="16" />
                  </div>
                  <div class="min-w-0">
                    <span class="text-xs font-bold text-slate-800 block truncate max-w-[190px] sm:max-w-[240px]">
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
                    @click="previewAttachment(selectedDetail.attachmentName)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Eye :size="12" class="text-slate-500" />
                    <span>Pratinjau</span>
                  </button>
                  <button
                    type="button"
                    @click="downloadAttachment(selectedDetail.attachmentName)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Download :size="12" class="text-slate-500" />
                    <span>Unduh</span>
                  </button>
                </div>
              </div>

              <!-- Box Unggah Susulan (Jika status Menunggu Surat Dokter) -->
              <div
                v-else-if="selectedDetail.status === 'Menunggu Surat Dokter'"
                class="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2"
              >
                <div class="flex items-start gap-2">
                  <AlertCircle :size="15" class="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span class="font-bold text-xs text-amber-900 block">Surat Dokter Belum Terlampir</span>
                    <span class="text-[10px] text-amber-700 block leading-relaxed">
                      Unggah surat dokter dari klinik/faskes sekarang agar izin sakit Anda diteruskan ke atasan.
                    </span>
                  </div>
                </div>

                <div>
                  <div
                    v-if="!modalUploadFile"
                    @click="modalFileInputRef?.click()"
                    class="border border-dashed border-amber-300 hover:border-[#0084c4] bg-white rounded-lg p-2 text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref="modalFileInputRef"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      @change="handleModalFileUpload"
                      class="hidden"
                    />
                    <UploadCloud :size="16" class="mx-auto text-amber-600 mb-0.5" />
                    <div class="text-[11px] font-bold text-slate-700">Pilih Berkas Surat Dokter (PDF / JPG)</div>
                    <div class="text-[9px] text-slate-400">Maksimal 5 MB</div>
                  </div>

                  <div v-else class="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-300">
                    <div class="flex items-center gap-1.5 truncate pr-2 text-xs font-semibold text-slate-800">
                      <FileText :size="13" class="text-[#0084c4] shrink-0" />
                      <span class="truncate">{{ modalUploadFileName }}</span>
                    </div>
                    <button
                      type="button"
                      @click="removeModalUpload"
                      class="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <Trash2 :size="12" />
                    </button>
                  </div>
                </div>

                <button
                  v-if="modalUploadFile"
                  type="button"
                  @click="saveDoctorNoteToRecord"
                  class="w-full h-7 rounded-lg bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send :size="12" />
                  <span>Simpan &amp; Teruskan ke Atasan</span>
                </button>
              </div>
            </div>

            <!-- 5. Riwayat Persetujuan (Approval Tracking) -->
            <div>
              <span class="text-xs font-bold text-slate-800 block mb-1.5">Riwayat Persetujuan (Approval Tracking)</span>

              <div class="p-3 rounded-xl border border-slate-200/90 bg-white space-y-3">
                <!-- Jika ada steps terstruktur -->
                <template v-if="selectedDetail.approvalSteps && selectedDetail.approvalSteps.length > 0">
                  <div
                    v-for="(step, sIdx) in selectedDetail.approvalSteps"
                    :key="sIdx"
                    class="relative pl-6"
                    :class="[sIdx < selectedDetail.approvalSteps.length - 1 ? 'pb-3' : '']"
                  >
                    <!-- Garis penghubung -->
                    <div
                      v-if="sIdx < selectedDetail.approvalSteps.length - 1"
                      class="absolute left-[9px] top-5 bottom-0 w-0.5 bg-slate-200"
                    ></div>

                    <!-- Lingkaran icon -->
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
                        <span
                          v-else-if="step.badge"
                          class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          {{ step.badge }}
                        </span>
                      </div>

                      <div class="text-xs text-slate-700 mt-0.5">
                        <span
                          :class="[
                            step.status === 'Disetujui'
                              ? 'font-bold text-slate-800'
                              : step.status === 'Ditolak'
                                ? 'font-bold text-rose-600'
                                : 'font-bold text-slate-800'
                          ]"
                        >
                          {{ step.statusText }}
                        </span>
                        <span v-if="step.name && step.status !== 'Menunggu'" class="text-slate-500 text-[11px]"> ({{ step.name }})</span>
                      </div>

                      <div
                        v-if="step.notes"
                        class="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic"
                      >
                        “{{ step.notes }}”
                      </div>

                      <p v-if="step.description" class="text-[10px] text-slate-400 mt-1 m-0 leading-relaxed">
                        {{ step.description }}
                      </p>
                    </div>
                  </div>
                </template>

                <!-- Fallback jika belum memiliki steps terstruktur -->
                <template v-else>
                  <div class="relative pl-6 pb-3">
                    <div class="absolute left-[9px] top-5 bottom-0 w-0.5 bg-slate-200"></div>
                    <div class="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300 flex items-center justify-center">
                      <Check :size="11" class="stroke-[3]" />
                    </div>
                    <div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-800">Level 1 (Supervisor)</span>
                        <span class="text-[10px] text-slate-400">{{ selectedDetail.submitDate }}</span>
                      </div>
                      <div class="text-xs text-slate-700 mt-0.5">
                        <span class="font-bold text-slate-800">Disetujui</span>
                        <span class="text-slate-500 text-[11px]"> ({{ selectedDetail.approver || 'Supervisor Operasional' }})</span>
                      </div>
                    </div>
                  </div>

                  <div class="relative pl-6">
                    <div class="absolute left-0 top-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300 flex items-center justify-center">
                      <Check :size="11" class="stroke-[3]" />
                    </div>
                    <div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-800">Level 2 (HRD)</span>
                        <span class="text-[10px] text-slate-400">{{ selectedDetail.submitDate }}</span>
                      </div>
                      <div class="text-xs text-slate-700 mt-0.5">
                        <span class="font-bold text-slate-800">Disetujui</span>
                        <span class="text-slate-500 text-[11px]"> (HR Operations)</span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- 6. Modal Footer (Fixed at bottom) -->
          <div class="flex items-center justify-between px-5 py-3 border-t border-slate-100 shrink-0 bg-slate-50/60">
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] text-slate-400">Status:</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-200 text-slate-700 bg-white shadow-2xs">
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="[
                    selectedDetail.status === 'Disetujui'
                      ? 'bg-emerald-500'
                      : selectedDetail.status === 'Ditolak'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                  ]"
                ></span>
                {{ selectedDetail.statusLabel || (selectedDetail.status === 'Disetujui' ? 'DISETUJUI' : selectedDetail.status === 'Ditolak' ? 'DITOLAK' : 'MENUNGGU HRD') }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="selectedDetail.status.includes('Menunggu')"
                type="button"
                @click="requestCancelLeave(selectedDetail)"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
              >
                <X :size="12" />
                <span>Batalkan Pengajuan</span>
              </button>
              <button
                v-if="selectedDetail.status.includes('Menunggu')"
                type="button"
                @click="openEditFromDetail(selectedDetail)"
                class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <span>Edit</span>
              </button>
              <button
                v-else
                type="button"
                @click="isDetailModalOpen = false"
                class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL KONFIRMASI PEMBATALAN PENGAJUAN CUTI ── -->
    <Teleport to="body">
      <div
        v-if="showCancelConfirmModal && itemToCancel"
        @click.self="dismissCancelConfirm"
        class="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      >
        <div class="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center space-y-3.5 animate-in zoom-in-95 duration-150">
          <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto">
            <AlertCircle :size="24" />
          </div>

          <div>
            <h3 class="text-sm font-bold text-slate-800">Batalkan Pengajuan Cuti?</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pengajuan <span class="font-bold text-slate-800">{{ itemToCancel.id }}</span> ({{ itemToCancel.leaveType }})? Permohonan ini akan dihapus dari sistem.
            </p>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button
              type="button"
              @click="dismissCancelConfirm"
              class="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Tidak, Kembali
            </button>
            <button
              type="button"
              @click="confirmCancelLeave"
              class="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Ya, Batalkan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── TOAST NOTIFICATION ── -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 border-l-4 border-l-[#0084c4] rounded-xl px-3.5 py-2.5 shadow-xl flex items-center gap-2.5 text-xs font-bold text-slate-800"
    >
      <CheckCircle2 :size="16" class="text-[#0084c4] flex-shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
