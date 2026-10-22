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
import { toast } from 'vue-sonner';
import { useAttendanceStore, getTodayDateStr } from '../../composables/useAttendanceStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatCard from '@/components/shared/StatCard.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import EmptyState from '@/components/shared/EmptyState.vue';

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

// Chart State
const chartView = ref<'harian' | 'mingguan'>('mingguan');
const chartDataPoints = computed(() => {
  if (chartView.value === 'harian') {
    return [
      { label: '07:00', value: 88 },
      { label: '08:00', value: 94 },
      { label: '09:00', value: 96 },
      { label: '13:00', value: 95 },
      { label: '17:00', value: 92 },
    ];
  }
  return [
    { label: 'Sen', value: 90 },
    { label: 'Sel', value: 95 },
    { label: 'Rab', value: 92 },
    { label: 'Kam', value: 96 },
    { label: 'Jum', value: 88 },
  ];
});

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
const showToast = (msg: string) => {
  toast.success(msg);
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

const deleteConfirmOpen = ref(false);
const recordToDelete = ref<any>(null);

const handleDeleteEmployeeRecord = (emp: any) => {
  recordToDelete.value = emp;
  isDetailModalOpen.value = false;
  deleteConfirmOpen.value = true;
};

const executeDeleteEmployeeRecord = () => {
  const emp = recordToDelete.value;
  if (!emp) return;

  const empName = emp.name || emp.employee_name;
  const targetId = emp.id || emp.raw?.user_id;

  deleteRecord(targetId);
  if (isDetailModalOpen.value && selectedEmployee.value?.id === emp.id) {
    isDetailModalOpen.value = false;
  }
  showToast(`Data presensi ${empName} berhasil dihapus.`);

  deleteConfirmOpen.value = false;
  recordToDelete.value = null;
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
  <div class="space-y-6">
    <PageHeader
      title="Monitoring Kehadiran"
      description="Gambaran umum kehadiran, ketepatan waktu, dan cuti karyawan."
      :breadcrumbs="[{ label: 'Absensi' }, { label: 'Monitoring Kehadiran' }]"
    >
      <template #actions>
        <Button variant="outline" @click="handleExport">
          <Download />
          Ekspor Laporan
        </Button>
        <Button @click="openManualModal">
          <PlusCircle />
          Masuk Manual
        </Button>
      </template>
    </PageHeader>

    <!-- FILTER -->
    <Card>
      <CardContent class="grid grid-cols-1 items-end gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label>Tanggal Presensi</Label>
            <button
              type="button"
              class="text-xs font-medium text-primary underline-offset-4 hover:underline"
              @click="isFilterDateActive = !isFilterDateActive"
            >
              {{ isFilterDateActive ? 'Lihat Semua' : 'Filter Tanggal' }}
            </button>
          </div>
          <Input
            v-model="filterDate"
            type="date"
            :disabled="!isFilterDateActive"
            class="h-9"
          />
        </div>

        <div class="space-y-1.5">
          <Label>Departemen / Role</Label>
          <Select v-model="filterDept">
            <SelectTrigger class="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in deptOptions" :key="opt.value" :value="opt.value">
                {{ opt.text }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label>Status Kehadiran</Label>
          <Select v-model="filterStatus">
            <SelectTrigger class="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in statusFilterOptions" :key="opt.value" :value="opt.value">
                {{ opt.text }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button class="h-9 w-full" @click="applyFilters">
          <Filter />
          Terapkan Filter
        </Button>
      </CardContent>
    </Card>

    <!-- STATS + CHART -->
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <StatCard
          title="Rata-rata Kehadiran"
          :value="attendancePercentText"
          :hint="`Total ${summary.total_karyawan} karyawan terdaftar`"
          :icon="Users"
        />
        <StatCard
          title="Total Keterlambatan"
          :value="summary.terlambat"
          hint="Karyawan terlambat hari ini"
          :icon="Clock"
        />
      </div>

      <Card class="lg:col-span-2">
        <CardHeader class="flex flex-row items-start justify-between space-y-0">
          <div class="space-y-1">
            <CardTitle>Tren Kehadiran</CardTitle>
            <CardDescription>Persentase kehadiran berdasarkan periode.</CardDescription>
          </div>
          <Tabs v-model="chartView">
            <TabsList class="h-8">
              <TabsTrigger value="harian" class="text-xs">Harian</TabsTrigger>
              <TabsTrigger value="mingguan" class="text-xs">Mingguan</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div class="flex h-[190px] items-end justify-between gap-3 border-b pb-3">
            <div
              v-for="(item, i) in chartDataPoints"
              :key="i"
              class="flex h-full flex-1 flex-col items-center justify-end"
            >
              <div class="flex h-[140px] w-full max-w-[40px] items-end overflow-hidden rounded-t-md bg-muted">
                <div
                  class="w-full rounded-t-md bg-primary transition-all duration-500"
                  :style="{ height: `${item.value}%` }"
                  :title="`${item.label}: ${item.value}%`"
                />
              </div>
              <span class="mt-2 text-xs text-muted-foreground">{{ item.label }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- TABLE -->
    <Card>
      <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <CardTitle>Detail Riwayat</CardTitle>
          <CardDescription>
            Menampilkan {{ filteredEmployees.length }} dari {{ totalEmployees }} entri
          </CardDescription>
        </div>
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Cari nama atau NIP..."
          class="h-9 sm:w-[240px]"
        />
      </CardHeader>
      <CardContent class="px-0">
        <Table v-if="filteredEmployees.length">
          <TableHeader>
            <TableRow>
              <TableHead class="pl-6">Nama Karyawan</TableHead>
              <TableHead>Gedung / Departemen</TableHead>
              <TableHead>Kehadiran</TableHead>
              <TableHead>Terlambat</TableHead>
              <TableHead>Tidak Hadir</TableHead>
              <TableHead>Status / Catatan</TableHead>
              <TableHead class="pr-6 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(emp, idx) in filteredEmployees" :key="idx">
              <TableCell class="pl-6">
                <div class="flex items-center gap-3">
                  <div class="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {{ getInitials(emp.name) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium">{{ emp.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ emp.code }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{{ emp.gedung }}</TableCell>
              <TableCell class="font-medium">{{ emp.kehadiran }}</TableCell>
              <TableCell>
                <span :class="emp.terlambat !== '0m' ? 'font-medium text-destructive' : 'text-muted-foreground'">
                  {{ emp.terlambat }}
                </span>
              </TableCell>
              <TableCell>{{ emp.tidakHadir }}</TableCell>
              <TableCell>
                <div class="flex flex-col items-start gap-1">
                  <StatusBadge :status="emp.raw.status" />
                  <span class="max-w-[200px] truncate text-xs text-muted-foreground" :title="emp.catatan">
                    {{ emp.catatan }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="pr-6">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="outline" size="sm" @click="viewDetail(emp)">
                    Detail
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="text-muted-foreground hover:text-destructive"
                    title="Hapus record presensi"
                    @click="handleDeleteEmployeeRecord(emp)"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div v-else class="px-6 pb-6">
          <EmptyState
            title="Tidak ada data presensi"
            description="Coba ubah filter tanggal, departemen, atau status."
            :icon="Users"
          />
        </div>

        <div class="flex flex-col gap-3 border-t px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span class="text-xs text-muted-foreground">
            Halaman {{ currentPage }} dari {{ totalPages }}
          </span>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" :disabled="currentPage === 1" @click="currentPage--">
              <ChevronLeft />
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" :disabled="currentPage >= totalPages" @click="currentPage++">
              Berikutnya
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- DIALOG: MANUAL ATTENDANCE -->
    <Dialog v-model:open="isManualModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Input Presensi Manual</DialogTitle>
          <DialogDescription>Catat kehadiran karyawan secara manual.</DialogDescription>
        </DialogHeader>

        <form class="space-y-3.5" @submit.prevent="submitManualAttendance">
          <div class="space-y-1.5">
            <Label>Pilih Karyawan</Label>
            <Select v-model="manualForm.employeeId">
              <SelectTrigger>
                <SelectValue placeholder="Pilih karyawan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="u in allRecords"
                  :key="String(u.user_id)"
                  :value="String(u.user_id)"
                >
                  {{ u.employee_name }} ({{ u.employee_code }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Tanggal Presensi</Label>
            <Input v-model="manualForm.date" type="date" required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label>Jam Masuk</Label>
              <Input v-model="manualForm.checkIn" type="time" required />
            </div>
            <div class="space-y-1.5">
              <Label>Jam Keluar</Label>
              <Input v-model="manualForm.checkOut" type="time" required />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Status Presensi</Label>
            <Select v-model="manualForm.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.text }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Catatan / Alasan Manual</Label>
            <Textarea
              v-model="manualForm.notes"
              rows="3"
              placeholder="Masukkan catatan penginputan manual oleh admin..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="closeManualModal">
              Batal
            </Button>
            <Button type="submit">
              Simpan Presensi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: DETAIL -->
    <Dialog v-model:open="isDetailModalOpen">
      <DialogContent class="sm:max-w-xl">
        <DialogHeader v-if="selectedEmployee">
          <DialogTitle>Riwayat Kehadiran — {{ selectedEmployee.name }}</DialogTitle>
          <DialogDescription>
            {{ selectedEmployee.gedung }} • {{ selectedEmployee.code }}
          </DialogDescription>
        </DialogHeader>

        <Table v-if="selectedEmployee">
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Check-In</TableHead>
              <TableHead>Check-Out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="whitespace-nowrap">{{ formatDayDate(0) }}</TableCell>
              <TableCell>{{ selectedEmployee?.raw?.check_in ? `${selectedEmployee.raw.check_in} WIB` : '08:15 WIB' }}</TableCell>
              <TableCell>{{ selectedEmployee?.raw?.check_out ? `${selectedEmployee.raw.check_out} WIB` : '17:00 WIB' }}</TableCell>
              <TableCell>
                <StatusBadge :status="selectedEmployee?.raw?.status === 'LATE' ? 'LATE' : 'ON_TIME'" />
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ selectedEmployee?.raw?.notes || (selectedEmployee?.raw?.status === 'LATE' ? `Keterlambatan ${selectedEmployee.raw.late_duration_minutes}m` : 'Hadir Tepat Waktu') }}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="whitespace-nowrap">{{ formatDayDate(1) }}</TableCell>
              <TableCell>08:00 WIB</TableCell>
              <TableCell>17:00 WIB</TableCell>
              <TableCell><StatusBadge status="ON_TIME" /></TableCell>
              <TableCell class="text-xs text-muted-foreground">Presensi normal sesuai jadwal</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <DialogFooter class="sm:justify-between">
          <Button variant="outline" class="text-destructive hover:text-destructive" @click="handleDeleteEmployeeRecord(selectedEmployee)">
            <Trash2 />
            Hapus Record
          </Button>
          <div class="flex gap-2">
            <Button
              v-if="selectedEmployee?.raw?.status === 'LATE' && !selectedEmployee?.catatan?.includes('(Disetujui Admin)')"
              variant="success"
              @click="handleApproveLateNote(selectedEmployee)"
            >
              <Check />
              Setujui Alasan
            </Button>
            <Button @click="isDetailModalOpen = false">
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- CONFIRM DELETE -->
    <AlertDialog v-model:open="deleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Record Presensi?</AlertDialogTitle>
          <AlertDialogDescription>
            Data presensi
            <strong class="font-medium text-foreground">
              {{ recordToDelete?.name || recordToDelete?.employee_name }}
            </strong>
            akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="recordToDelete = null">Batal</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="executeDeleteEmployeeRecord"
          >
            Ya, Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
