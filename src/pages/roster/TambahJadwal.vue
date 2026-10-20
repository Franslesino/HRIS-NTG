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
const toastMessage = ref('');
const isToastVisible = ref(false);

const showToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
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
    alert('Harap pilih minimal 1 karyawan pada Langkah 3!');
    return;
  }
  if (selectedDates.value.length === 0) {
    alert('Harap pilih minimal 1 tanggal pada grid kalender Langkah 6!');
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
  <div class="tambah-jadwal-page space-y-4 max-w-5xl mx-auto">
    <!-- Breadcrumb Nav -->
    <nav class="flex items-center gap-2 text-xs text-[#798892]">
      <router-link to="/roster/tim" class="hover:text-bmis-teal">Roster</router-link>
      <span class="text-[#d6dee5]">&gt;</span>
      <router-link to="/roster/admin" class="hover:text-bmis-teal">Data Roster Karyawan</router-link>
      <span class="text-[#d6dee5]">&gt;</span>
      <span class="text-[#29323a] font-bold">Tambah Jadwal Shift</span>
    </nav>

    <!-- Page Title -->
    <h2 class="page-title text-xl font-bold text-[#1a3a5c]">
      Tambah Jadwal Shift Karyawan
    </h2>

    <!-- Performance Notice Banner -->
    <div class="p-3.5 bg-white rounded-xl border border-[#d6dee5] border-l-4 border-l-bmis-blue flex items-start gap-3 text-xs text-[#495057] shadow-xs">
      <Info :size="16" class="text-bmis-blue flex-shrink-0 mt-0.5" />
      <div>
        <strong class="text-[#29323a]">Optimasi Skala 3.000+ Karyawan:</strong> Pilih <strong>Kantor</strong> dan <strong>Kelompok Pegawai</strong> terlebih dahulu agar sistem hanya memuat personel terkait tanpa membebani browser dan server.
      </div>
    </div>

    <!-- Main Form Card dengan Aksen Gradien -->
    <div class="bg-white rounded-2xl border border-[#e9ecef] shadow-sm overflow-hidden">
      <!-- Strip aksen gradien di tepi atas -->
      <div class="h-[3px] bg-gradient-to-r from-bmis-teal to-bmis-blue"></div>

      <div class="p-6 space-y-6">
        <!-- ROW 1: LANGKAH 1 & 2 (KANTOR & DIVISI) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Step 1: Kantor -->
          <div>
            <label class="form-label-custom">
              <span>1. PILIH KANTOR / LOKASI PENUGASAN</span>
              <span class="required-tag">*Wajib</span>
            </label>
            <div class="relative">
              <Building2 :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#798892] pointer-events-none" />
              <select v-model="selectedKantor" class="form-select-custom pl-9">
                <option v-for="loc in mockOffices" :key="loc" :value="loc">{{ loc }}</option>
              </select>
            </div>
            <span class="text-[11px] text-[#798892] mt-1 block">Langkah awal untuk menyaring unit penempatan gedung.</span>
          </div>

          <!-- Step 2: Kelompok Pegawai (Divisi) -->
          <div>
            <label class="form-label-custom">
              <span>2. KELOMPOK PEGAWAI / DIVISI</span>
              <span class="required-tag">*Wajib</span>
            </label>
            <div class="relative">
              <Users :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#798892] pointer-events-none" />
              <select v-model="selectedKelompok" class="form-select-custom pl-9">
                <option value="Security">Security / Pengamanan</option>
                <option value="Engineering">Engineering (ME / Gedung)</option>
                <option value="House Keeping">House Keeping / Kebersihan</option>
                <option value="Cleaning Service">Cleaning Service</option>
                <option value="Manajemen Operasional">Manajemen Operasional</option>
              </select>
            </div>
            <span class="text-[11px] text-[#798892] mt-1 block">Tentukan divisi atau kelompok kerja penugasan.</span>
          </div>
        </div>

        <!-- ROW 2: LANGKAH 3 & 4 (CHECKLIST KARYAWAN & FILTER JABATAN / CHIPS) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t border-[#e9ecef]">
          <!-- Step 3: Checklist Multi-Select Karyawan (Kiri, 7 cols) -->
          <div class="lg:col-span-7 space-y-2">
            <div class="flex items-center justify-between">
              <label class="form-label-custom mb-0">
                <span>3. PILIH KARYAWAN (NAMA PEGAWAI)</span>
                <span class="required-tag ml-1">*Wajib</span>
              </label>
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-[#e6f6f3] text-bmis-teal font-bold border border-[#bce6dc]">
                {{ selectedEmpIds.length }} Terpilih
              </span>
            </div>

            <!-- Card Box List Karyawan -->
            <div class="border border-[#d6dee5] rounded-xl overflow-hidden bg-white">
              <!-- Toolbar: Select All & Search -->
              <div class="p-2.5 bg-[#f8f9fa] border-b border-[#e9ecef] flex items-center justify-between gap-3 text-xs">
                <label class="inline-flex items-center gap-2 cursor-pointer font-bold text-[#495057]">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll(($event.target as HTMLInputElement).checked)"
                    class="rounded text-bmis-teal focus:ring-bmis-teal h-4 w-4"
                  />
                  <span>Pilih Semua ({{ filteredEmployees.length }})</span>
                </label>

                <div class="relative flex-1 max-w-[200px]">
                  <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#798892]" />
                  <input
                    type="text"
                    v-model="searchEmp"
                    placeholder="Cari pegawai..."
                    class="w-full h-7 pl-7 pr-2 rounded-md border border-[#d6dee5] text-xs focus:outline-none focus:border-bmis-teal"
                  />
                </div>
              </div>

              <!-- List Items Checklist -->
              <div class="max-h-56 overflow-y-auto divide-y divide-[#f1f5f9] p-1">
                <label
                  v-for="emp in filteredEmployees"
                  :key="emp.id"
                  :class="[
                    'flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-[#f8f9fa] transition-colors',
                    selectedEmpIds.includes(emp.id) ? 'bg-[#f0f9f7]' : ''
                  ]"
                >
                  <div class="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      :checked="selectedEmpIds.includes(emp.id)"
                      @change="toggleEmployee(emp.id)"
                      class="rounded text-bmis-teal focus:ring-bmis-teal h-4 w-4"
                    />
                    <div class="w-7 h-7 rounded-full bg-[#495057] text-white flex items-center justify-center font-bold text-[10px]">
                      {{ emp.nama.split(' ').map(n=>n[0]).slice(0,2).join('') }}
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[#29323a]">{{ emp.nama }}</div>
                      <div class="text-[10px] text-[#798892]">{{ emp.nip }} &bull; {{ emp.jabatan }}</div>
                    </div>
                  </div>

                  <span class="text-[10px] font-semibold text-[#798892] bg-[#f1f5f9] px-2 py-0.5 rounded">
                    {{ emp.divisi }}
                  </span>
                </label>

                <div v-if="filteredEmployees.length === 0" class="p-6 text-center text-xs text-[#798892]">
                  Tidak ada karyawan yang sesuai filter di atas.
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Filter Jabatan & Preview Chips (Kanan, 5 cols) -->
          <div class="lg:col-span-5 space-y-3">
            <div>
              <label class="form-label-custom">
                <span>4. FILTER JABATAN SPESIFIK</span>
              </label>
              <input
                type="text"
                v-model="filterJabatan"
                placeholder="Contoh: Danru / Teknisi / Staff..."
                class="form-input-custom"
              />
            </div>

            <!-- Preview Karyawan Terpilih (Chips) -->
            <div class="border border-[#d6dee5] rounded-xl p-3 bg-[#f8f9fa] space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-[#495057]">Karyawan Terpilih:</span>
                <button
                  type="button"
                  v-if="selectedEmpIds.length > 0"
                  @click="clearAllSelectedEmp"
                  class="text-[11px] font-bold text-bmis-red hover:underline"
                >
                  Hapus Semua Pilihan
                </button>
              </div>

              <!-- Chips Container -->
              <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                <span
                  v-for="emp in selectedEmployeesList"
                  :key="emp.id"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#d6dee5] text-xs font-medium text-[#29323a] shadow-xs"
                >
                  <span>{{ emp.nama }}</span>
                  <button
                    type="button"
                    @click="removeSelectedEmp(emp.id)"
                    class="text-[#798892] hover:text-bmis-red font-bold text-xs"
                  >
                    &times;
                  </button>
                </span>

                <div v-if="selectedEmpIds.length === 0" class="text-xs text-[#798892] italic py-2">
                  Belum ada karyawan yang dipilih.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ROW 3: LANGKAH 5 & 6 (PERIODE BULAN & SHIFT + KALENDER MULTI-SELECT) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t border-[#e9ecef]">
          <!-- Step 5: Kode Shift & Periode Bulan (Kiri, 5 cols) -->
          <div class="lg:col-span-5 space-y-4">
            <div>
              <label class="form-label-custom">
                <span>5. PERIODE BULAN PENUGASAN</span>
              </label>
              <input type="month" v-model="selectedMonth" class="form-input-custom" />
            </div>

            <div>
              <label class="form-label-custom">
                <span>KODE SHIFT PENUGASAN</span>
              </label>
              <div class="space-y-2">
                <!-- Shift 1 Pagi -->
                <label
                  :class="[
                    'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                    selectedShiftCode === 1
                      ? 'border-[#e9a23b] bg-[#fef9f0] shadow-xs'
                      : 'border-[#d6dee5] bg-white hover:bg-[#f8f9fa]'
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <input type="radio" :value="1" v-model="selectedShiftCode" class="text-[#e9a23b] focus:ring-[#e9a23b]" />
                    <span class="w-6 h-6 rounded bg-[#e9a23b] text-white font-extrabold text-xs flex items-center justify-center">P</span>
                    <div>
                      <div class="text-xs font-bold text-[#29323a]">Shift 1 (Pagi)</div>
                      <div class="text-[11px] text-[#798892]">07.00 – 15.00 WIB</div>
                    </div>
                  </div>
                  <Check v-if="selectedShiftCode === 1" :size="16" class="text-[#e9a23b]" />
                </label>

                <!-- Shift 2 Siang -->
                <label
                  :class="[
                    'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                    selectedShiftCode === 2
                      ? 'border-[#4c7fd6] bg-[#f4f7fd] shadow-xs'
                      : 'border-[#d6dee5] bg-white hover:bg-[#f8f9fa]'
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <input type="radio" :value="2" v-model="selectedShiftCode" class="text-[#4c7fd6] focus:ring-[#4c7fd6]" />
                    <span class="w-6 h-6 rounded bg-[#4c7fd6] text-white font-extrabold text-xs flex items-center justify-center">S</span>
                    <div>
                      <div class="text-xs font-bold text-[#29323a]">Shift 2 (Siang)</div>
                      <div class="text-[11px] text-[#798892]">15.00 – 23.00 WIB</div>
                    </div>
                  </div>
                  <Check v-if="selectedShiftCode === 2" :size="16" class="text-[#4c7fd6]" />
                </label>

                <!-- Shift 3 Malam -->
                <label
                  :class="[
                    'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                    selectedShiftCode === 3
                      ? 'border-[#7c5cb4] bg-[#f7f4fc] shadow-xs'
                      : 'border-[#d6dee5] bg-white hover:bg-[#f8f9fa]'
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <input type="radio" :value="3" v-model="selectedShiftCode" class="text-[#7c5cb4] focus:ring-[#7c5cb4]" />
                    <span class="w-6 h-6 rounded bg-[#7c5cb4] text-white font-extrabold text-xs flex items-center justify-center">M</span>
                    <div>
                      <div class="text-xs font-bold text-[#29323a]">Shift 3 (Malam)</div>
                      <div class="text-[11px] text-[#798892]">23.00 – 07.00 WIB</div>
                    </div>
                  </div>
                  <Check v-if="selectedShiftCode === 3" :size="16" class="text-[#7c5cb4]" />
                </label>

                <!-- OFF / Libur -->
                <label
                  :class="[
                    'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                    selectedShiftCode === 0
                      ? 'border-[#798892] bg-[#f8f9fa] shadow-xs'
                      : 'border-[#d6dee5] bg-white hover:bg-[#f8f9fa]'
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <input type="radio" :value="0" v-model="selectedShiftCode" class="text-[#798892] focus:ring-[#798892]" />
                    <span class="w-6 h-6 rounded bg-[#798892] text-white font-extrabold text-[10px] flex items-center justify-center">OFF</span>
                    <div>
                      <div class="text-xs font-bold text-[#29323a]">Libur / OFF</div>
                      <div class="text-[11px] text-[#798892]">Hari Lepas Tugas</div>
                    </div>
                  </div>
                  <Check v-if="selectedShiftCode === 0" :size="16" class="text-[#798892]" />
                </label>
              </div>
            </div>
          </div>

          <!-- Step 6: Grid Kalender Multi-Select Tanggal (Kanan, 7 cols) -->
          <div class="lg:col-span-7 space-y-3">
            <div class="flex items-center justify-between">
              <label class="form-label-custom mb-0">
                <span>6. PILIH TANGGAL PENUGASAN (BISA PILIH BANYAK)</span>
                <span class="required-tag ml-1">*Wajib</span>
              </label>
              <span class="text-xs font-bold text-bmis-teal">
                {{ selectedDates.length }} Hari Terpilih
              </span>
            </div>

            <!-- Tombol Cepat Pilihan Tanggal -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                @click="selectWorkdaysOnly"
                class="px-2.5 py-1 text-xs rounded-lg border border-[#d6dee5] bg-white hover:bg-[#f8f9fa] text-[#495057] font-semibold"
              >
                Pilih Hari Kerja Saja (Sen–Jum)
              </button>
              <button
                type="button"
                @click="selectFullMonth"
                class="px-2.5 py-1 text-xs rounded-lg border border-[#d6dee5] bg-white hover:bg-[#f8f9fa] text-[#495057] font-semibold"
              >
                Pilih Sebulan Penuh
              </button>
              <button
                type="button"
                @click="resetDates"
                class="px-2.5 py-1 text-xs rounded-lg border border-[#d6dee5] bg-white hover:bg-red-50 text-bmis-red font-semibold flex items-center gap-1"
              >
                <RotateCcw :size="12" /> Reset Tanggal
              </button>
            </div>

            <!-- Grid Kalender 7 Kolom -->
            <div class="border border-[#d6dee5] rounded-xl p-3 bg-white">
              <div class="grid grid-cols-7 gap-1.5 text-center">
                <!-- Header Hari -->
                <div v-for="d in ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']" :key="d" class="text-[10px] font-bold text-[#798892] py-1">
                  {{ d }}
                </div>

                <!-- Sel Hari -->
                <button
                  v-for="day in calendarDays"
                  :key="day.dayNum"
                  type="button"
                  @click="toggleDate(day.dayNum)"
                  :class="[
                    'h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all border',
                    selectedDates.includes(day.dayNum)
                      ? 'bg-bmis-teal text-white border-bmis-teal shadow-xs scale-102'
                      : day.isWeekend
                        ? 'bg-[#faece6] text-[#c1622a] border-[#f3d4a4] hover:bg-[#f5e0d7]'
                        : 'bg-white text-[#29323a] border-[#e9ecef] hover:bg-[#f8f9fa]'
                  ]"
                >
                  <span class="text-xs leading-none">{{ day.dayNum }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SUMMARY BOX -->
        <div class="p-4 rounded-xl bg-[#e6f6f3] border border-[#a2ddd4] text-xs text-[#0b6151] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="font-bold text-sm text-[#084b3e] mb-0.5">
              Ringkasan Penugasan:
            </div>
            <div>
              <strong>{{ selectedEmpIds.length }} Karyawan</strong> di <strong>{{ selectedKantor }}</strong> akan ditugaskan <strong>{{ getShiftName(selectedShiftCode) }}</strong> selama <strong>{{ selectedDates.length }} hari</strong> pada periode {{ selectedMonth }}.
            </div>
          </div>
        </div>

        <!-- FOOTER FORM ACTIONS -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#e9ecef]">
          <button
            type="button"
            @click="goBack"
            class="px-5 py-2.5 rounded-lg border border-[#d6dee5] bg-white text-[#495057] text-xs font-bold hover:bg-[#f8f9fa] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleSubmit"
            class="px-6 py-2.5 rounded-lg bg-bmis-green hover:bg-bmis-green-hover text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <Save :size="15" />
            <span>Simpan Penugasan Shift</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <CheckCircle2 :size="16" class="text-bmis-green" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
