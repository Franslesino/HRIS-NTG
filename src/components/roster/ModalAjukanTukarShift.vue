<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ArrowLeftRight,
  CheckCircle2,
  X,
  Info,
  Radio,
  Clock,
  Building2,
  CalendarDays
} from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import { useTukarShiftStore } from '../../composables/useTukarShiftStore';
import type { TukarShiftItem } from '../../types/tukarShift';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    defaultShiftDate?: string;
  }>(),
  {
    modelValue: false,
    defaultShiftDate: 'Kamis, 9 Okt 2023 — Shift Pagi (08:00 - 16:00 WIB)'
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submitted', item: TukarShiftItem): void;
}>();

const { currentUser } = useAuth();
const { addShiftRequest } = useTukarShiftStore();

// Pemohon Identity
const userName = computed(() => currentUser.value?.nama || 'Asep Milo');
const userNip = computed(() => currentUser.value?.nip || 'EMP-018');
const userRole = computed(() => currentUser.value?.jabatan || 'Staff Operasional');
const userInitials = computed(() => {
  const parts = userName.value.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return userName.value.substring(0, 2).toUpperCase();
});

// Shift Pemohon Options
interface ShiftOption {
  id: string;
  label: string;
  dateStr: string;
  shiftName: 'Pagi' | 'Siang' | 'Malam';
  shiftTime: string;
  status: string;
  lokasi: string;
}

const shiftOptions: ShiftOption[] = [
  {
    id: 'opt-1',
    label: 'Kamis, 9 Okt 2023 — Shift Pagi (08:00 - 16:00 WIB)',
    dateStr: 'Kamis, 9 Okt 2023',
    shiftName: 'Pagi',
    shiftTime: '08:00 - 16:00',
    status: 'Hari Kerja Aktif',
    lokasi: 'Gedung Utama BMIS, Ruang Operasional 302'
  },
  {
    id: 'opt-2',
    label: 'Jumat, 10 Okt 2023 — Shift Siang (16:00 - 00:00 WIB)',
    dateStr: 'Jumat, 10 Okt 2023',
    shiftName: 'Siang',
    shiftTime: '16:00 - 00:00',
    status: 'Hari Kerja Aktif',
    lokasi: 'Gedung Utama BMIS, Ruang Operasional 302'
  },
  {
    id: 'opt-3',
    label: 'Sabtu, 11 Okt 2023 — Shift Malam (00:00 - 08:00 WIB)',
    dateStr: 'Sabtu, 11 Okt 2023',
    shiftName: 'Malam',
    shiftTime: '00:00 - 08:00',
    status: 'Hari Kerja Aktif',
    lokasi: 'Gedung Utama BMIS, Ruang Operasional 302'
  },
  {
    id: 'opt-4',
    label: 'Senin, 13 Okt 2023 — Shift Pagi (08:00 - 16:00 WIB)',
    dateStr: 'Senin, 13 Okt 2023',
    shiftName: 'Pagi',
    shiftTime: '08:00 - 16:00',
    status: 'Hari Kerja Aktif',
    lokasi: 'Gedung Utama BMIS, Ruang Operasional 302'
  },
  {
    id: 'opt-5',
    label: 'Selasa, 14 Okt 2023 — Shift Siang (16:00 - 00:00 WIB)',
    dateStr: 'Selasa, 14 Okt 2023',
    shiftName: 'Siang',
    shiftTime: '16:00 - 00:00',
    status: 'Hari Kerja Aktif',
    lokasi: 'Gedung Utama BMIS, Ruang Operasional 302'
  }
];

const selectedShiftId = ref('opt-1');

const currentSelectedShift = computed(() => {
  return shiftOptions.find((s) => s.id === selectedShiftId.value) || shiftOptions[0];
});

// Rekan Pengganti Options
interface ColleagueOption {
  id: string;
  name: string;
  empId: string;
  role: string;
  initials: string;
  shiftTujuan: string;
  shiftCode: 'Pagi' | 'Siang' | 'Malam';
}

const colleagueOptions: ColleagueOption[] = [
  {
    id: 'c-1',
    name: 'Budi Raharjo',
    empId: 'EMP-042',
    role: 'Staff Operasional',
    initials: 'BR',
    shiftTujuan: 'Kamis, 9 Okt (16:00 - 00:00)',
    shiftCode: 'Siang'
  },
  {
    id: 'c-2',
    name: 'Rian Hidayat',
    empId: 'EMP-061',
    role: 'Staff Operasional',
    initials: 'RH',
    shiftTujuan: 'Jumat, 10 Okt (08:00 - 16:00)',
    shiftCode: 'Pagi'
  },
  {
    id: 'c-3',
    name: 'Dimas Anggara',
    empId: 'EMP-073',
    role: 'Staff Operasional',
    initials: 'DA',
    shiftTujuan: 'Sabtu, 11 Okt (16:00 - 00:00)',
    shiftCode: 'Siang'
  },
  {
    id: 'c-4',
    name: 'Candra Wijaya',
    empId: 'EMP-088',
    role: 'Staff Operasional',
    initials: 'CW',
    shiftTujuan: 'Minggu, 12 Okt (00:00 - 08:00)',
    shiftCode: 'Malam'
  }
];

