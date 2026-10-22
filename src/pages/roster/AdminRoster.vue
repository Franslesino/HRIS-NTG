<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Building2,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Search,
  RotateCcw,
  Copy,
  Download,
  Plus,
  Save
} from 'lucide-vue-next';
import { mockEmployees, mockOffices, mockDivisions } from '../../data/mockData';
import { toast } from 'vue-sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader.vue';

const route = useRoute();
const router = useRouter();

// Filter State
const selectedKantor = ref('Menara 1 BTN');
const selectedDivisi = ref('');
const selectedMonth = ref('2026-11');
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = ref(10);

const selectedDivisiModel = computed({
  get: () => selectedDivisi.value || 'all',
  set: (value: string) => {
    selectedDivisi.value = value === 'all' ? '' : value;
  },
});

// Toast State
const showToast = (msg: string) => {
  toast.success(msg);
};

const perPageModel = computed({
  get: () => String(perPage.value),
  set: (value: string) => {
    perPage.value = Number(value);
    currentPage.value = 1;
  },
});

// Shift State Map: key: `${empId}_${day}_${shiftId}` => boolean
const shiftState = ref<Record<string, boolean>>({});

// Format Tanggal Jam Realtime
const currentDateTimeStr = computed(() => {
  const now = new Date();
  return now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
});

// Pre-fill demo shifts
onMounted(() => {
  if (route.query.gedung) {
    selectedKantor.value = String(route.query.gedung);
  }
  if (route.query.divisi) {
    selectedDivisi.value = String(route.query.divisi);
  }

  mockEmployees.forEach(emp => {
    for (let d = 1; d <= 28; d++) {
      const shiftNum = (d % 4 === 0) ? 0 : ((d + emp.nama.length) % 3) + 1;
      if (shiftNum > 0) {
        shiftState.value[`${emp.id}_${d}_${shiftNum}`] = true;
      }
    }
  });
});

// Hitung hari & daftar tanggal dalam bulan
const totalDaysInMonth = computed(() => {
  const parts = selectedMonth.value.split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = parseInt(parts[1], 10) || 11;
  return new Date(y, m, 0).getDate();
});

const monthDaysList = computed(() => {
  const parts = selectedMonth.value.split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = parseInt(parts[1], 10) || 11;
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const list = [];

  for (let d = 1; d <= totalDaysInMonth.value; d++) {
    const dow = new Date(y, m - 1, d).getDay();
    list.push({
      dayNum: d,
      dayName: dayNames[dow],
      isWeekend: dow === 0 || dow === 6
    });
  }
  return list;
});

// Filter pegawai
const filteredEmployees = computed(() => {
  return mockEmployees.filter(emp => {
    const matchKantor = !selectedKantor.value || emp.kantor.toLowerCase().includes(selectedKantor.value.toLowerCase()) || selectedKantor.value.toLowerCase().includes(emp.kantor.toLowerCase());
    const matchDivisi = !selectedDivisi.value || emp.divisi === selectedDivisi.value;
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch = !q || emp.nama.toLowerCase().includes(q) || emp.nip.toLowerCase().includes(q);
    return matchKantor && matchDivisi && matchSearch;
  });
});

const totalPages = computed(() => Math.ceil(filteredEmployees.value.length / perPage.value) || 1);

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredEmployees.value.slice(start, start + perPage.value);
});

// Shift Interactions
const isShiftActive = (empId: string, day: number, shiftId: number) => {
  return !!shiftState.value[`${empId}_${day}_${shiftId}`];
};

const toggleShift = (empId: string, day: number, shiftId: number) => {
  const key = `${empId}_${day}_${shiftId}`;
  const current = !!shiftState.value[key];

  [1, 2, 3].forEach(s => {
    delete shiftState.value[`${empId}_${day}_${s}`];
  });

  if (!current) {
    shiftState.value[key] = true;
  }
};

const calculateEmployeeTotal = (empId: string) => {
  let count = 0;
  for (let d = 1; d <= totalDaysInMonth.value; d++) {
    if ([1, 2, 3].some(s => isShiftActive(empId, d, s))) {
      count++;
    }
  }
  return count;
};

const totalSlotsFilled = computed(() => {
  let count = 0;
  filteredEmployees.value.forEach(emp => {
    count += calculateEmployeeTotal(emp.id);
  });
  return count;
});

// Badge Divisi Styling
const getDivisiVariant = (divisi: string): 'info' | 'warning' | 'success' | 'secondary' => {
  if (divisi.includes('Engineering')) return 'info';
  if (divisi.includes('Security')) return 'warning';
  if (divisi.includes('House') || divisi.includes('Cleaning')) return 'success';
  return 'secondary';
};

// Actions
const isCopyConfirmOpen = ref(false);

const copyFromPrevMonth = () => {
  isCopyConfirmOpen.value = true;
};

const executeCopyFromPrevMonth = () => {
  isCopyConfirmOpen.value = false;
  showToast('Pola jadwal berhasil disalin dari bulan lalu!');
};

const resetFilters = () => {
  selectedDivisi.value = '';
  searchQuery.value = '';
  currentPage.value = 1;
  showToast('Pengaturan filter telah direset.');
};

