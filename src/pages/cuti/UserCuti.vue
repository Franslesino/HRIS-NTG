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
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import {
  useLeaveStore,
  type LeaveRecord,
  type ApprovalStep
} from '../../composables/useLeaveStore';
import { toast } from 'vue-sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatCard from '@/components/shared/StatCard.vue';
import EmptyState from '@/components/shared/EmptyState.vue';

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
const triggerToast = (msg: string) => {
  toast.success(msg);
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
    avatarColor: 'bg-primary/10 text-primary',
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
  <div class="space-y-6">
    <PageHeader
      title="Manajemen Cuti"
      description="Kelola kuota, permohonan cuti, dan riwayat izin kerja Anda."
      :badge="activeYearLabel"
      badge-variant="success"
      :breadcrumbs="[{ label: 'Cuti' }, { label: 'Cuti Saya' }]"
    />

    <!-- STATS -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Sisa Cuti per Tahun"
        :value="`${sisaCuti} Hari`"
        :hint="`Dari total ${totalCutiTahunan} hari`"
        :icon="Clock"
      >
        <template #meta>
          <Badge variant="info">
            {{ Math.round((sisaCuti / (totalCutiTahunan || 1)) * 100) }}% tersedia
          </Badge>
        </template>
      </StatCard>

      <StatCard
        title="Cuti Disetujui"
        :value="`${cutiDisetujuiHari} Hari`"
        :hint="`${cutiDisetujuiCount} permohonan lolos`"
        :icon="Check"
      >
        <template #meta>
          <Badge variant="success">Aktif</Badge>
        </template>
      </StatCard>

      <StatCard
        title="Menunggu Persetujuan"
        :value="`${menungguPersetujuanHari} Hari`"
        hint="Tahun berjalan"
        :icon="Hourglass"
      >
        <template #meta>
          <Badge variant="warning">Pending</Badge>
        </template>
      </StatCard>

      <StatCard
        title="Ditolak"
        :value="`${ditolakHari} Hari`"
        hint="Tahun berjalan"
        :icon="X"
      >
        <template #meta>
          <Badge :variant="ditolakHari > 0 ? 'destructive' : 'muted'">
            {{ ditolakHari > 0 ? 'Ada penolakan' : 'Nihil' }}
          </Badge>
        </template>
      </StatCard>
    </div>

    <!-- FORM + HISTORY -->
    <div class="grid items-start gap-4 lg:grid-cols-12">
      <!-- FORM -->
      <Card class="lg:col-span-4">
        <CardHeader class="flex flex-row items-start justify-between space-y-0">
          <div class="space-y-1">
            <CardTitle class="text-base">
              {{ isEditing ? 'Sunting Pengajuan' : 'Pengajuan Cuti Baru' }}
            </CardTitle>
            <CardDescription>Isi rincian permohonan cuti / izin.</CardDescription>
          </div>
          <Badge variant="secondary">Form</Badge>
        </CardHeader>

        <CardContent>
          <form class="space-y-3.5" novalidate @submit.prevent="submitLeave">
            <div class="space-y-1.5">
              <Label>Jenis Cuti <span class="text-destructive">*</span></Label>
              <Select v-model="form.leaveType">
                <SelectTrigger :class="isSubmitted && !form.leaveType ? 'border-destructive' : ''">
                  <SelectValue placeholder="Pilih Jenis Cuti..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="type in leaveTypes" :key="type" :value="type">
                    {{ type }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="isSubmitted && !form.leaveType" class="text-xs text-destructive">
                Jenis Cuti wajib dipilih.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label>Tanggal Mulai <span class="text-destructive">*</span></Label>
                <Input
                  v-model="form.startDate"
                  type="date"
                  :class="isSubmitted && (!form.startDate || !form.endDate) ? 'border-destructive' : ''"
                />
              </div>
              <div class="space-y-1.5">
                <Label>Tanggal Selesai <span class="text-destructive">*</span></Label>
                <Input
                  v-model="form.endDate"
                  type="date"
                  :class="isSubmitted && (!form.startDate || !form.endDate) ? 'border-destructive' : ''"
                />
              </div>
            </div>
            <p v-if="isSubmitted && (!form.startDate || !form.endDate)" class="text-xs text-destructive">
              Tanggal Mulai dan Selesai Cuti wajib diisi.
            </p>

            <div
              v-if="estimatedDays > 0"
              class="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs"
            >
              <span class="font-medium text-sky-800">Total Estimasi Durasi</span>
              <span class="font-semibold text-sky-900">{{ estimatedDays }} Hari Kerja</span>
            </div>

            <div class="space-y-1.5">
              <Label>Alasan Permohonan <span class="text-destructive">*</span></Label>
              <Textarea
                v-model="form.reason"
                rows="3"
                placeholder="Jelaskan keperluan cuti atau izin secara ringkas..."
                :class="isSubmitted && !form.reason.trim() ? 'border-destructive' : ''"
              />
              <p v-if="isSubmitted && !form.reason.trim()" class="text-xs text-destructive">
                Alasan Cuti tidak boleh kosong.
              </p>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label>Lampiran Pendukung</Label>
                <Badge v-if="form.leaveType === 'Cuti Sakit'" variant="warning">Bisa Susulan</Badge>
                <span v-else class="text-xs text-muted-foreground">Opsional</span>
              </div>

              <div
                v-if="!form.fileName"
                class="cursor-pointer rounded-lg border border-dashed px-3 py-3 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
                @click="fileInputRef?.click()"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  class="hidden"
                  @change="handleFileUpload"
                />
                <UploadCloud class="mx-auto mb-1 size-5 text-muted-foreground" />
                <p class="text-xs font-medium">
                  {{ form.leaveType === 'Cuti Sakit' ? 'Pilih Surat Dokter (PDF / JPG)' : 'Pilih berkas PDF atau JPG' }}
                </p>
                <p class="mt-0.5 text-[11px] text-muted-foreground">
                  {{ form.leaveType === 'Cuti Sakit' ? 'Dapat diunggah susulan setelah berobat' : 'Maksimal file 5 MB' }}
                </p>
              </div>

              <div v-else class="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-2.5">
                <div class="flex min-w-0 items-center gap-2">
                  <FileText class="size-4 shrink-0 text-primary" />
                  <div class="min-w-0">
                    <p class="truncate text-xs font-medium">{{ form.fileName }}</p>
                    <p class="text-[11px] text-muted-foreground">{{ form.fileSize }}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="shrink-0 text-muted-foreground hover:text-destructive"
                  @click="removeFile"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>

            <div class="space-y-2 pt-1">
              <Button type="submit" class="w-full">
                <Send />
                {{ isEditing ? 'Perbarui Permohonan Cuti' : 'Kirim Permohonan Cuti' }}
              </Button>
              <Button
                v-if="isEditing"
                type="button"
                variant="outline"
                class="w-full"
                @click="cancelEdit"
              >
                Batal Sunting
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- HISTORY -->
      <Card class="lg:col-span-8">
        <CardHeader class="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <CardTitle class="text-base">Riwayat Pengajuan Cuti</CardTitle>
            <CardDescription>Rekam jejak pengajuan cuti dan izin operasional Anda.</CardDescription>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                type="search"
                placeholder="Cari tanggal / tipe..."
                class="h-8 w-full pl-8 sm:w-52"
              />
            </div>
            <Select v-model="selectedStatusFilter">
              <SelectTrigger class="h-8 w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua Status</SelectItem>
                <SelectItem value="Menunggu">Menunggu</SelectItem>
                <SelectItem value="Disetujui">Disetujui</SelectItem>
                <SelectItem value="Ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent class="px-0">
          <Table v-if="paginatedHistory.length">
            <TableHeader>
              <TableRow>
                <TableHead class="pl-6">Tanggal Pengajuan</TableHead>
                <TableHead>Jenis Cuti</TableHead>
                <TableHead>Durasi &amp; Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in paginatedHistory" :key="item.id">
                <TableCell class="whitespace-nowrap pl-6 font-medium">{{ item.submitDate }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span
                      class="size-1.5 shrink-0 rounded-full"
                      :class="item.leaveType === 'Cuti Tahunan'
                        ? 'bg-emerald-500'
                        : item.leaveType === 'Izin Kerja Khusus'
                          ? 'bg-rose-500'
                          : item.leaveType === 'Cuti Sakit'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'"
                    />
                    <span class="whitespace-nowrap">{{ item.leaveType }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p class="font-medium">{{ item.durationDays }} Hari</p>
                  <p class="text-xs text-muted-foreground">{{ item.dateRangeLabel }}</p>
                </TableCell>
                <TableCell>
                  <Badge v-if="item.status === 'Disetujui'" variant="success">
                    <Check class="mr-1 size-3" />
                    Disetujui
                  </Badge>
                  <Badge v-else-if="item.status === 'Ditolak'" variant="destructive">
                    <X class="mr-1 size-3" />
                    Ditolak
                  </Badge>
                  <Badge
                    v-else-if="item.status === 'Menunggu Surat Dokter'"
                    variant="warning"
                    title="Surat dokter belum diunggah"
                  >
                    <AlertCircle class="mr-1 size-3" />
                    Menunggu Surat Dokter
                  </Badge>
                  <Badge v-else variant="warning">
                    <Clock class="mr-1 size-3" />
                    Menunggu Approval
                  </Badge>
                </TableCell>
                <TableCell class="pr-6">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Lihat Detail Pengajuan"
                      @click="openDetailModal(item)"
                    >
                      <Eye />
                    </Button>
                    <Button
                      v-if="item.status.includes('Menunggu')"
                      variant="ghost"
                      size="icon-sm"
                      class="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      title="Sunting Pengajuan"
                      @click="openEditFromDetail(item)"
                    >
                      <Edit2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div v-else class="px-6 pb-6">
            <EmptyState
              title="Tidak ditemukan riwayat cuti"
              description="Tidak ada pengajuan yang sesuai dengan pencarian atau filter."
              :icon="Calendar"
            />
          </div>

          <div class="flex flex-col gap-3 border-t px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span class="text-xs text-muted-foreground">
              Menampilkan {{ filteredHistory.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0 }}-{{ Math.min(currentPage * itemsPerPage, filteredHistory.length) }}
              dari {{ filteredHistory.length }} pengajuan
            </span>

            <div class="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                :disabled="currentPage === 1"
                title="Halaman Sebelumnya"
                @click="currentPage--"
              >
                <ChevronLeft />
              </Button>
              <Button
                v-for="page in totalPages"
                :key="page"
                size="icon-sm"
                :variant="currentPage === page ? 'default' : 'outline'"
                @click="currentPage = page"
              >
                {{ page }}
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                :disabled="currentPage === totalPages || totalPages === 0"
                title="Halaman Selanjutnya"
                @click="currentPage++"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- DETAIL DIALOG -->
    <Dialog v-model:open="isDetailModalOpen">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader v-if="selectedDetail">
          <DialogTitle class="flex flex-wrap items-center gap-2">
            Detail Pengajuan Cuti / Izin
            <Badge variant="warning">{{ selectedDetail.id }}</Badge>
          </DialogTitle>
          <DialogDescription>
            Informasi detail permohonan dan riwayat persetujuan berjenjang.
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedDetail" class="space-y-4">
          <div class="space-y-2.5 rounded-lg border p-3.5">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-muted-foreground">JENIS PENGAJUAN</p>
                <div class="mt-0.5 flex items-center gap-1.5">
                  <span class="font-semibold">{{ selectedDetail.leaveType }}</span>
                  <Badge
                    v-if="selectedDetail.categoryTag || selectedDetail.leaveType.toLowerCase().includes('sakit')"
                    variant="destructive"
                  >
                    {{ selectedDetail.categoryTag || 'Medis' }}
                  </Badge>
                </div>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">TANGGAL PENGAJUAN</p>
                <p class="mt-0.5 flex items-center gap-1.5 font-semibold">
                  <Calendar class="size-3.5 text-muted-foreground" />
                  {{ selectedDetail.submitDate }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
              <div>
                <p class="text-xs text-muted-foreground">RENTANG TANGGAL &amp; DURASI</p>
                <p class="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                  <Calendar class="size-3.5 text-muted-foreground" />
                  {{ selectedDetail.dateRangeLabel }}
                  <span class="text-xs font-normal text-muted-foreground">({{ selectedDetail.durationDays }} Hari Kerja)</span>
                </p>
              </div>
              <Badge variant="info">{{ selectedDetail.shiftLabel || 'Shift Pagi: 08:00 - 17:00' }}</Badge>
            </div>
          </div>

          <div>
            <div class="mb-1 flex items-center justify-between">
              <p class="text-sm font-semibold">Alasan Pengajuan</p>
              <span class="text-xs text-muted-foreground">Keterangan Mandiri Pegawai</span>
            </div>
            <p class="rounded-lg border bg-muted/40 p-3 text-sm italic text-muted-foreground">
              “{{ selectedDetail.reason }}”
            </p>
          </div>

          <div>
            <div class="mb-1 flex items-center justify-between">
              <p class="text-sm font-semibold">Lampiran Dokumen</p>
              <span v-if="selectedDetail.attachmentName" class="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 class="size-3" />
                1 Berkas Terverifikasi
              </span>
              <span v-else class="text-xs text-muted-foreground">Tidak Ada Lampiran</span>
            </div>

            <div
              v-if="selectedDetail.attachmentName"
              class="flex items-center justify-between gap-2 rounded-lg border p-2.5"
            >
              <div class="flex min-w-0 items-center gap-2.5">
                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                  <FileText class="size-4" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{{ selectedDetail.attachmentName }}</p>
                  <p class="text-xs text-muted-foreground">{{ selectedDetail.attachmentSize || '842 KB • PDF Document' }}</p>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-1.5">
                <Button variant="outline" size="xs" @click="previewAttachment(selectedDetail.attachmentName)">
                  <Eye />
                  Pratinjau
                </Button>
                <Button variant="outline" size="xs" @click="downloadAttachment(selectedDetail.attachmentName)">
                  <Download />
                  Unduh
                </Button>
              </div>
            </div>

            <div
              v-else-if="selectedDetail.status === 'Menunggu Surat Dokter'"
              class="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5"
            >
              <div class="flex items-start gap-2">
                <AlertCircle class="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <p class="text-xs font-semibold text-amber-900">Surat Dokter Belum Terlampir</p>
                  <p class="text-xs leading-relaxed text-amber-700">
                    Unggah surat dokter dari klinik/faskes sekarang agar izin sakit Anda diteruskan ke atasan.
                  </p>
                </div>
              </div>

              <div>
                <div
                  v-if="!modalUploadFile"
                  class="cursor-pointer rounded-lg border border-dashed border-amber-300 bg-white p-2 text-center transition-colors hover:border-primary"
                  @click="modalFileInputRef?.click()"
                >
                  <input
                    ref="modalFileInputRef"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    class="hidden"
                    @change="handleModalFileUpload"
                  />
                  <UploadCloud class="mx-auto mb-0.5 size-4 text-amber-600" />
                  <p class="text-xs font-medium">Pilih Berkas Surat Dokter (PDF / JPG)</p>
                  <p class="text-[11px] text-muted-foreground">Maksimal 5 MB</p>
                </div>

                <div v-else class="flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-white p-2">
                  <div class="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                    <FileText class="size-3.5 shrink-0 text-primary" />
                    <span class="truncate">{{ modalUploadFileName }}</span>
                  </div>
                  <Button variant="ghost" size="icon-sm" @click="removeModalUpload">
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <Button v-if="modalUploadFile" size="sm" class="w-full" @click="saveDoctorNoteToRecord">
                <Send />
                Simpan &amp; Teruskan ke Atasan
              </Button>
            </div>
          </div>

          <div>
            <p class="mb-1.5 text-sm font-semibold">Riwayat Persetujuan (Approval Tracking)</p>
            <div class="space-y-3 rounded-lg border p-3">
              <template v-if="selectedDetail.approvalSteps && selectedDetail.approvalSteps.length > 0">
                <div
                  v-for="(step, sIdx) in selectedDetail.approvalSteps"
                  :key="sIdx"
                  class="relative pl-6"
                  :class="[sIdx < selectedDetail.approvalSteps.length - 1 ? 'pb-3' : '']"
                >
                  <div
                    v-if="sIdx < selectedDetail.approvalSteps.length - 1"
                    class="absolute bottom-0 left-[9px] top-5 w-0.5 bg-border"
                  />

                  <div
                    class="absolute left-0 top-0.5 flex size-5 items-center justify-center rounded-full border"
                    :class="step.status === 'Disetujui'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                      : step.status === 'Ditolak'
                        ? 'border-rose-300 bg-rose-50 text-rose-600'
                        : 'border-amber-300 bg-amber-50 text-amber-600'"
                  >
                    <Check v-if="step.status === 'Disetujui'" class="size-3" />
                    <X v-else-if="step.status === 'Ditolak'" class="size-3" />
                    <Hourglass v-else class="size-2.5" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-sm font-semibold">{{ step.level }}</span>
                      <span v-if="step.timestamp" class="text-xs text-muted-foreground">{{ step.timestamp }}</span>
                      <Badge v-else-if="step.badge" variant="warning">{{ step.badge }}</Badge>
                    </div>

                    <p class="mt-0.5 text-sm">
                      <span class="font-medium">{{ step.statusText }}</span>
                      <span v-if="step.name && step.status !== 'Menunggu'" class="text-xs text-muted-foreground">
                        ({{ step.name }})
                      </span>
                    </p>

                    <p v-if="step.notes" class="mt-1.5 rounded-md border bg-muted/40 p-2 text-xs italic text-muted-foreground">
                      “{{ step.notes }}”
                    </p>

                    <p v-if="step.description" class="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {{ step.description }}
                    </p>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="relative pb-3 pl-6">
                  <div class="absolute bottom-0 left-[9px] top-5 w-0.5 bg-border" />
                  <div class="absolute left-0 top-0.5 flex size-5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600">
                    <Check class="size-3" />
                  </div>
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-semibold">Level 1 (Supervisor)</span>
                      <span class="text-xs text-muted-foreground">{{ selectedDetail.submitDate }}</span>
                    </div>
                    <p class="mt-0.5 text-sm">
                      <span class="font-medium">Disetujui</span>
                      <span class="text-xs text-muted-foreground">({{ selectedDetail.approver || 'Supervisor Operasional' }})</span>
                    </p>
                  </div>
                </div>

                <div class="relative pl-6">
                  <div class="absolute left-0 top-0.5 flex size-5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600">
                    <Check class="size-3" />
                  </div>
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-semibold">Level 2 (HRD)</span>
                      <span class="text-xs text-muted-foreground">{{ selectedDetail.submitDate }}</span>
                    </div>
                    <p class="mt-0.5 text-sm">
                      <span class="font-medium">Disetujui</span>
                      <span class="text-xs text-muted-foreground">(HR Operations)</span>
                    </p>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <DialogFooter v-if="selectedDetail" class="gap-2 sm:justify-between">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            Status:
            <Badge
              :variant="selectedDetail.status === 'Disetujui'
                ? 'success'
                : selectedDetail.status === 'Ditolak'
                  ? 'destructive'
                  : 'warning'"
            >
              {{ selectedDetail.statusLabel || (selectedDetail.status === 'Disetujui' ? 'DISETUJUI' : selectedDetail.status === 'Ditolak' ? 'DITOLAK' : 'MENUNGGU HRD') }}
            </Badge>
          </div>

          <div class="flex items-center gap-2">
            <Button
              v-if="selectedDetail.status.includes('Menunggu')"
              variant="outline"
              class="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              @click="requestCancelLeave(selectedDetail)"
            >
              <X />
              Batalkan
            </Button>
            <Button
              v-if="selectedDetail.status.includes('Menunggu')"
              @click="openEditFromDetail(selectedDetail)"
            >
              <Edit2 />
              Edit
            </Button>
            <Button v-else variant="secondary" @click="isDetailModalOpen = false">
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- CANCEL CONFIRM -->
    <Dialog v-model:open="showCancelConfirmModal">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader v-if="itemToCancel">
          <div class="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-1 ring-rose-100">
            <AlertCircle class="size-6" />
          </div>
          <DialogTitle class="text-center">Batalkan Pengajuan Cuti?</DialogTitle>
          <DialogDescription class="text-center">
            Apakah Anda yakin ingin membatalkan pengajuan
            <strong class="text-foreground">{{ itemToCancel.id }}</strong>
            ({{ itemToCancel.leaveType }})? Permohonan ini akan dihapus dari sistem.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter class="gap-2 sm:justify-stretch">
          <Button variant="outline" class="flex-1" @click="dismissCancelConfirm">
            Tidak, Kembali
          </Button>
          <Button variant="destructive" class="flex-1" @click="confirmCancelLeave">
            Ya, Batalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