const selectedColleagueId = ref('c-1');

const selectedColleague = computed(() => {
  return colleagueOptions.find((c) => c.id === selectedColleagueId.value) || colleagueOptions[0];
});

// Alasan Form
const reasonText = ref(
  'Keperluan keluarga mendesak di luar kota pada shift Pagi. Mohon bantuannya rekan Budi, terima kasih banyak sebelumnya.'
);

const isSubmitting = ref(false);

const closeModal = () => {
  emit('update:modelValue', false);
};

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    closeModal();
  }
};

const submitSwapRequest = () => {
  isSubmitting.value = true;
  const now = new Date();
  const ticketRandom = Math.floor(100 + Math.random() * 900);
  const ticketCode = `#TS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${ticketRandom}`;

  const newTicket: TukarShiftItem = {
    id: `TS-${ticketRandom}`,
    tiketId: ticketCode,
    rosterUnit: 'Roster Unit 3',
    hasAccent: true,
    pemohon: {
      initials: userInitials.value,
      nama: userName.value,
      empId: userNip.value,
      gardu: 'Gedung Utama BMIS',
      jabatan: userRole.value
    },
    pengganti: {
      initials: selectedColleague.value.initials,
      nama: selectedColleague.value.name,
      empId: selectedColleague.value.empId,
      gardu: 'Gedung Utama BMIS',
      jabatan: selectedColleague.value.role
    },
    pertukaran: [
      {
        label: 'Shift A',
        jadwal: `${currentSelectedShift.value.dateStr} (${currentSelectedShift.value.shiftTime})`,
        shiftCode: currentSelectedShift.value.shiftName,
        icon: 'sun'
      },
      {
        label: 'Shift B',
        jadwal: selectedColleague.value.shiftTujuan,
        shiftCode: selectedColleague.value.shiftCode,
        icon: 'moon'
      }
    ],
    rekanApproval: {
      approved: true,
      dateStr: `${now.getDate()} Okt ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`,
      note: 'Dikonfirmasi melalui notifikasi sistem otomatis (SOP Kualifikasi Terpenuhi)'
    },
    status: 'pending_hr',
    diajukanPadaDate: `${now.getDate()} Okt ${now.getFullYear()}`,
    diajukanPadaTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`,
    alasan: reasonText.value.trim()
  };

  addShiftRequest(newTicket);
  emit('submitted', newTicket);
  isSubmitting.value = false;
  closeModal();
};
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        @click="handleBackdropClick"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      >
        <div
          class="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          @click.stop
        >
          <!-- ── MODAL HEADER ── -->
          <div class="p-5 sm:p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ArrowLeftRight :size="20" />
              </div>
              <div>
                <h2 class="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                  Ajukan Pertukaran Jadwal Shift (Shift Swap)
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  Pilih shift Anda yang ingin ditukar, lalu tentukan rekan kerja pengganti sesuai kriteria kualifikasi.
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="closeModal"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- ── STEP PROGRESS BAR ── -->
          <div class="px-5 sm:px-6 pt-4 pb-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <!-- Step 1 -->
              <div class="flex items-center justify-between gap-3 px-2">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-2xs">
                    1
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-800 leading-tight">
                      Langkah 1: Shift Anda yang Ditukar
                    </div>
                    <div class="text-[11px] text-[#0284c7] font-semibold leading-tight mt-0.5">
                      Jadwal Pemohon Dipilih
                    </div>
                  </div>
                </div>
                <CheckCircle2 :size="16" class="text-[#0284c7] flex-shrink-0" />
              </div>

              <!-- Step 2 -->
              <div class="flex items-center justify-between gap-3 px-2 sm:border-l sm:border-slate-200">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-2xs">
                    2
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-800 leading-tight">
                      Langkah 2: Rekan &amp; Shift Tujuan
                    </div>
                    <div class="text-[11px] text-[#0284c7] font-semibold leading-tight mt-0.5">
                      Siap Dipilih
                    </div>
                  </div>
                </div>
                <CheckCircle2 :size="16" class="text-[#0284c7] flex-shrink-0" />
              </div>
            </div>
          </div>

          <!-- ── TWO COLUMNS FORM ── -->
          <div class="px-5 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- ── KOLOM 1: LANGKAH 1 (SHIFT SENDIRI) ── -->
            <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3.5">
              <div>
                <!-- Column Header -->
                <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                  <span class="text-[10px] sm:text-[11px] font-black text-slate-700 tracking-wide uppercase">
                    LANGKAH 1 &bull; PILIH JADWAL ANDA YANG INGIN DILEPAS
                  </span>
                  <span class="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] whitespace-nowrap">
                    Jadwal Aktif Terdaftar
                  </span>
                </div>

                <!-- Input Pilih Hari & Shift -->
                <div class="mt-3">
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Hari &amp; Shift Anda
                  </label>
                  <select
                    v-model="selectedShiftId"
                    class="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] cursor-pointer shadow-2xs"
                  >
                    <option v-for="s in shiftOptions" :key="s.id" :value="s.id">
                      {{ s.label }}
                    </option>
                  </select>
                </div>

                <!-- Card Info Pemohon & Shift Detail -->
                <div class="mt-3 bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-2xs">
                  <!-- User Header -->
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-[#0284c7] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      {{ userInitials }}
                    </div>
                    <div>
                      <div class="text-xs font-bold text-slate-800 leading-tight">
                        {{ userName }} ({{ userNip }})
                      </div>
                      <div class="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {{ userRole }}
                      </div>
                    </div>
                  </div>

                  <!-- 2 Grid Boxes: Shift & Status Hari -->
                  <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div class="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span class="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        SHIFT
                      </span>
                      <span class="text-xs font-bold text-slate-800 block mt-0.5">
                        {{ currentSelectedShift.shiftName }} ({{ currentSelectedShift.shiftTime }})
                      </span>
                    </div>

                    <div class="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span class="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        STATUS HARI
                      </span>
                      <span class="text-xs font-bold text-emerald-600 block mt-0.5">
                        {{ currentSelectedShift.status }}
                      </span>
                    </div>
                  </div>

                  <!-- Lokasi Penugasan -->
                  <div class="pt-1">
                    <span class="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      LOKASI PENUGASAN
                    </span>
                    <span class="text-xs font-bold text-slate-700 block mt-0.5">
                      {{ currentSelectedShift.lokasi }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Helper Note -->
              <div class="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <Info :size="13" class="text-slate-400 flex-shrink-0" />
                <span>Hanya hari aktif (bukan hari OFF) yang dapat ditukar.</span>
              </div>
            </div>

            <!-- ── KOLOM 2: LANGKAH 2 (REKAN KERJA & ALASAN) ── -->
            <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3.5">
              <div>
                <!-- Column Header -->
                <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                  <span class="text-[10px] sm:text-[11px] font-black text-slate-700 tracking-wide uppercase">
                    LANGKAH 2 &bull; PILIH REKAN KERJA &amp; SHIFT TUJUAN
                  </span>
                  <span class="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                    Filter Kualifikasi Sama
                  </span>
                </div>

                <!-- Input Pilih Rekan Kerja Pengganti -->
                <div class="mt-3">
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Rekan Kerja Pengganti
                  </label>
                  <select
                    v-model="selectedColleagueId"
                    class="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] cursor-pointer shadow-2xs"
                  >
                    <option v-for="c in colleagueOptions" :key="c.id" :value="c.id">
                      {{ c.name }} ({{ c.empId }}) — {{ c.role }}
                    </option>
                  </select>
                </div>

                <!-- Textarea Alasan Pertukaran Shift -->
                <div class="mt-3">
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    Alasan Pertukaran Shift
                  </label>
                  <textarea
                    v-model="reasonText"
                    rows="3"
                    class="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] shadow-2xs resize-none leading-relaxed"
                    placeholder="Tuliskan alasan pertukaran shift..."
                  ></textarea>
                </div>
              </div>

              <!-- Konfirmasi Persetujuan Notice -->
              <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <span class="text-slate-500 font-medium">Konfirmasi Persetujuan</span>
                <span class="font-bold text-[#0284c7]">Memerlukan Konfirmasi Rekan</span>
              </div>
            </div>
          </div>

          <!-- ── REAL-TIME SOP COMPLIANCE CHECK BANNER ── -->
          <div class="px-5 sm:px-6 pb-4">
            <div class="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-3.5 space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-xs font-black text-[#0284c7] uppercase tracking-wider">
                  <CheckCircle2 :size="15" />
                  <span>REAL-TIME SOP COMPLIANCE CHECK</span>
                </div>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  3 / 3 Kriteria Terpenuhi
                </span>
              </div>

              <!-- 3 Checklist Items -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-sky-100 text-xs font-bold text-slate-700 shadow-2xs">
                  <CheckCircle2 :size="14" class="text-emerald-500 flex-shrink-0" />
                  <span class="truncate">Unit Sama (Operasional)</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-sky-100 text-xs font-bold text-slate-700 shadow-2xs">
                  <CheckCircle2 :size="14" class="text-emerald-500 flex-shrink-0" />
                  <span class="truncate">Tanggal Valid (&gt;24 jam)</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-sky-100 text-xs font-bold text-slate-700 shadow-2xs">
                  <CheckCircle2 :size="14" class="text-emerald-500 flex-shrink-0" />
                  <span class="truncate">Rest Interval &gt;16 Jam</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── MODAL FOOTER ── -->
          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-xs text-slate-600">
              <Radio :size="15" class="text-slate-400 flex-shrink-0" />
              <span>
                Rekan <strong class="text-slate-800">{{ selectedColleague.name }}</strong> akan menerima notifikasi otomatis sebelum diteruskan ke koordinator.
              </span>
            </div>

            <div class="flex items-center justify-end gap-2.5 flex-shrink-0">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                :disabled="isSubmitting"
                @click="submitSwapRequest"
                class="px-4 sm:px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ArrowLeftRight :size="14" />
                <span>Kirim Pengajuan Tukar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
