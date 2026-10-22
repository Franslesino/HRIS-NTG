<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Building2,
  Users,
  Search,
  Check,
  Calendar,
  Save,
  CheckCircle2,
  Info,
  X,
  RotateCcw
} from 'lucide-vue-next';
import { mockEmployees, mockOffices, mockDivisions } from '../../data/mockData';
import { toast } from 'vue-sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader.vue';

const router = useRouter();

// Form State
const selectedKantor = ref('Menara 1 BTN');
const selectedKelompok = ref('Security');
const selectedMonth = ref('2026-11');
const filterJabatan = ref('');
const searchEmp = ref('');

// Multi-select Karyawan (IDs)
const selectedEmpIds = ref<string[]>(['e101', 'e102']);

// Kode Shift: 1 (P), 2 (S), 3 (M), 0 (OFF)
const selectedShiftCode = ref<number>(1);

// Multi-select Tanggal (Array angka tanggal)
const selectedDates = ref<number[]>([1, 2, 3, 4, 5, 8, 9, 10, 11, 12]);

// Toast
const showToast = (msg: string) => {
  toast.success(msg);
};

// Karyawan Tersedia sesuai Kantor & Kelompok
const filteredEmployees = computed(() => {
  return mockEmployees.filter(emp => {
    const matchKantor = !selectedKantor.value || emp.kantor.toLowerCase().includes(selectedKantor.value.toLowerCase()) || selectedKantor.value.toLowerCase().includes(emp.kantor.toLowerCase());
    const matchKelompok = !selectedKelompok.value || emp.divisi === selectedKelompok.value;
    const matchJabatan = !filterJabatan.value || emp.jabatan.toLowerCase().includes(filterJabatan.value.toLowerCase());
    const q = searchEmp.value.toLowerCase().trim();
    const matchSearch = !q || emp.nama.toLowerCase().includes(q) || emp.nip.toLowerCase().includes(q);
    return matchKantor && matchKelompok && matchJabatan && matchSearch;
  });
});

const isAllSelected = computed(() => {
  return filteredEmployees.value.length > 0 &&
    filteredEmployees.value.every(e => selectedEmpIds.value.includes(e.id));
});

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    const newIds = new Set([...selectedEmpIds.value, ...filteredEmployees.value.map(e => e.id)]);
    selectedEmpIds.value = Array.from(newIds);
  } else {
    const currentFilteredIds = new Set(filteredEmployees.value.map(e => e.id));
    selectedEmpIds.value = selectedEmpIds.value.filter(id => !currentFilteredIds.has(id));
  }
};

const toggleEmployee = (id: string) => {
  const idx = selectedEmpIds.value.indexOf(id);
  if (idx > -1) {
    selectedEmpIds.value.splice(idx, 1);
  } else {
    selectedEmpIds.value.push(id);
  }
};

const removeSelectedEmp = (id: string) => {
  const idx = selectedEmpIds.value.indexOf(id);
  if (idx > -1) {
    selectedEmpIds.value.splice(idx, 1);
  }
};

const clearAllSelectedEmp = () => {
  selectedEmpIds.value = [];
};

const selectedEmployeesList = computed(() => {
  return mockEmployees.filter(e => selectedEmpIds.value.includes(e.id));
});

// Kalender Hari dalam Bulan Terpilih
const totalDaysInMonth = computed(() => {
  const parts = selectedMonth.value.split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = parseInt(parts[1], 10) || 11;
  return new Date(y, m, 0).getDate();
});

const calendarDays = computed(() => {
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
      isWeekend: dow === 0 || dow === 6,
    });
  }
  return list;
});

const toggleDate = (d: number) => {
  const idx = selectedDates.value.indexOf(d);
  if (idx > -1) {
    selectedDates.value.splice(idx, 1);
  } else {
    selectedDates.value.push(d);
  }
};

const selectWorkdaysOnly = () => {
  const workdays = calendarDays.value.filter(d => !d.isWeekend).map(d => d.dayNum);
  selectedDates.value = workdays;
};

const selectFullMonth = () => {
  const allDays = calendarDays.value.map(d => d.dayNum);
  selectedDates.value = allDays;
};

const resetDates = () => {
  selectedDates.value = [];
};

