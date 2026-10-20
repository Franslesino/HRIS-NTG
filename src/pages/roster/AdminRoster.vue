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

const route = useRoute();
const router = useRouter();

// Filter State
const selectedKantor = ref('Menara 1 BTN');
const selectedDivisi = ref('');
const selectedMonth = ref('2026-11');
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = ref(10);

// Toast State
const toastMessage = ref('');
const isToastVisible = ref(false);

const showToast = (msg: string) => {
  toastMessage.value = msg;
  isToastVisible.value = true;
  setTimeout(() => {
    isToastVisible.value = false;
  }, 3500);
};

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
const getDivisiBadgeClass = (divisi: string) => {
  if (divisi.includes('Engineering')) return 'badge-eng';
  if (divisi.includes('Security')) return 'badge-sec';
  if (divisi.includes('House') || divisi.includes('Cleaning')) return 'badge-hk';
  return 'badge-man';
};

// Actions
const copyFromPrevMonth = () => {
  if (confirm('Salin pola rotasi shift dari bulan sebelumnya ke bulan ini?')) {
    showToast('Pola jadwal berhasil disalin dari bulan lalu!');
  }
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
  <div class="admin-roster-page space-y-4 max-w-full">
    <!-- HEADING -->
    <div class="mb-3">
      <h1 class="page-heading">Roster Kerja Bulanan</h1>
    </div>

    <!-- WIDGET CARD: FILTER HIERARKI PENJADWALAN -->
    <section class="bmis-widget-card">
      <p class="widget-sub-desc">
        Pengaturan matriks jadwal shift kerja operasional bulanan per gedung dan divisi pada aplikasi Building Management Information System
      </p>

      <!-- 4 FILTER UTAMA: GEDUNG (WAJIB), DIVISI (WAJIB), BULAN, CARI NAMA -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <!-- 1. Gedung / Lokasi (Wajib) -->
        <div class="form-group-item">
          <label class="form-label-custom">
            <span>Gedung / Lokasi</span>
            <span class="required-tag">*Wajib</span>
          </label>
          <select v-model="selectedKantor" class="form-select-custom">
            <option value="Menara 1 BTN">Menara 1 BTN - Jakarta Pusat</option>
            <option value="Kantor Pusat BMIS">Kantor Pusat BMIS - Jakarta Selatan</option>
            <option value="Gedung Arsip Cibubur">Gedung Arsip - Cibubur</option>
            <option value="Gedung R">Gedung R</option>
            <option value="Gedung Q">Gedung Q</option>
          </select>
        </div>

        <!-- 2. Divisi / Bagian (Wajib) -->
        <div class="form-group-item">
          <label class="form-label-custom">
            <span>Divisi / Bagian</span>
            <span class="required-tag">*Wajib</span>
          </label>
          <select v-model="selectedDivisi" class="form-select-custom">
            <option value="">Semua Divisi di Gedung Ini</option>
            <option value="Engineering">Engineering (ME)</option>
            <option value="Security">Security / Pengamanan</option>
            <option value="House Keeping">House Keeping / Cleaning</option>
            <option value="Cleaning Service">Cleaning Service</option>
            <option value="Manajemen Operasional">Manajemen Operasional</option>
          </select>
        </div>

        <!-- 3. Periode Bulan -->
        <div class="form-group-item">
          <label class="form-label-custom">
            <span>Bulan Roster</span>
          </label>
          <input type="month" v-model="selectedMonth" class="form-input-custom" />
        </div>

        <!-- 4. Cari Nama Pegawai -->
        <div class="form-group-item">
          <label class="form-label-custom">
            <span>Cari Nama Pegawai</span>
          </label>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Ketik nama atau NIP..."
            class="form-input-custom"
          />
        </div>
      </div>

      <!-- BARIS LEGENDA & TOMBOL AKSI BMIS -->
      <div class="pt-3 border-t border-[#e9ecef] flex flex-wrap items-center justify-between gap-4">
        <!-- Legenda Shift -->
        <div class="flex flex-wrap items-center gap-4 text-xs">
          <span class="inline-flex items-center gap-1.5 font-medium text-[#495057]">
            <span class="dot-badge dot-pagi">P</span>
            <strong>Shift 1 (Pagi)</strong> 07.00–15.00
          </span>
          <span class="inline-flex items-center gap-1.5 font-medium text-[#495057]">
            <span class="dot-badge dot-siang">S</span>
            <strong>Shift 2 (Siang)</strong> 15.00–23.00
          </span>
          <span class="inline-flex items-center gap-1.5 font-medium text-[#495057]">
            <span class="dot-badge dot-malam">M</span>
            <strong>Shift 3 (Malam)</strong> 23.00–07.00
          </span>
        </div>

        <!-- Deretan 5 Tombol Khas BMIS -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Reset (Kuning) -->
          <button type="button" class="btn-bmis btn-bmis-yellow" @click="resetFilters">
            <RotateCcw :size="13" />
            <span>Reset</span>
          </button>

          <!-- Salin Bulan Lalu (Ungu) -->
          <button type="button" class="btn-bmis btn-bmis-purple" @click="copyFromPrevMonth">
            <Copy :size="13" />
            <span>Salin Bulan Lalu</span>
          </button>

          <!-- Ekspor Excel (Biru) -->
          <button type="button" class="btn-bmis btn-bmis-blue" @click="exportExcel">
            <Download :size="13" />
            <span>Ekspor Excel</span>
          </button>

          <!-- + Tambah Jadwal (Hijau) -->
          <router-link
            to="/roster/tambah"
            class="btn-bmis btn-bmis-green font-bold text-white"
          >
            <Plus :size="14" />
            <span>+ Tambah Jadwal</span>
          </router-link>

          <!-- Simpan Roster (Teal) -->
          <button
            type="button"
            class="btn-bmis btn-bmis-teal font-bold"
            @click="saveRoster"
          >
            <Save :size="13" />
            <span>Simpan Roster</span>
          </button>
        </div>
      </div>
    </section>

    <!-- WIDGET CARD: TABEL MATRIKS ROSTER SHIFT -->
    <section class="bmis-widget-card !pt-4 overflow-hidden">
      <!-- Status Bar & Info Atas -->
      <div class="flex flex-wrap items-center justify-between text-xs pb-3 mb-3 border-b border-[#e9ecef] gap-2">
        <div class="text-[#495057]">
          <strong>Status: {{ currentDateTimeStr }}</strong>
          <span class="text-[#798892] ml-3">
            • Lokasi: <strong class="text-[#29323a]">{{ selectedKantor }}</strong>
          </span>
        </div>
        <div class="text-[#798892]">
          Total Slot Shift Terisi: <strong class="text-bmis-blue font-bold">{{ totalSlotsFilled.toLocaleString('id-ID') }}</strong>
        </div>
      </div>

      <!-- Container Scroll Tabel Matriks dengan Sticky Columns -->
      <div class="overflow-x-auto border border-[#d6dee5] rounded-lg">
        <table class="w-full border-collapse text-left text-xs bg-white min-w-[1000px]">
          <!-- Header Tabel Matriks -->
          <thead>
            <tr class="bg-[#d6dee5] text-[#29323a] font-bold border-b border-[#b0bec5]">
              <!-- 4 Sticky Left Columns -->
              <th class="sticky left-0 z-20 bg-[#d6dee5] w-[42px] min-w-[42px] px-2 py-2.5 text-center border-r border-[#cbd5e1]">
                #
              </th>
              <th class="sticky left-[42px] z-20 bg-[#d6dee5] w-[190px] min-w-[190px] px-3 py-2.5 border-r border-[#cbd5e1]">
                NAMA &amp; NIP PEGAWAI
              </th>
              <th class="sticky left-[232px] z-20 bg-[#d6dee5] w-[145px] min-w-[145px] px-3 py-2.5 border-r border-[#cbd5e1]">
                JABATAN / DIVISI
              </th>
              <th class="sticky left-[377px] z-20 bg-[#cbd8e4] w-[56px] min-w-[56px] px-2 py-2.5 text-center border-r-2 border-[#a3b8cc] text-bmis-teal">
                TOTAL
              </th>

              <!-- Kolom Tanggal 1 s.d. 31 -->
              <th
                v-for="d in monthDaysList"
                :key="'th-day-' + d.dayNum"
                :class="[
                  'w-[46px] min-w-[46px] px-1 py-1.5 text-center border-r border-[#cbd5e1] font-bold select-none',
                  d.isWeekend ? 'bg-[#faece6] text-[#c1622a]' : 'bg-[#d6dee5] text-[#29323a]'
                ]"
              >
                <div class="text-[12px] font-extrabold leading-tight">{{ d.dayNum }}</div>
                <div class="text-[9px] uppercase font-semibold text-[#798892]">{{ d.dayName }}</div>
              </th>
            </tr>
          </thead>

          <!-- Isi Tabel Matriks -->
          <tbody>
            <!-- Empty State -->
            <tr v-if="paginatedEmployees.length === 0">
              <td :colspan="4 + monthDaysList.length" class="text-center py-10 text-[#798892]">
                Tidak ada data pegawai yang sesuai dengan filter lokasi atau divisi ini.
              </td>
            </tr>

            <!-- Baris Pegawai -->
            <tr
              v-for="(emp, idx) in paginatedEmployees"
              :key="emp.id"
              class="border-b border-[#e9ecef] hover:bg-[#f8fafc] transition-colors"
            >
              <!-- 1. Sticky # -->
              <td class="sticky left-0 z-10 bg-white font-bold text-center px-2 py-2 border-r border-[#e9ecef] text-[#798892]">
                {{ (currentPage - 1) * perPage + idx + 1 }}
              </td>

              <!-- 2. Sticky Nama & NIP -->
              <td class="sticky left-[42px] z-10 bg-white px-3 py-2 border-r border-[#e9ecef]">
                <div class="font-bold text-[#29323a] text-[12.5px] leading-tight truncate max-w-[170px]" :title="emp.nama">
                  {{ emp.nama }}
                </div>
                <div class="text-[11px] text-[#798892] font-mono mt-0.5">
                  {{ emp.nip }}
                </div>
              </td>

              <!-- 3. Sticky Jabatan & Divisi -->
              <td class="sticky left-[232px] z-10 bg-white px-3 py-2 border-r border-[#e9ecef]">
                <div class="font-semibold text-[#29323a] text-[11.5px] truncate max-w-[130px]" :title="emp.jabatan">
                  {{ emp.jabatan }}
                </div>
                <span class="badge-divisi mt-1" :class="getDivisiBadgeClass(emp.divisi)">
                  {{ emp.divisi }}
                </span>
              </td>

              <!-- 4. Sticky Total -->
              <td class="sticky left-[377px] z-10 bg-[#f8fafc] font-black text-center px-2 py-2 border-r-2 border-[#a3b8cc] text-bmis-teal text-[13px]">
                {{ calculateEmployeeTotal(emp.id) }}
              </td>

              <!-- Kolom Sel Harian (3 Kotak Vertikal P, S, M) -->
              <td
                v-for="d in monthDaysList"
                :key="'cell-' + emp.id + '-' + d.dayNum"
                :class="[
                  'px-0.5 py-1 text-center border-r border-[#e9ecef] align-middle',
                  d.isWeekend ? 'bg-[#fdf8f7]' : ''
                ]"
              >
                <div class="flex flex-col gap-0.5 items-center justify-center">
                  <!-- Pagi (P) -->
                  <button
                    type="button"
                    @click="toggleShift(emp.id, d.dayNum, 1)"
                    :class="[
                      'w-[22px] h-[17px] rounded text-[9px] font-black flex items-center justify-center border transition-all',
                      isShiftActive(emp.id, d.dayNum, 1)
                        ? 'bg-[#e9a23b] border-[#e9a23b] text-white shadow-xs'
                        : 'bg-white border-[#d6dee5] text-[#798892] hover:border-[#e9a23b] hover:text-[#e9a23b]'
                    ]"
                    title="Shift 1 (Pagi 07.00-15.00)"
                  >
                    P
                  </button>

                  <!-- Siang (S) -->
                  <button
                    type="button"
                    @click="toggleShift(emp.id, d.dayNum, 2)"
                    :class="[
                      'w-[22px] h-[17px] rounded text-[9px] font-black flex items-center justify-center border transition-all',
                      isShiftActive(emp.id, d.dayNum, 2)
                        ? 'bg-[#4c7fd6] border-[#4c7fd6] text-white shadow-xs'
                        : 'bg-white border-[#d6dee5] text-[#798892] hover:border-[#4c7fd6] hover:text-[#4c7fd6]'
                    ]"
                    title="Shift 2 (Siang 15.00-23.00)"
                  >
                    S
                  </button>

                  <!-- Malam (M) -->
                  <button
                    type="button"
                    @click="toggleShift(emp.id, d.dayNum, 3)"
                    :class="[
                      'w-[22px] h-[17px] rounded text-[9px] font-black flex items-center justify-center border transition-all',
                      isShiftActive(emp.id, d.dayNum, 3)
                        ? 'bg-[#7c5cb4] border-[#7c5cb4] text-white shadow-xs'
                        : 'bg-white border-[#d6dee5] text-[#798892] hover:border-[#7c5cb4] hover:text-[#7c5cb4]'
                    ]"
                    title="Shift 3 (Malam 23.00-07.00)"
                  >
                    M
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Pagination BMIS -->
      <div class="pt-3.5 mt-3 border-t border-[#e9ecef] flex flex-wrap items-center justify-between text-xs text-[#798892] gap-3">
        <div class="flex items-center gap-2">
          <span>Menampilkan {{ paginatedEmployees.length }} dari {{ filteredEmployees.length }} pegawai</span>
          <span class="text-[#d6dee5]">•</span>
          <span>Baris per halaman:</span>
          <select v-model="perPage" class="border border-[#d6dee5] rounded px-1.5 py-0.5 text-xs text-[#29323a]">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="15">15</option>
            <option :value="25">25</option>
          </select>
        </div>

        <!-- Tombol Pagination -->
        <div class="flex items-center gap-1">
          <button
            type="button"
            :disabled="currentPage === 1"
            @click="currentPage--"
            class="h-7 w-7 rounded border border-[#d6dee5] bg-white text-[#495057] flex items-center justify-center hover:bg-[#f8f9fa] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft :size="14" />
          </button>
          
          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            @click="currentPage = p"
            :class="[
              'h-7 min-w-[28px] px-1.5 rounded text-xs font-semibold flex items-center justify-center border transition-colors',
              currentPage === p
                ? 'bg-bmis-blue text-white border-bmis-blue'
                : 'bg-white border-[#d6dee5] text-[#495057] hover:bg-[#f8f9fa]'
            ]"
          >
            {{ p }}
          </button>

          <button
            type="button"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
            class="h-7 w-7 rounded border border-[#d6dee5] bg-white text-[#495057] flex items-center justify-center hover:bg-[#f8f9fa] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </section>

    <!-- Toast Notification -->
    <div
      v-if="isToastVisible"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <CheckCircle2 :size="16" class="text-bmis-green" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