const saveRoster = () => {
  showToast('Roster kerja bulanan berhasil disimpan ke database!');
};

const exportExcel = () => {
  showToast('Mengekspor jadwal roster ke berkas Excel (.xlsx)...');
};
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Roster Kerja Bulanan"
      description="Pengaturan matriks jadwal shift kerja operasional bulanan per gedung dan divisi."
      badge="Matriks Shift"
      badge-variant="info"
      :breadcrumbs="[{ label: 'Roster' }, { label: 'Roster Kerja Bulanan' }]"
    >
      <template #actions>
        <Button variant="outline" @click="resetFilters">
          <RotateCcw />
          Reset
        </Button>
        <Button variant="outline" @click="copyFromPrevMonth">
          <Copy />
          Salin Bulan Lalu
        </Button>
        <Button variant="outline" @click="exportExcel">
          <Download />
          Ekspor Excel
        </Button>
        <Button as-child>
          <router-link to="/roster/tambah">
            <Plus />
            Tambah Jadwal
          </router-link>
        </Button>
      </template>
    </PageHeader>

    <!-- FILTER -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-base">Filter Penjadwalan</CardTitle>
        <CardDescription>
          Pilih gedung, divisi, dan periode bulan sebelum menyusun matriks shift.
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="space-y-1.5">
            <Label>Gedung / Lokasi <span class="text-destructive">*</span></Label>
            <Select v-model="selectedKantor">
              <SelectTrigger class="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Menara 1 BTN">Menara 1 BTN - Jakarta Pusat</SelectItem>
                <SelectItem value="Kantor Pusat BMIS">Kantor Pusat BMIS - Jakarta Selatan</SelectItem>
                <SelectItem value="Gedung Arsip Cibubur">Gedung Arsip - Cibubur</SelectItem>
                <SelectItem value="Gedung R">Gedung R</SelectItem>
                <SelectItem value="Gedung Q">Gedung Q</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Divisi / Bagian <span class="text-destructive">*</span></Label>
            <Select v-model="selectedDivisiModel">
              <SelectTrigger class="h-9">
                <SelectValue placeholder="Semua Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Divisi di Gedung Ini</SelectItem>
                <SelectItem value="Engineering">Engineering (ME)</SelectItem>
                <SelectItem value="Security">Security / Pengamanan</SelectItem>
                <SelectItem value="House Keeping">House Keeping / Cleaning</SelectItem>
                <SelectItem value="Cleaning Service">Cleaning Service</SelectItem>
                <SelectItem value="Manajemen Operasional">Manajemen Operasional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Bulan Roster</Label>
            <Input v-model="selectedMonth" type="month" class="h-9" />
          </div>

          <div class="space-y-1.5">
            <Label>Cari Nama Pegawai</Label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                type="search"
                placeholder="Ketik nama atau NIP..."
                class="h-9 pl-9"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1.5">
              <span class="flex size-4 items-center justify-center rounded bg-amber-500 text-[9px] font-bold text-white">P</span>
              <strong class="font-medium text-foreground">Shift 1 (Pagi)</strong> 07.00–15.00
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="flex size-4 items-center justify-center rounded bg-blue-500 text-[9px] font-bold text-white">S</span>
              <strong class="font-medium text-foreground">Shift 2 (Siang)</strong> 15.00–23.00
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="flex size-4 items-center justify-center rounded bg-violet-500 text-[9px] font-bold text-white">M</span>
              <strong class="font-medium text-foreground">Shift 3 (Malam)</strong> 23.00–07.00
            </span>
          </div>

          <Button @click="saveRoster">
            <Save />
            Simpan Roster
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- MATRIX -->
    <Card class="overflow-hidden">
      <CardHeader class="flex flex-col gap-2 space-y-0 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <CardTitle class="text-base">Matriks Roster Shift</CardTitle>
          <CardDescription>
            Status: {{ currentDateTimeStr }} • Lokasi:
            <strong class="font-medium text-foreground">{{ selectedKantor }}</strong>
          </CardDescription>
        </div>
        <Badge variant="info">
          Total slot terisi: {{ totalSlotsFilled.toLocaleString('id-ID') }}
        </Badge>
      </CardHeader>

      <CardContent class="px-0">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1000px] border-collapse text-left text-xs">
            <thead>
              <tr class="border-b bg-muted/60">
                <th class="sticky left-0 z-20 w-[42px] min-w-[42px] border-r bg-muted px-2 py-2.5 text-center font-medium">
                  #
                </th>
                <th class="sticky left-[42px] z-20 w-[190px] min-w-[190px] border-r bg-muted px-3 py-2.5 font-medium">
                  Nama &amp; NIP Pegawai
                </th>
                <th class="sticky left-[232px] z-20 w-[145px] min-w-[145px] border-r bg-muted px-3 py-2.5 font-medium">
                  Jabatan / Divisi
                </th>
                <th class="sticky left-[377px] z-20 w-[56px] min-w-[56px] border-r-2 bg-muted px-2 py-2.5 text-center font-semibold text-primary">
                  Total
                </th>

                <th
                  v-for="d in monthDaysList"
                  :key="'th-day-' + d.dayNum"
                  class="w-[46px] min-w-[46px] select-none border-r px-1 py-1.5 text-center font-medium"
                  :class="d.isWeekend ? 'bg-amber-50 text-amber-700' : 'bg-muted/60'"
                >
                  <div class="text-xs font-semibold leading-tight">{{ d.dayNum }}</div>
                  <div class="text-[9px] font-medium uppercase text-muted-foreground">{{ d.dayName }}</div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="paginatedEmployees.length === 0">
                <td :colspan="4 + monthDaysList.length" class="py-10 text-center text-sm text-muted-foreground">
                  Tidak ada data pegawai yang sesuai dengan filter lokasi atau divisi ini.
                </td>
              </tr>

              <tr
                v-for="(emp, idx) in paginatedEmployees"
                :key="emp.id"
                class="border-b transition-colors hover:bg-muted/30"
              >
                <td class="sticky left-0 z-10 border-r bg-card px-2 py-2 text-center font-medium text-muted-foreground">
                  {{ (currentPage - 1) * perPage + idx + 1 }}
                </td>

                <td class="sticky left-[42px] z-10 border-r bg-card px-3 py-2">
                  <div class="max-w-[170px] truncate text-xs font-medium leading-tight" :title="emp.nama">
                    {{ emp.nama }}
                  </div>
                  <div class="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {{ emp.nip }}
                  </div>
                </td>

                <td class="sticky left-[232px] z-10 border-r bg-card px-3 py-2">
                  <div class="max-w-[130px] truncate text-[11px] font-medium" :title="emp.jabatan">
                    {{ emp.jabatan }}
                  </div>
                  <Badge :variant="getDivisiVariant(emp.divisi)" class="mt-1 text-[10px]">
                    {{ emp.divisi }}
                  </Badge>
                </td>

                <td class="sticky left-[377px] z-10 border-r-2 bg-muted/40 px-2 py-2 text-center text-[13px] font-semibold text-primary">
                  {{ calculateEmployeeTotal(emp.id) }}
                </td>

                <td
                  v-for="d in monthDaysList"
                  :key="'cell-' + emp.id + '-' + d.dayNum"
                  class="border-r px-0.5 py-1 text-center align-middle"
                  :class="d.isWeekend ? 'bg-amber-50/40' : ''"
                >
                  <div class="flex flex-col items-center justify-center gap-0.5">
                    <button
                      type="button"
                      class="flex size-[22px] items-center justify-center rounded border text-[9px] font-bold transition-all"
                      :class="isShiftActive(emp.id, d.dayNum, 1)
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-border bg-background text-muted-foreground hover:border-amber-400 hover:text-amber-600'"
                      title="Shift 1 (Pagi 07.00-15.00)"
                      @click="toggleShift(emp.id, d.dayNum, 1)"
                    >
                      P
                    </button>

                    <button
                      type="button"
                      class="flex size-[22px] items-center justify-center rounded border text-[9px] font-bold transition-all"
                      :class="isShiftActive(emp.id, d.dayNum, 2)
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-border bg-background text-muted-foreground hover:border-blue-400 hover:text-blue-600'"
                      title="Shift 2 (Siang 15.00-23.00)"
                      @click="toggleShift(emp.id, d.dayNum, 2)"
                    >
                      S
                    </button>

                    <button
                      type="button"
                      class="flex size-[22px] items-center justify-center rounded border text-[9px] font-bold transition-all"
                      :class="isShiftActive(emp.id, d.dayNum, 3)
                        ? 'border-violet-500 bg-violet-500 text-white'
                        : 'border-border bg-background text-muted-foreground hover:border-violet-400 hover:text-violet-600'"
                      title="Shift 3 (Malam 23.00-07.00)"
                      @click="toggleShift(emp.id, d.dayNum, 3)"
                    >
                      M
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t px-6 pt-3 text-xs text-muted-foreground">
          <div class="flex flex-wrap items-center gap-2">
            <span>Menampilkan {{ paginatedEmployees.length }} dari {{ filteredEmployees.length }} pegawai</span>
            <span class="text-border">•</span>
            <span>Baris per halaman:</span>
            <Select v-model="perPageModel">
              <SelectTrigger class="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="25">25</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" :disabled="currentPage === 1" @click="currentPage--">
              <ChevronLeft />
            </Button>

            <Button
              v-for="p in totalPages"
              :key="p"
              size="icon-sm"
              :variant="currentPage === p ? 'default' : 'outline'"
              @click="currentPage = p"
            >
              {{ p }}
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- CONFIRM COPY PREVIOUS MONTH -->
    <AlertDialog v-model:open="isCopyConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Salin Pola Rotasi Shift?</AlertDialogTitle>
          <AlertDialogDescription>
            Pola jadwal dari bulan sebelumnya akan disalin ke bulan ini. Perubahan yang belum
            disimpan pada roster bulan ini dapat tertimpa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction @click="executeCopyFromPrevMonth">
            Ya, Salin Pola
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