// Shift Info Helper
const getShiftName = (code: number) => {
  switch (code) {
    case 1: return 'Shift 1 (Pagi 07.00 - 15.00)';
    case 2: return 'Shift 2 (Siang 15.00 - 23.00)';
    case 3: return 'Shift 3 (Malam 23.00 - 07.00)';
    default: return 'Libur (Hari Lepas / OFF)';
  }
};

// Submit
const handleSubmit = () => {
  if (selectedEmpIds.value.length === 0) {
    toast.warning('Harap pilih minimal 1 karyawan pada Langkah 3!');
    return;
  }
  if (selectedDates.value.length === 0) {
    toast.warning('Harap pilih minimal 1 tanggal pada grid kalender Langkah 6!');
    return;
  }

  showToast(`Berhasil menyimpan penugasan shift untuk ${selectedEmpIds.value.length} karyawan (${selectedDates.value.length} hari)!`);
  setTimeout(() => {
    router.push({ name: 'AdminRoster' });
  }, 1200);
};

const goBack = () => {
  router.push({ name: 'AdminRoster' });
};
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Tambah Jadwal Shift Karyawan"
      description="Susun penugasan shift karyawan per kantor, kelompok kerja, dan periode bulan dalam satu alur enam langkah."
      badge="Form Penugasan"
      badge-variant="info"
      :breadcrumbs="[
        { label: 'Roster', to: '/roster/tim' },
        { label: 'Data Roster Karyawan', to: '/roster/admin' },
        { label: 'Tambah Jadwal Shift' },
      ]"
    >
      <template #actions>
        <Button variant="outline" @click="goBack">
          <X />
          Batalkan
        </Button>
      </template>
    </PageHeader>

    <!-- NOTICE -->
    <div class="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed">
      <Info class="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        <strong class="font-semibold">Optimasi Skala 3.000+ Karyawan:</strong>
        Pilih <strong class="font-semibold">Kantor</strong> dan
        <strong class="font-semibold">Kelompok Pegawai</strong> terlebih dahulu agar sistem hanya
        memuat personel terkait tanpa membebani browser dan server.
      </p>
    </div>

    <!-- FORM -->
    <Card class="overflow-hidden">
      <div class="h-[3px] bg-gradient-to-r from-primary to-secondary" />

      <CardContent class="space-y-6 pt-6">
        <!-- STEP 1 & 2 -->
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div class="space-y-1.5">
            <Label>1. Pilih Kantor / Lokasi Penugasan <span class="text-destructive">*</span></Label>
            <Select v-model="selectedKantor">
              <SelectTrigger>
                <Building2 class="mr-1 size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="loc in mockOffices" :key="loc" :value="loc">{{ loc }}</SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">
              Langkah awal untuk menyaring unit penempatan gedung.
            </p>
          </div>

          <div class="space-y-1.5">
            <Label>2. Kelompok Pegawai / Divisi <span class="text-destructive">*</span></Label>
            <Select v-model="selectedKelompok">
              <SelectTrigger>
                <Users class="mr-1 size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Security">Security / Pengamanan</SelectItem>
                <SelectItem value="Engineering">Engineering (ME / Gedung)</SelectItem>
                <SelectItem value="House Keeping">House Keeping / Kebersihan</SelectItem>
                <SelectItem value="Cleaning Service">Cleaning Service</SelectItem>
                <SelectItem value="Manajemen Operasional">Manajemen Operasional</SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">
              Tentukan divisi atau kelompok kerja penugasan.
            </p>
          </div>
        </div>

        <!-- STEP 3 & 4 -->
        <div class="grid grid-cols-1 gap-5 border-t pt-5 lg:grid-cols-12">
          <div class="space-y-2 lg:col-span-7">
            <div class="flex items-center justify-between">
              <Label>3. Pilih Karyawan (Nama Pegawai) <span class="text-destructive">*</span></Label>
              <Badge variant="success">{{ selectedEmpIds.length }} Terpilih</Badge>
            </div>

            <div class="overflow-hidden rounded-lg border">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 p-2.5 text-xs">
                <label class="inline-flex cursor-pointer items-center gap-2 font-medium">
                  <Checkbox
                    :model-value="isAllSelected"
                    @update:model-value="(v) => toggleSelectAll(v === true)"
                  />
                  <span>Pilih Semua ({{ filteredEmployees.length }})</span>
                </label>

                <div class="relative w-full max-w-[220px]">
                  <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input v-model="searchEmp" type="search" placeholder="Cari pegawai..." class="h-8 pl-8" />
                </div>
              </div>

              <div class="max-h-56 divide-y overflow-y-auto p-1">
                <label
                  v-for="emp in filteredEmployees"
                  :key="emp.id"
                  class="flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  :class="selectedEmpIds.includes(emp.id) ? 'bg-primary/5' : ''"
                  @click="toggleEmployee(emp.id)"
                >
                  <div class="flex items-center gap-2.5">
                    <span @click.stop>
                      <Checkbox
                        :model-value="selectedEmpIds.includes(emp.id)"
                        @update:model-value="toggleEmployee(emp.id)"
                      />
                    </span>
                    <div class="flex size-7 items-center justify-center rounded-full bg-slate-600 text-[10px] font-semibold text-white">
                      {{ emp.nama.split(' ').map((n) => n[0]).slice(0, 2).join('') }}
                    </div>
                    <div>
                      <p class="text-xs font-medium">{{ emp.nama }}</p>
                      <p class="text-xs text-muted-foreground">{{ emp.nip }} • {{ emp.jabatan }}</p>
                    </div>
                  </div>

                  <Badge variant="secondary" class="text-[10px]">{{ emp.divisi }}</Badge>
                </label>

                <div v-if="filteredEmployees.length === 0" class="p-6 text-center text-xs text-muted-foreground">
                  Tidak ada karyawan yang sesuai filter di atas.
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3 lg:col-span-5">
            <div class="space-y-1.5">
              <Label>4. Filter Jabatan Spesifik</Label>
              <Input v-model="filterJabatan" type="text" placeholder="Contoh: Danru / Teknisi / Staff..." />
            </div>

            <div class="space-y-2 rounded-lg border bg-muted/40 p-3">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium">Karyawan Terpilih:</span>
                <button
                  v-if="selectedEmpIds.length > 0"
                  type="button"
                  class="text-xs font-medium text-destructive hover:underline"
                  @click="clearAllSelectedEmp"
                >
                  Hapus Semua Pilihan
                </button>
              </div>

              <div class="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                <span
                  v-for="emp in selectedEmployeesList"
                  :key="emp.id"
                  class="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium shadow-sm"
                >
                  <span>{{ emp.nama }}</span>
                  <button
                    type="button"
                    class="font-semibold text-muted-foreground hover:text-destructive"
                    @click="removeSelectedEmp(emp.id)"
                  >
                    ×
                  </button>
                </span>

                <div v-if="selectedEmpIds.length === 0" class="py-2 text-xs italic text-muted-foreground">
                  Belum ada karyawan yang dipilih.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 5 & 6 -->
        <div class="grid grid-cols-1 gap-5 border-t pt-5 lg:grid-cols-12">
          <div class="space-y-4 lg:col-span-5">
            <div class="space-y-1.5">
              <Label>5. Periode Bulan Penugasan</Label>
              <Input v-model="selectedMonth" type="month" />
            </div>

            <div class="space-y-2">
              <Label>Kode Shift Penugasan</Label>

              <label
                class="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all"
                :class="selectedShiftCode === 1 ? 'border-amber-400 bg-amber-50' : 'hover:bg-muted/50'"
              >
                <div class="flex items-center gap-3">
                  <input v-model="selectedShiftCode" type="radio" :value="1" class="size-4 accent-amber-500" />
                  <span class="flex size-6 items-center justify-center rounded bg-amber-500 text-xs font-bold text-white">P</span>
                  <div>
                    <p class="text-xs font-medium">Shift 1 (Pagi)</p>
                    <p class="text-xs text-muted-foreground">07.00 – 15.00 WIB</p>
                  </div>
                </div>
                <Check v-if="selectedShiftCode === 1" class="size-4 text-amber-500" />
              </label>

              <label
                class="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all"
                :class="selectedShiftCode === 2 ? 'border-blue-400 bg-blue-50' : 'hover:bg-muted/50'"
              >
                <div class="flex items-center gap-3">
                  <input v-model="selectedShiftCode" type="radio" :value="2" class="size-4 accent-blue-500" />
                  <span class="flex size-6 items-center justify-center rounded bg-blue-500 text-xs font-bold text-white">S</span>
                  <div>
                    <p class="text-xs font-medium">Shift 2 (Siang)</p>
                    <p class="text-xs text-muted-foreground">15.00 – 23.00 WIB</p>
                  </div>
                </div>
                <Check v-if="selectedShiftCode === 2" class="size-4 text-blue-500" />
              </label>

              <label
                class="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all"
                :class="selectedShiftCode === 3 ? 'border-violet-400 bg-violet-50' : 'hover:bg-muted/50'"
              >
                <div class="flex items-center gap-3">
                  <input v-model="selectedShiftCode" type="radio" :value="3" class="size-4 accent-violet-500" />
                  <span class="flex size-6 items-center justify-center rounded bg-violet-500 text-xs font-bold text-white">M</span>
                  <div>
                    <p class="text-xs font-medium">Shift 3 (Malam)</p>
                    <p class="text-xs text-muted-foreground">23.00 – 07.00 WIB</p>
                  </div>
                </div>
                <Check v-if="selectedShiftCode === 3" class="size-4 text-violet-500" />
              </label>

              <label
                class="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all"
                :class="selectedShiftCode === 0 ? 'border-slate-400 bg-muted' : 'hover:bg-muted/50'"
              >
                <div class="flex items-center gap-3">
                  <input v-model="selectedShiftCode" type="radio" :value="0" class="size-4 accent-slate-500" />
                  <span class="flex size-6 items-center justify-center rounded bg-slate-500 text-[10px] font-bold text-white">OFF</span>
                  <div>
                    <p class="text-xs font-medium">Libur / OFF</p>
                    <p class="text-xs text-muted-foreground">Hari Lepas Tugas</p>
                  </div>
                </div>
                <Check v-if="selectedShiftCode === 0" class="size-4 text-slate-500" />
              </label>
            </div>
          </div>

          <div class="space-y-3 lg:col-span-7">
            <div class="flex items-center justify-between">
              <Label>6. Pilih Tanggal Penugasan (Bisa Pilih Banyak) <span class="text-destructive">*</span></Label>
              <Badge variant="success">{{ selectedDates.length }} Hari Terpilih</Badge>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="xs" @click="selectWorkdaysOnly">
                Pilih Hari Kerja Saja (Sen–Jum)
              </Button>
              <Button variant="outline" size="xs" @click="selectFullMonth">
                Pilih Sebulan Penuh
              </Button>
              <Button
                variant="outline"
                size="xs"
                class="text-destructive hover:bg-destructive/10 hover:text-destructive"
                @click="resetDates"
              >
                <RotateCcw />
                Reset Tanggal
              </Button>
            </div>

            <div class="rounded-lg border p-3">
              <div class="grid grid-cols-7 gap-1.5 text-center">
                <div
                  v-for="d in ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']"
                  :key="d"
                  class="py-1 text-[10px] font-medium text-muted-foreground"
                >
                  {{ d }}
                </div>

                <button
                  v-for="day in calendarDays"
                  :key="day.dayNum"
                  type="button"
                  class="flex h-10 flex-col items-center justify-center rounded-lg border text-xs font-semibold transition-all"
                  :class="selectedDates.includes(day.dayNum)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : day.isWeekend
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-border hover:bg-muted'"
                  @click="toggleDate(day.dayNum)"
                >
                  <span class="leading-none">{{ day.dayNum }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SUMMARY -->
        <div class="flex flex-col justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs sm:flex-row sm:items-center">
          <div class="space-y-0.5">
            <p class="text-sm font-semibold">Ringkasan Penugasan:</p>
            <p>
              <strong class="font-semibold">{{ selectedEmpIds.length }} Karyawan</strong> di
              <strong class="font-semibold">{{ selectedKantor }}</strong> akan ditugaskan
              <strong class="font-semibold">{{ getShiftName(selectedShiftCode) }}</strong> selama
              <strong class="font-semibold">{{ selectedDates.length }} hari</strong> pada periode
              {{ selectedMonth }}.
            </p>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="flex items-center justify-end gap-3 border-t pt-3">
          <Button variant="outline" @click="goBack">
            Batal
          </Button>
          <Button @click="handleSubmit">
            <Save />
            Simpan Penugasan Shift
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
