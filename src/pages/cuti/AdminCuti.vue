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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatCard from '@/components/shared/StatCard.vue';
import EmptyState from '@/components/shared/EmptyState.vue';

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
const triggerToast = (msg: string) => {
  toast.success(msg);
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
  <div class="space-y-6">
    <PageHeader
      title="Manajemen Cuti"
      description="Kelola pengajuan cuti, persetujuan (approval), dan monitoring saldo karyawan operasional."
      badge="Mode Supervisor / HR"
      :breadcrumbs="[{ label: 'Cuti' }, { label: 'Manajemen Cuti' }]"
    >
      <template #actions>
        <Button variant="outline" @click="handleExport">
          <Download />
          Ekspor Laporan
        </Button>
        <Button @click="showManualModal = true">
          <CalendarPlus />
          Ajukan Cuti Manual
        </Button>
      </template>
    </PageHeader>

    <!-- METRICS -->
    <div class="grid gap-4 sm:grid-cols-3">
      <StatCard
        title="Diterima"
        :value="countApprovedMonth"
        hint="Pengajuan bulan ini"
        :icon="Check"
      >
        <template #meta>
          <Badge variant="success">100% diproses</Badge>
        </template>
      </StatCard>

      <StatCard
        title="Pending Approval"
        :value="countPending"
        hint="Menunggu review HR"
        :icon="Clock"
      >
        <template #meta>
          <Badge variant="warning">Perlu tindakan</Badge>
        </template>
      </StatCard>

      <StatCard
        title="Ditolak"
        :value="countRejectedMonth"
        hint="Pengajuan bulan ini"
        :icon="X"
      >
        <template #meta>
          <Badge variant="destructive">Tidak disetujui</Badge>
        </template>
      </StatCard>
    </div>

    <!-- MAIN -->
    <Card>
      <CardContent class="pt-6">
        <Tabs v-model="activeTab" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <TabsList>
              <TabsTrigger value="pending">
                Menunggu Persetujuan
                <Badge variant="secondary" class="ml-2">{{ countPending }}</Badge>
              </TabsTrigger>
              <TabsTrigger value="history">
                Riwayat Cuti
              </TabsTrigger>
              <TabsTrigger value="quota">
                Saldo Cuti
              </TabsTrigger>
            </TabsList>

            <Button variant="outline" size="icon" title="Segarkan Data" @click="handleRefresh">
              <RotateCcw />
            </Button>
          </div>

          <!-- FILTERS -->
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                type="search"
                placeholder="Cari nama karyawan atau NIK..."
                class="h-9 pl-9"
              />
            </div>

            <Select v-if="activeTab !== 'quota'" v-model="selectedLeaveType">
              <SelectTrigger class="h-9 w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua Jenis Cuti</SelectItem>
                <SelectItem value="Sakit">Sakit</SelectItem>
                <SelectItem value="Tahunan">Tahunan</SelectItem>
                <SelectItem value="Khusus">Izin Khusus</SelectItem>
              </SelectContent>
            </Select>

            <Select v-model="selectedDepartment">
              <SelectTrigger class="h-9 w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua Departemen</SelectItem>
                <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                <SelectItem value="Operasional Lapangan">Operasional Lapangan</SelectItem>
                <SelectItem value="Logistik &amp; Gudang">Logistik &amp; Gudang</SelectItem>
                <SelectItem value="Operator Alat Berat">Operator Alat Berat</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="ME">ME</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" class="h-9">
              <Filter />
              Filter
            </Button>
          </div>

          <!-- TAB PENDING -->
          <div v-if="activeTab === 'pending'" class="space-y-3">
            <div v-if="filteredPendingList.length" class="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Jenis Cuti</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Tahap Persetujuan</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in filteredPendingList" :key="item.id">
                    <TableCell>
                      <div class="flex items-center gap-3">
                        <div
                          class="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          :class="item.avatarColor"
                        >
                          {{ item.initials }}
                        </div>
                        <div>
                          <p class="text-sm font-medium">{{ item.empName }}</p>
                          <p class="text-xs text-muted-foreground">{{ item.empId }} • {{ item.department }}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge :variant="item.leaveType === 'Sakit' ? 'muted' : 'info'">
                        {{ item.leaveType }}
                      </Badge>
                    </TableCell>
                    <TableCell class="whitespace-nowrap font-medium">{{ item.dateRange }}</TableCell>
                    <TableCell class="whitespace-nowrap text-muted-foreground">{{ item.durationDays }} hari</TableCell>
                    <TableCell>
                      <Badge variant="warning">{{ item.status }}</Badge>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" @click="openDetailModal(item)">
                          Detail
                        </Button>
                        <Button size="sm" @click="openApproveModal(item)">
                          Setuju
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          class="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          @click="openRejectModal(item)"
                        >
                          Tolak
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <EmptyState
              v-else
              title="Tidak ada permohonan cuti"
              description="Semua pengajuan cuti telah diproses."
              :icon="Calendar"
            />

            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Menampilkan {{ filteredPendingList.length > 0 ? 1 : 0 }}-{{ filteredPendingList.length }}
                dari {{ pendingList.length }} pengajuan cuti
              </span>
              <span class="rounded-md border px-2 py-1 font-medium text-foreground">Halaman 1</span>
            </div>
          </div>

          <!-- TAB HISTORY -->
          <div v-else-if="activeTab === 'history'" class="space-y-3">
            <div v-if="filteredHistoryList.length" class="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Jenis Cuti</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu Proses &amp; Catatan</TableHead>
                    <TableHead class="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in filteredHistoryList" :key="item.id">
                    <TableCell>
                      <div class="flex items-center gap-3">
                        <div
                          class="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          :class="item.avatarColor"
                        >
                          {{ item.initials }}
                        </div>
                        <div>
                          <p class="text-sm font-medium">{{ item.empName }}</p>
                          <p class="text-xs text-muted-foreground">{{ item.empId }} • {{ item.department }}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{{ item.leaveType }}</TableCell>
                    <TableCell class="whitespace-nowrap font-medium">{{ item.dateRange }}</TableCell>
                    <TableCell class="whitespace-nowrap text-muted-foreground">{{ item.durationDays }} hari</TableCell>
                    <TableCell>
                      <Badge :variant="item.status === 'Disetujui' ? 'success' : 'destructive'">
                        {{ item.status }}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p class="text-xs font-medium">{{ item.processedDate || '-' }}</p>
                      <p v-if="item.rejectionReason" class="text-xs italic text-rose-600">
                        Alasan: “{{ item.rejectionReason }}”
                      </p>
                      <p v-else class="text-xs text-muted-foreground">
                        Oleh: {{ item.processedBy || 'Admin' }}
                      </p>
                    </TableCell>
                    <TableCell class="text-right">
                      <Button variant="outline" size="sm" @click="openDetailModal(item)">
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <EmptyState
              v-else
              title="Tidak ditemukan riwayat cuti"
              description="Coba ubah kata kunci atau filter yang dipilih."
              :icon="Calendar"
            />
          </div>

          <!-- TAB QUOTA -->
          <div v-else-if="activeTab === 'quota'" class="space-y-3">
            <div v-if="filteredQuotaList.length" class="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead class="text-center">Total Kuota</TableHead>
                    <TableHead class="text-center">Terpakai</TableHead>
                    <TableHead class="text-center">Sisa Saldo</TableHead>
                    <TableHead class="w-[180px]">Pemakaian</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="q in filteredQuotaList" :key="q.empId">
                    <TableCell>
                      <div class="flex items-center gap-3">
                        <div
                          class="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          :class="q.avatarColor"
                        >
                          {{ q.initials }}
                        </div>
                        <div>
                          <p class="text-sm font-medium">{{ q.empName }}</p>
                          <p class="text-xs text-muted-foreground">{{ q.empId }}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{{ q.department }}</TableCell>
                    <TableCell class="text-center font-semibold">{{ q.totalQuota }} Hari</TableCell>
                    <TableCell class="text-center font-medium text-amber-600">{{ q.usedQuota }} Hari</TableCell>
                    <TableCell class="text-center">
                      <Badge variant="success">{{ q.remainingQuota }} Hari Tersedia</Badge>
                    </TableCell>
                    <TableCell>
                      <Progress
                        :model-value="q.totalQuota ? (q.usedQuota / q.totalQuota) * 100 : 0"
                        class="h-1.5"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{{ q.status }}</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <EmptyState
              v-else
              title="Tidak ada data saldo cuti"
              description="Coba ubah departemen atau kata kunci pencarian."
              :icon="Calendar"
            />
          </div>
        </Tabs>
      </CardContent>
    </Card>

    <!-- DIALOG: APPROVE -->
    <Dialog v-model:open="showApproveModal">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader v-if="itemToApprove">
          <div class="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check class="size-6" />
          </div>
          <DialogTitle class="text-center">Setujui Pengajuan Cuti?</DialogTitle>
          <DialogDescription class="text-center">
            Anda akan menyetujui permohonan cuti berikut.
          </DialogDescription>
        </DialogHeader>

        <div v-if="itemToApprove" class="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <div class="flex items-center justify-between gap-3">
            <span class="text-muted-foreground">Nama</span>
            <span class="text-right font-medium">{{ itemToApprove.empName }} ({{ itemToApprove.empId }})</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-muted-foreground">Jenis Cuti</span>
            <span class="font-medium">{{ itemToApprove.leaveType }}</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-muted-foreground">Durasi</span>
            <span class="text-right font-medium text-primary">
              {{ itemToApprove.durationDays }} Hari ({{ itemToApprove.dateRange }})
            </span>
          </div>
        </div>

        <p v-if="itemToApprove" class="text-xs leading-relaxed text-muted-foreground">
          Saldo cuti akan dipotong dan jadwal roster karyawan otomatis disesuaikan.
        </p>

        <DialogFooter class="gap-2 sm:justify-stretch">
          <Button variant="outline" class="flex-1" @click="closeApproveModal">
            Batal
          </Button>
          <Button class="flex-1" @click="executeApprove">
            Ya, Setujui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: REJECT -->
    <Dialog v-model:open="showRejectModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader v-if="itemToReject">
          <DialogTitle class="flex items-center gap-2">
            <AlertCircle class="size-4 text-rose-500" />
            Tolak Permohonan Cuti?
          </DialogTitle>
          <DialogDescription>
            {{ itemToReject.empName }} • {{ itemToReject.leaveType }} • {{ itemToReject.durationDays }} hari
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-1.5">
          <Label>Alasan Penolakan <span class="text-destructive">*</span></Label>
          <Textarea
            v-model="rejectionNote"
            rows="3"
            placeholder="Contoh: Kuota personel regu shift pada tanggal tersebut sudah batas minimal operasional..."
            :class="rejectionError ? 'border-destructive focus-visible:ring-destructive' : ''"
          />
          <p v-if="rejectionError" class="text-xs text-destructive">
            Alasan penolakan wajib diisi agar transparan bagi karyawan.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeRejectModal">
            Batal
          </Button>
          <Button variant="destructive" @click="executeReject">
            Tolak Pengajuan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: DETAIL -->
    <Dialog v-model:open="isDetailModalOpen">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader v-if="selectedDetail">
          <DialogTitle class="flex flex-wrap items-center gap-2">
            Detail Pengajuan Cuti / Izin
            <Badge variant="warning">{{ selectedDetail.id }}</Badge>
          </DialogTitle>
          <DialogDescription>
            Pemohon: {{ selectedDetail.empName }} ({{ selectedDetail.empId }} • {{ selectedDetail.department }})
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedDetail" class="space-y-4">
          <div class="space-y-2.5 rounded-lg border p-3.5">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-muted-foreground">JENIS PENGAJUAN</p>
                <p class="mt-0.5 font-semibold">{{ selectedDetail.leaveType }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">TANGGAL PENGAJUAN</p>
                <p class="mt-0.5 font-semibold">{{ selectedDetail.submitDate }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-sm">
              <div>
                <p class="text-xs text-muted-foreground">RENTANG TANGGAL &amp; DURASI</p>
                <p class="mt-0.5 font-semibold">
                  {{ selectedDetail.dateRange }}
                  <span class="text-xs font-normal text-muted-foreground">({{ selectedDetail.durationDays }} Hari Kerja)</span>
                </p>
              </div>
              <Badge variant="info">{{ selectedDetail.shiftLabel || 'Shift Pagi: 08:00 - 17:00' }}</Badge>
            </div>
          </div>

          <div>
            <p class="mb-1 text-sm font-semibold">Alasan Permohonan</p>
            <p class="rounded-lg border bg-muted/40 p-3 text-sm italic text-muted-foreground">
              “{{ selectedDetail.reason }}”
            </p>
          </div>

          <div v-if="selectedDetail.attachmentName">
            <div class="mb-1 flex items-center justify-between">
              <p class="text-sm font-semibold">Lampiran Dokumen</p>
              <span class="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 class="size-3" />
                1 Berkas Terverifikasi
              </span>
            </div>

            <div class="flex items-center justify-between gap-2 rounded-lg border p-2.5">
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
                <Button
                  variant="outline"
                  size="xs"
                  @click="triggerToast(`Membuka pratinjau: ${selectedDetail.attachmentName}`)"
                >
                  <Eye />
                  Pratinjau
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  @click="triggerToast(`Mengunduh berkas: ${selectedDetail.attachmentName}`)"
                >
                  <Download />
                  Unduh
                </Button>
              </div>
            </div>
          </div>

          <div v-if="selectedDetail.approvalSteps">
            <p class="mb-1.5 text-sm font-semibold">Riwayat Persetujuan Berjenjang</p>
            <div class="space-y-3 rounded-lg border p-3">
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter v-if="selectedDetail" class="gap-2 sm:justify-between">
          <span class="text-xs text-muted-foreground">
            Status: <strong class="text-amber-600">{{ selectedDetail.status }}</strong>
          </span>
          <div class="flex gap-2">
            <Button
              v-if="selectedDetail.status === 'Menunggu HR'"
              variant="outline"
              class="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              @click="openRejectModal(selectedDetail)"
            >
              Tolak
            </Button>
            <Button v-if="selectedDetail.status === 'Menunggu HR'" @click="openApproveModal(selectedDetail)">
              Setuju
            </Button>
            <Button variant="secondary" @click="isDetailModalOpen = false">
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: MANUAL LEAVE -->
    <Dialog v-model:open="showManualModal">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pengajuan Cuti Baru</DialogTitle>
          <DialogDescription>Isi rincian permohonan cuti / izin karyawan.</DialogDescription>
        </DialogHeader>

        <div class="space-y-3.5">
          <!-- Employee -->
          <div class="space-y-1.5">
            <Label>Diajukan Untuk <span class="text-destructive">*</span></Label>
            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Select v-model="manualDivisionFilter">
                <SelectTrigger class="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua Divisi">Semua Divisi</SelectItem>
                  <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="Operasional Lapangan">Operasional Lapangan</SelectItem>
                  <SelectItem value="Logistik &amp; Gudang">Logistik &amp; Gudang</SelectItem>
                  <SelectItem value="Operator Alat Berat">Operator Alat Berat</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="ME">ME</SelectItem>
                </SelectContent>
              </Select>

              <div class="relative">
                <Search class="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  v-model="manualSearchQuery"
                  type="text"
                  placeholder="Cari nama atau NIP"
                  class="h-10 pl-9 pr-8"
                  :class="manualErrors.emp ? 'border-destructive' : ''"
                  @input="handleSearchInput"
                  @focus="isEmployeeDropdownOpen = true"
                  @blur="handleSearchBlur"
                />
                <button
                  v-if="manualSearchQuery"
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  @click="clearSelectedEmployee"
                >
                  <X class="size-3.5" />
                </button>

                <div
                  v-if="isEmployeeDropdownOpen"
                  class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 divide-y overflow-y-auto rounded-lg border bg-popover shadow-lg"
                >
                  <div v-if="filteredEmployeesForManual.length === 0" class="p-3 text-center text-xs text-muted-foreground">
                    Tidak ada karyawan yang sesuai
                  </div>
                  <button
                    v-for="emp in filteredEmployeesForManual"
                    :key="emp.empId"
                    type="button"
                    class="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-accent"
                    @mousedown.prevent="selectEmployee(emp)"
                  >
                    <div>
                      <p class="font-medium">{{ emp.empName }}</p>
                      <p class="text-muted-foreground">{{ emp.empId }} • {{ emp.department }}</p>
                    </div>
                    <Badge variant="success">Sisa: {{ emp.remainingQuota }} hari</Badge>
                  </button>
                </div>
              </div>
            </div>
            <p v-if="manualErrors.emp" class="text-xs text-destructive">{{ manualErrors.emp }}</p>
          </div>

          <!-- Leave type -->
          <div class="space-y-1.5">
            <Label>Jenis Cuti <span class="text-destructive">*</span></Label>
            <Select
              :model-value="manualForm.leaveType || undefined"
              @update:model-value="(v) => { manualForm.leaveType = String(v); manualErrors.leaveType = '' }"
            >
              <SelectTrigger class="h-10" :class="manualErrors.leaveType ? 'border-destructive' : ''">
                <SelectValue placeholder="Pilih Jenis Cuti..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
                <SelectItem value="Cuti Sakit">Cuti Sakit</SelectItem>
                <SelectItem value="Izin Khusus">Izin Khusus</SelectItem>
                <SelectItem value="Cuti Melahirkan">Cuti Melahirkan</SelectItem>
                <SelectItem value="Cuti Alasan Penting">Cuti Alasan Penting</SelectItem>
              </SelectContent>
            </Select>
            <p v-if="manualErrors.leaveType" class="text-xs text-destructive">{{ manualErrors.leaveType }}</p>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Tanggal Mulai <span class="text-destructive">*</span></Label>
              <Input
                v-model="manualForm.startDate"
                type="date"
                class="h-10"
                :class="manualErrors.startDate ? 'border-destructive' : ''"
                @change="manualErrors.startDate = ''"
              />
              <p v-if="manualErrors.startDate" class="text-xs text-destructive">{{ manualErrors.startDate }}</p>
            </div>

            <div class="space-y-1.5">
              <Label>Tanggal Selesai <span class="text-destructive">*</span></Label>
              <Input
                v-model="manualForm.endDate"
                type="date"
                class="h-10"
                :class="manualErrors.endDate ? 'border-destructive' : ''"
                @change="manualErrors.endDate = ''"
              />
              <p v-if="manualErrors.endDate" class="text-xs text-destructive">{{ manualErrors.endDate }}</p>
            </div>
          </div>

          <!-- Reason -->
          <div class="space-y-1.5">
            <Label>Alasan Permohonan <span class="text-destructive">*</span></Label>
            <Textarea
              v-model="manualForm.reason"
              rows="3"
              placeholder="Jelaskan keperluan cuti atau izin secara ringkas..."
              :class="manualErrors.reason ? 'border-destructive' : ''"
              @input="manualErrors.reason = ''"
            />
            <p v-if="manualErrors.reason" class="text-xs text-destructive">{{ manualErrors.reason }}</p>
          </div>

          <!-- Attachment -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <Label>Lampiran Pendukung</Label>
              <span class="text-xs text-muted-foreground">Opsional</span>
            </div>

            <div
              class="cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-all"
              :class="isDragging ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30 hover:bg-muted/40'"
              @click="triggerFileInput"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                class="hidden"
                @change="handleFileSelect"
              />

              <div v-if="!manualAttachment" class="flex flex-col items-center">
                <UploadCloud class="mb-1.5 size-7 text-muted-foreground" />
                <p class="text-sm font-medium">Pilih berkas PDF atau JPG</p>
                <p class="text-xs text-muted-foreground">Maksimal file 5 MB</p>
              </div>

              <div v-else class="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2.5 text-left">
                <div class="flex min-w-0 items-center gap-2.5">
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText class="size-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">{{ manualAttachment.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ (manualAttachment.size / 1024).toFixed(1) }} KB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="shrink-0 text-muted-foreground hover:text-destructive"
                  title="Hapus berkas"
                  @click.stop="removeAttachment"
                >
                  <X />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeManualModal">
            Batal
          </Button>
          <Button class="w-full sm:w-auto" @click="submitManualLeave">
            <Send />
            Kirim Permohonan Cuti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
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
