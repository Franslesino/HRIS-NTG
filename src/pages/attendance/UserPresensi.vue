<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import {
  LogIn,
  LogOut,
  Calendar,
  Clock,
  Timer,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Download,
  X,
  Info,
  AlertTriangle,
  Navigation,
  MapPin,
  Paperclip,
  RotateCcw
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuth } from '../../composables/useAuth';
import { useNotifications } from '../../composables/useNotifications';
import { useAttendanceStore, getTodayDateStr } from '../../composables/useAttendanceStore';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';

const { currentUser } = useAuth();
const { addNotification } = useNotifications();
const { recordCheckIn, recordCheckOut, recordLeave, getRecordForUser, resetUserTodayAttendance } = useAttendanceStore();

// ── 1. Jam Digital Realtime & Reset Harian ──
const currentTime = ref('');
const currentDate = ref('');
const lastObservedDateStr = ref('');
let timer: any = null;

// Helper kalkulasi total jam kerja aktual secara dinamis (Tap Out - Tap In)
const calculateWorkDuration = (checkIn: string | null | undefined, checkOut: string | null | undefined): string => {
  if (!checkIn || !checkOut || checkIn === '—' || checkOut === '—') return '—';
  const cleanIn = checkIn.replace(' WIB', '').replace(/\./g, ':').trim();
  const cleanOut = checkOut.replace(' WIB', '').replace(/\./g, ':').trim();
  const inParts = cleanIn.split(':').map(Number);
  const outParts = cleanOut.split(':').map(Number);
  if (isNaN(inParts[0]) || isNaN(outParts[0])) return '—';

  const inMinutes = inParts[0] * 60 + (inParts[1] || 0);
  const outMinutes = outParts[0] * 60 + (outParts[1] || 0);
  const diff = Math.max(0, outMinutes - inMinutes);

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}j ${mins.toString().padStart(2, '0')}m`;
};

const resetTodayState = () => {
  isTappedIn.value = false;
  tapInTime.value = null;
  isTappedOut.value = false;
  tapOutTime.value = null;
  totalWorkHours.value = null;
  isLate.value = false;
  lateMinutes.value = 0;
  isLeaveActive.value = false;
  leaveRecordInfo.value = null;
  if (historyLogs.value && historyLogs.value.length > 0 && historyLogs.value[0].no === 0) {
    historyLogs.value.shift();
  }
};

const updateClock = () => {
  const now = new Date();
  const rawStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  currentTime.value = rawStr.replace(/\./g, ':');
  currentDate.value = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Otomatis reset saat ganti hari (misalnya tab dibiarkan terbuka melewati tengah malam)
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (lastObservedDateStr.value && lastObservedDateStr.value !== todayIso) {
    lastObservedDateStr.value = todayIso;
    resetTodayState();
  } else if (!lastObservedDateStr.value) {
    lastObservedDateStr.value = todayIso;
  }
};

onMounted(() => {
  resetTodayState();
  updateClock();
  timer = setInterval(updateClock, 1000);

  // Restore status absensi hari ini jika sudah pernah tap atau izin HARI INI
  const uid = currentUser.value?.id || 'usr-employee-asep';
  const uname = currentUser.value?.nama || 'Asep Milo';
  const todayStr = getTodayDateStr();
  const existing = getRecordForUser(uid, uname, todayStr);

  if (existing && existing.date === todayStr) {
    if (existing.status === 'LEAVE') {
      isLeaveActive.value = true;
      leaveRecordInfo.value = existing;
      historyLogs.value.unshift({
        no: 0,
        day: currentDate.value || 'Hari ini',
        location: '-',
        shift: '08:00 - 17:00 WIB',
        actual: '— / —',
        totalHours: '—',
        status: 'Izin/Sakit',
        notes: existing.notes || 'Pengajuan Izin Resmi'
      });
    } else if (existing.check_in) {
      isTappedIn.value = true;
      tapInTime.value = existing.check_in.replace(/\./g, ':') + ' WIB';
      isLate.value = existing.status === 'LATE';
      lateMinutes.value = existing.late_duration_minutes;
      if (existing.check_out) {
        isTappedOut.value = true;
        tapOutTime.value = existing.check_out.replace(/\./g, ':') + ' WIB';
      }

      const calculatedHours = (existing.check_in && existing.check_out)
        ? calculateWorkDuration(existing.check_in, existing.check_out)
        : '—';
      totalWorkHours.value = calculatedHours !== '—' ? calculatedHours : null;

      // Masukkan record aktif hari ini ke paling atas riwayat tabel
      historyLogs.value.unshift({
        no: 0,
        day: currentDate.value || 'Hari ini',
        location: existing.location || `Menara 1 BTN (Radius ${userDistanceMeters.value}m)`,
        shift: '08:00 - 17:00 WIB',
        actual: existing.check_out
          ? `${existing.check_in} / ${existing.check_out} WIB`
          : `${existing.check_in} / —`,
        totalHours: calculatedHours,
        status: existing.status === 'LATE' ? 'Terlambat' : 'Tepat Waktu',
        notes: existing.notes || (existing.status === 'LATE' ? `Keterlambatan ${existing.late_duration_minutes} menit` : 'Presensi Terverifikasi')
      });
    }
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// ── 2. Validasi GPS Geofencing (Maksimal 100m) ──
const maxRadiusMeters = 100;
const userDistanceMeters = ref(15); // Default 15m (dalam radius)
const isWithinGeofence = computed(() => userDistanceMeters.value <= maxRadiusMeters);

// Switcher simulasi GPS untuk pengujian kemudahan user/tester
const toggleGpsSimulation = () => {
  if (userDistanceMeters.value <= maxRadiusMeters) {
    userDistanceMeters.value = 145; // Luar radius
    triggerToast(
      'Simulasi GPS: Di Luar Radius (145m)',
      'Jarak melebihi radius 100m. Tombol MASUK otomatis dinonaktifkan.',
      'warning'
    );
  } else {
    userDistanceMeters.value = 15; // Dalam radius
    triggerToast(
      'Simulasi GPS: Dalam Radius (15m)',
      'Lokasi GPS terverifikasi di area Menara 1 BTN. Tombol MASUK aktif.',
      'success'
    );
  }
};

// Reset uji coba presensi hari ini agar user/tester bisa menguji berulang kali
const handleTestReset = () => {
  const uid = currentUser.value?.id || 'usr-employee-asep';
  const uname = currentUser.value?.nama || 'Asep Milo';
  resetUserTodayAttendance(uid, uname);
  resetTodayState();
  triggerToast(
    'Reset Uji Coba Berhasil',
    'Status presensi hari ini telah di-reset ke kondisi awal. Anda bisa melakukan uji coba presensi ulang.',
    'info'
  );
};

// ── 3. State Presensi Interaktif Real-Time ──
const isTappedIn = ref(false);
const tapInTime = ref<string | null>(null);
const isTappedOut = ref(false);
const tapOutTime = ref<string | null>(null);
const totalWorkHours = ref<string | null>(null);

const isLate = ref(false);
const lateMinutes = ref(0);

// Modal Konfirmasi Check-Out (Pop-up Keluar Sesuai Desain BMIS)
const isCheckOutModalOpen = ref(false);

const checkOutDisplayTime = computed(() => {
  return currentTime.value ? currentTime.value.substring(0, 5) + ' WIB' : '17:33 WIB';
});

const estimatedWorkDuration = computed(() => {
  if (tapInTime.value) {
    const rawIn = tapInTime.value.replace(' WIB', '').trim();
    const rawNow = currentTime.value ? currentTime.value.substring(0, 5) : '17:00';
    const dur = calculateWorkDuration(rawIn, rawNow);
    if (dur !== '—') {
      const match = dur.match(/(\d+)j\s*(\d+)m/);
      if (match) {
        return `${parseInt(match[1], 10)} Jam ${parseInt(match[2], 10)} Menit`;
      }
    }
  }
  return '0 Jam 0 Menit';
});

// Modal Pulang Cepat (Jika tap pulang < 17:00 WIB)
const isEarlyLeaveModalOpen = ref(false);
const earlyLeaveCategory = ref('Izin Sakit');
const earlyLeaveNotes = ref('');

// Modal Alasan Keterlambatan Masuk (Jika tap masuk > 08:00 WIB)
const isLateReasonModalOpen = ref(false);
const lateReasonCategory = ref('Kemacetan Lalu Lintas');
const lateReasonNotes = ref('');

// Modal Pengajuan Izin / Cuti / Sakit Mandiri
const isLeaveModalOpen = ref(false);
const isLeaveActive = ref(false);
const leaveRecordInfo = ref<any>(null);
const leaveForm = ref({
  type: 'Izin Sakit',
  reason: '',
  attachmentName: '',
});
const fileInputRef = ref<HTMLInputElement | null>(null);

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    leaveForm.value.attachmentName = target.files[0].name;
  }
};

const openLeaveModal = () => {
  leaveForm.value = {
    type: 'Izin Sakit',
    reason: '',
    attachmentName: '',
  };
  isLeaveModalOpen.value = true;
};

const submitLeaveRequest = () => {
  if (!leaveForm.value.reason.trim()) {
    triggerToast('Peringatan', 'Harap isi keterangan alasan pengajuan izin!', 'warning');
    return;
  }

  const uid = currentUser.value?.id || 'usr-employee-asep';
  const uname = currentUser.value?.nama || 'Asep Milo';
  const ucode = currentUser.value?.nip || 'CS.50101';
  const urole = currentUser.value?.divisi || 'Engineering';

  recordLeave({
    userId: uid,
    userName: uname,
    userCode: ucode,
    roleName: urole,
    leaveType: leaveForm.value.type,
    notes: leaveForm.value.reason.trim(),
    attachmentName: leaveForm.value.attachmentName || undefined,
  });

  isLeaveActive.value = true;
  leaveRecordInfo.value = {
    type: leaveForm.value.type,
    notes: leaveForm.value.reason.trim(),
    attachmentName: leaveForm.value.attachmentName,
  };

  const fullNote = leaveForm.value.attachmentName
    ? `${leaveForm.value.type}: ${leaveForm.value.reason.trim()} [Lampiran: ${leaveForm.value.attachmentName}]`
    : `${leaveForm.value.type}: ${leaveForm.value.reason.trim()}`;

  // Masukkan ke history logs paling atas
  historyLogs.value.unshift({
    no: 0,
    day: currentDate.value || 'Hari ini',
    location: '-',
    shift: '08:00 - 17:00 WIB',
    actual: '— / —',
    totalHours: '—',
    status: 'Izin/Sakit',
    notes: fullNote,
  });

  isLeaveModalOpen.value = false;

  triggerToast(
    'Pengajuan Izin Berhasil Disimpan',
    `Pengajuan ${leaveForm.value.type} Anda telah tersinkronisasi ke monitoring admin.`,
    'success'
  );

  addNotification({
    type: 'info',
    category: 'Pengajuan Izin',
    title: 'Pengajuan Izin Terkirim',
    message: `Pengajuan ${leaveForm.value.type} berhasil diajukan dan disimpan di sistem.`,
    time: currentTime.value ? currentTime.value.substring(0, 5) + ' WIB' : '08:00 WIB',
    timestamp: 'Baru saja',
    badge: leaveForm.value.type,
  });
};

// Toast notification via sonner
const triggerToast = (title: string, subtitle: string, type: 'success' | 'warning' | 'info' = 'success') => {
  const notify = type === 'warning' ? toast.warning : type === 'info' ? toast.info : toast.success;
  notify(title, { description: subtitle });
};

const itemsPerPageModel = computed({
  get: () => String(itemsPerPage.value),
  set: (value: string) => {
    itemsPerPage.value = Number(value);
    currentPage.value = 1;
  },
});

// Modal Panduan Presensi
const isGuideModalOpen = ref(false);

// ── 4. Logic Check-In (MASUK) ──
const handleTapIn = () => {
  if (isTappedIn.value) return;

  // Cek validasi geofence maksimal 100m
  if (!isWithinGeofence.value) {
    triggerToast(
      'Presensi Gagal: Di Luar Radius Geofence',
      `Jarak Anda saat ini (${userDistanceMeters.value}m) melebihi batas radius ${maxRadiusMeters}m dari Menara 1 BTN.`,
      'warning'
    );
    return;
  }

  const rawTime = (currentTime.value ? currentTime.value.substring(0, 5) : '08:23').replace(/\./g, ':');

  // Bandingkan jam tap masuk dengan jam jadwal shift (08:00 WIB)
  const timeParts = rawTime.split(':');
  const h = parseInt(timeParts[0], 10);
  const m = parseInt(timeParts[1], 10);

  if (!isNaN(h) && !isNaN(m)) {
    const totalMinutes = h * 60 + m;
    const shiftStartMinutes = 8 * 60; // 08:00 WIB
    if (totalMinutes > shiftStartMinutes) {
      isLate.value = true;
      lateMinutes.value = totalMinutes - shiftStartMinutes;
    } else {
      isLate.value = false;
      lateMinutes.value = 0;
    }
  } else {
    isLate.value = true;
    lateMinutes.value = 23;
  }

  // Jika terlambat, buka modal alasan keterlambatan terlebih dahulu
  if (isLate.value) {
    lateReasonNotes.value = '';
    isLateReasonModalOpen.value = true;
    return;
  }

  // Jika tepat waktu, langsung proses presensi
  processTapIn('Hadir Tepat Waktu');
};

const submitLateReason = () => {
  const noteContent = lateReasonNotes.value.trim()
    ? `${lateReasonCategory.value}: ${lateReasonNotes.value.trim()}`
    : `${lateReasonCategory.value} (Terlambat ${lateMinutes.value}m)`;

  isLateReasonModalOpen.value = false;
  processTapIn(noteContent);
};

const processTapIn = (reasonNote: string) => {
  isTappedIn.value = true;
  const rawTime = (currentTime.value ? currentTime.value.substring(0, 5) : '08:23').replace(/\./g, ':');
  const formattedTime = rawTime + ' WIB';
  tapInTime.value = formattedTime;

  // Masukkan riwayat ke tabel bawah secara instan
  historyLogs.value.unshift({
    no: 0,
    day: currentDate.value || 'Hari ini',
    location: `Menara 1 BTN (Radius ${userDistanceMeters.value}m)`,
    shift: '08:00 - 17:00 WIB',
    actual: `${tapInTime.value} / —`,
    totalHours: '—',
    status: isLate.value ? 'Terlambat' : 'Tepat Waktu',
    notes: reasonNote
  });

  // Simpan ke shared attendance store (localStorage) agar langsung sinkron ke Admin
  recordCheckIn({
    userId: currentUser.value?.id || 'usr-employee-asep',
    userName: currentUser.value?.nama || 'Asep Milo',
    userCode: currentUser.value?.nip || 'CS.50101',
    roleName: currentUser.value?.divisi || 'Engineering',
    checkInTime: rawTime,
    isLate: isLate.value,
    lateMinutes: lateMinutes.value,
    location: `Menara 1 BTN (Radius ${userDistanceMeters.value}m)`,
    notes: reasonNote,
  });

  // Munculkan toast notification non-blocking di pojok kanan atas
  triggerToast(
    `Presensi Berhasil Dicatat (${tapInTime.value})`,
    reasonNote,
    isLate.value ? 'warning' : 'success'
  );

  // Integrasi ke ikon lonceng alert di navbar atas
  addNotification({
    type: isLate.value ? 'warning' : 'info',
    category: isLate.value ? 'Peringatan Shift' : 'Presensi Masuk',
    title: isLate.value ? 'Peringatan Keterlambatan Presensi' : 'Presensi Masuk Tepat Waktu',
    message: isLate.value
      ? `Presensi masuk tercatat pada ${tapInTime.value} (Terlambat ${lateMinutes.value}m). Alasan: ${reasonNote}`
      : `Presensi masuk berhasil dicatat pada ${tapInTime.value} di dalam radius gedung.`,
    time: tapInTime.value,
    timestamp: 'Baru saja',
    badge: isLate.value ? `Terlambat ${lateMinutes.value}m` : 'Tepat Waktu'
  });
};

// ── 5. Logic Check-Out (KELUAR) ──
const handleTapOut = () => {
  if (!isTappedIn.value || isTappedOut.value) return;
  // Buka pop-up Konfirmasi Check-Out terlebih dahulu sesuai desain BMIS
  isCheckOutModalOpen.value = true;
};

const confirmCheckOut = () => {
  isCheckOutModalOpen.value = false;

  const rawTime = currentTime.value ? currentTime.value.substring(0, 5) : '17:00';
  const timeParts = rawTime.split(':');
  const h = parseInt(timeParts[0], 10);

  // Jika tap pulang dilakukan sebelum shift berakhir (17:00 WIB), alihkan ke modal alasan pulang cepat
  if (!isNaN(h) && h < 17) {
    earlyLeaveNotes.value = '';
    isEarlyLeaveModalOpen.value = true;
    return;
  }

  // Jika jam >= 17:00 WIB, proses langsung
  processCheckOut();
};

const submitEarlyLeave = () => {
  if (!earlyLeaveNotes.value.trim()) {
    triggerToast('Peringatan', 'Harap isi keterangan alasan pulang cepat!', 'warning');
    return;
  }
  isEarlyLeaveModalOpen.value = false;
  processCheckOut(`${earlyLeaveCategory.value} - ${earlyLeaveNotes.value}`);
};

const processCheckOut = (reason?: string) => {
  isTappedOut.value = true;
  const rawTime = (currentTime.value ? currentTime.value.substring(0, 5) : '17:00').replace(/\./g, ':');
  tapOutTime.value = rawTime + ' WIB';

  // Hitung selisih jam kerja dari jam masuk ke jam pulang
  totalWorkHours.value = calculateWorkDuration(tapInTime.value, rawTime);

  const noteContent = reason ? `Pulang Cepat: ${reason}` : historyLogs.value[0]?.notes;

  // Perbarui baris teratas di tabel riwayat
  if (historyLogs.value.length > 0) {
    historyLogs.value[0].actual = `${tapInTime.value} / ${tapOutTime.value}`;
    historyLogs.value[0].totalHours = totalWorkHours.value;
    if (noteContent) {
      historyLogs.value[0].notes = noteContent;
    }
  }

  // Simpan check-out ke shared attendance store (localStorage) agar langsung sinkron ke Admin
  recordCheckOut(
    currentUser.value?.id || 'usr-employee-asep',
    rawTime,
    currentUser.value?.nama || 'Asep Milo',
    noteContent
  );

  // Toast notification non-blocking
  triggerToast(
    `Presensi Pulang Berhasil (${tapOutTime.value})`,
    `Total jam kerja: ${totalWorkHours.value} • ${reason ? 'Pulang Cepat' : 'Shift Selesai'}`,
    'info'
  );

  // Tambahkan log ke lonceng navbar
  addNotification({
    type: 'info',
    category: 'Presensi Pulang',
    title: 'Presensi Pulang Selesai',
    message: `Presensi pulang berhasil dicatat pada ${tapOutTime.value}. Total kerja: ${totalWorkHours.value}${reason ? ` (${reason})` : ''}.`,
    time: tapOutTime.value,
    timestamp: 'Baru saja',
    badge: reason ? 'Pulang Cepat' : 'Check-Out'
  });
};

// ── 6. Filter State Riwayat ──
const now = new Date();
const currentYear = now.getFullYear();
const currentMonthName = now.toLocaleDateString('id-ID', { month: 'long' });

const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const prevMonthName = prevMonthDate.toLocaleDateString('id-ID', { month: 'long' });
const prevMonthYear = prevMonthDate.getFullYear();

const currentMonthLabel = `Bulan ini (${currentMonthName} ${currentYear})`;
const prevMonthLabel = `Bulan Lalu (${prevMonthName} ${prevMonthYear})`;

const monthOptions = [
  { value: currentMonthLabel, text: currentMonthLabel },
  { value: prevMonthLabel, text: prevMonthLabel },
];

const selectedMonthFilter = ref(currentMonthLabel);
const selectedStatusFilter = ref('Semua Status');

// Helper generator tanggal hari-hari sebelumnya secara dinamis
const formatDayDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const weekday = d.toLocaleDateString('id-ID', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('id-ID', { month: 'short' });
  const year = d.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

// Data Riwayat Presensi Dinamis
const historyLogs = ref([
  {
    no: 1,
    day: formatDayDate(1),
    location: 'Menara 1 BTN (Radius 15m)',
    shift: '08:00 - 17:00 WIB',
    actual: '08:30 / 17:00 WIB',
    totalHours: '8j 30m',
    status: 'Terlambat',
    notes: 'Keterlambatan 30 menit',
  },
  {
    no: 2,
    day: formatDayDate(2),
    location: 'Menara 1 BTN (Radius 12m)',
    shift: '08:00 - 17:00 WIB',
    actual: '08:05 / 17:00 WIB',
    totalHours: '8j 55m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
  {
    no: 3,
    day: formatDayDate(3),
    location: 'Menara 1 BTN (Radius 18m)',
    shift: '08:00 - 17:00 WIB',
    actual: '08:25 / 17:00 WIB',
    totalHours: '8j 35m',
    status: 'Terlambat',
    notes: 'Keterlambatan 25 menit',
  },
  {
    no: 4,
    day: formatDayDate(4),
    location: 'Menara 1 BTN (Radius 10m)',
    shift: '08:00 - 17:00 WIB',
    actual: '07:55 / 17:00 WIB',
    totalHours: '9j 05m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
  {
    no: 5,
    day: formatDayDate(5),
    location: 'Menara 1 BTN (Radius 14m)',
    shift: '08:00 - 17:00 WIB',
    actual: '08:00 / 17:00 WIB',
    totalHours: '9j 00m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
  {
    no: 6,
    day: formatDayDate(6),
    location: 'Menara 1 BTN (Radius 11m)',
    shift: '08:00 - 17:00 WIB',
    actual: '07:58 / 17:00 WIB',
    totalHours: '9j 02m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
  {
    no: 7,
    day: formatDayDate(7),
    location: 'Menara 1 BTN (Radius 16m)',
    shift: '08:00 - 17:00 WIB',
    actual: '08:18 / 17:00 WIB',
    totalHours: '8j 42m',
    status: 'Terlambat',
    notes: 'Keterlambatan 18 menit (Kemacetan lalu lintas)',
  },
  {
    no: 8,
    day: formatDayDate(8),
    location: 'Menara 1 BTN (Radius 10m)',
    shift: '08:00 - 17:00 WIB',
    actual: '07:50 / 17:05 WIB',
    totalHours: '9j 15m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
  {
    no: 9,
    day: formatDayDate(9),
    location: '-',
    shift: '08:00 - 17:00 WIB',
    actual: '— / —',
    totalHours: '—',
    status: 'Izin/Sakit',
    notes: 'Izin Sakit: Demam tinggi flu [Surat Dokter Terlampir]',
  },
  {
    no: 10,
    day: formatDayDate(10),
    location: 'Menara 1 BTN (Radius 12m)',
    shift: '08:00 - 17:00 WIB',
    actual: '07:55 / 17:00 WIB',
    totalHours: '9j 05m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
  {
    no: 11,
    day: formatDayDate(11),
    location: 'Menara 1 BTN (Radius 15m)',
    shift: '08:00 - 17:00 WIB',
    actual: '08:00 / 17:00 WIB',
    totalHours: '9j 00m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
  {
    no: 12,
    day: formatDayDate(12),
    location: 'Menara 1 BTN (Radius 14m)',
    shift: '08:00 - 17:00 WIB',
    actual: '07:52 / 17:02 WIB',
    totalHours: '9j 10m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
  {
    no: 13,
    day: formatDayDate(13),
    location: 'Menara 1 BTN (Radius 17m)',
    shift: '08:00 - 17:00 WIB',
    actual: '08:12 / 17:00 WIB',
    totalHours: '8j 48m',
    status: 'Terlambat',
    notes: 'Keterlambatan 12 menit',
  },
  {
    no: 14,
    day: formatDayDate(14),
    location: 'Menara 1 BTN (Radius 9m)',
    shift: '08:00 - 17:00 WIB',
    actual: '07:57 / 17:00 WIB',
    totalHours: '9j 03m',
    status: 'Tepat Waktu',
    notes: 'Presensi Terverifikasi',
  },
]);

const filteredLogs = computed(() => {
  return historyLogs.value.filter(item => {
    if (selectedStatusFilter.value === 'Semua Status') return true;
    return item.status === selectedStatusFilter.value;
  });
});

// ── Pagination State ──
const currentPage = ref(1);
const itemsPerPage = ref(5);

const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / itemsPerPage.value) || 1;
});

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredLogs.value.slice(start, start + itemsPerPage.value);
});

watch([selectedStatusFilter, selectedMonthFilter], () => {
  currentPage.value = 1;
});

const applyFilter = () => {
  triggerToast('Filter Berhasil', 'Filter riwayat kehadiran telah diterapkan.', 'info');
};

const resetFilter = () => {
  selectedStatusFilter.value = 'Semua Status';
  selectedMonthFilter.value = currentMonthLabel;
  triggerToast('Reset Filter', 'Filter riwayat telah dikembalikan ke awal.', 'info');
};

const handleDownload = () => {
  const employeeName = currentUser.value?.nama || 'Asep Milo';
  const nip = currentUser.value?.nip || 'CS.50101';
  const role = currentUser.value?.divisi || 'Engineering';

  // Headers CSV
  const headers = ['No', 'Hari & Tanggal', 'Lokasi Penugasan', 'Jadwal Shift', 'Realisasi Tap', 'Total Jam Kerja', 'Status Kehadiran', 'Catatan / Alasan'];

  const rows = historyLogs.value.map((item, index) => [
    index + 1,
    `"${item.day.replace(/"/g, '""')}"`,
    `"${item.location.replace(/"/g, '""')}"`,
    `"${item.shift.replace(/"/g, '""')}"`,
    `"${item.actual.replace(/"/g, '""')}"`,
    `"${item.totalHours.replace(/"/g, '""')}"`,
    `"${item.status.replace(/"/g, '""')}"`,
    `"${(item.notes || '-').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [
    `"LAPORAN PRESENSI KEHADIRAN PEGAWAI MANDIRI - BMIS"`,
    `"Nama Pegawai: ${employeeName} | NIP: ${nip} | Divisi: ${role}"`,
    `"Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}"`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeDate = new Date().toISOString().slice(0, 10);
  const cleanName = employeeName.replace(/\s+/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Riwayat_Presensi_${cleanName}_${safeDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  triggerToast(
    'Unduh Laporan Berhasil',
    'Berkas riwayat presensi berhasil diunduh dalam format CSV/Excel.',
    'success'
  );
};
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Kehadiran & Presensi Pegawai"
      description="Pencatatan presensi real-time berbasis koordinat GPS dan kepatuhan shift kerja terintegrasi."
      badge="Presensi Mandiri"
      :badge-variant="'info'"
      :breadcrumbs="[{ label: 'Kehadiran & Presensi' }, { label: 'Presensi Mandiri' }]"
    >
      <template #actions>
        <Button
          variant="outline"
          :disabled="isLeaveActive"
          @click="openLeaveModal"
        >
          <Calendar class="text-blue-600" />
          {{ isLeaveActive ? 'Sedang Izin / Sakit' : 'Ajukan Izin / Sakit' }}
        </Button>
        <Button variant="outline" @click="isGuideModalOpen = true">
          <FileText />
          Panduan Presensi
        </Button>
        <Button @click="handleDownload">
          <Download />
          Unduh Laporan
        </Button>
      </template>
    </PageHeader>

    <!-- TERMINAL + STATUS -->
    <div class="grid gap-4 lg:grid-cols-12">
      <!-- Terminal -->
      <Card class="lg:col-span-7">
        <CardHeader class="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1">
            <CardTitle>Terminal Presensi Mandiri</CardTitle>
            <CardDescription>Waktu server BMIS tersinkronisasi otomatis.</CardDescription>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              v-if="isTappedIn || isLeaveActive"
              variant="outline"
              size="xs"
              @click="handleTestReset"
            >
              <RotateCcw />
              Reset Uji Coba
            </Button>
            <button type="button" class="cursor-pointer" @click="toggleGpsSimulation">
              <Badge :variant="isWithinGeofence ? 'success' : 'destructive'" class="gap-1.5">
                <Navigation class="size-3" />
                {{ isWithinGeofence ? 'GPS: 15m (Aman)' : 'GPS: 145m (Luar Area)' }}
              </Badge>
            </button>
          </div>
        </CardHeader>

        <CardContent class="space-y-6">
          <div class="py-2 text-center">
            <div class="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
              {{ currentTime || '08:23:42' }}
              <span class="ml-1 text-2xl font-medium">WIB</span>
            </div>
            <div class="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Calendar class="size-4" />
              <span>{{ currentDate || 'Hari ini' }}</span>
            </div>
          </div>

          <div
            v-if="isLeaveActive"
            class="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center text-blue-800"
          >
            <div class="inline-flex items-center gap-2 text-sm font-semibold">
              <Info class="size-4 text-blue-600" />
              STATUS: SEDANG IZIN / SAKIT RESMI
            </div>
            <p class="text-xs text-blue-700">
              {{ leaveRecordInfo?.notes || 'Pengajuan izin atau sakit Anda telah tersimpan dan disinkronkan ke monitoring admin.' }}
            </p>
          </div>

          <div v-else class="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              class="w-full sm:w-48"
              :variant="isTappedIn ? 'secondary' : 'default'"
              :disabled="!isWithinGeofence || isTappedIn"
              :title="!isWithinGeofence ? 'Tombol Masuk non-aktif karena Anda berada di luar radius 100m' : ''"
              @click="handleTapIn"
            >
              <CheckCircle2 v-if="isTappedIn" class="text-emerald-600" />
              <LogIn v-else />
              {{ isTappedIn ? `MASUK: ${tapInTime ? tapInTime.replace(' WIB', '') : '08:23'} WIB` : 'MASUK' }}
            </Button>

            <Button
              variant="outline"
              size="lg"
              class="w-full sm:w-44"
              :disabled="!isTappedIn || isTappedOut"
              @click="handleTapOut"
            >
              <LogOut />
              {{ isTappedOut ? 'SUDAH KELUAR' : 'KELUAR' }}
            </Button>
          </div>

          <div
            class="rounded-lg border p-2.5 text-center text-xs"
            :class="isWithinGeofence
              ? 'bg-muted/50 text-muted-foreground'
              : 'border-destructive/30 bg-destructive/5 text-destructive'"
          >
            <span
              class="mr-1.5 inline-block size-2 rounded-full"
              :class="isWithinGeofence ? 'bg-emerald-500' : 'animate-pulse bg-destructive'"
            />
            <span v-if="isWithinGeofence">
              Lokasi GPS: <strong class="font-semibold text-foreground">Menara 1 BTN (Radius {{ userDistanceMeters }}m)</strong> - Terverifikasi
            </span>
            <span v-else>
              Lokasi GPS: <strong class="font-semibold">Di Luar Radius ({{ userDistanceMeters }}m &gt; 100m)</strong> - Tombol Masuk Dinonaktifkan
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- Status -->
      <Card class="lg:col-span-5">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 border-b">
          <CardTitle class="text-base">Status Presensi Hari Ini</CardTitle>
          <Badge variant="warning">Shift Reguler</Badge>
        </CardHeader>
        <CardContent class="space-y-4 pt-2">
          <div class="divide-y text-sm">
            <div class="flex items-center justify-between py-2.5">
              <span class="flex items-center gap-2 text-muted-foreground">
                <Clock class="size-4" /> Jadwal Shift
              </span>
              <span class="font-semibold">08:00 - 17:00 WIB</span>
            </div>

            <div class="flex items-center justify-between py-2.5">
              <span class="flex items-center gap-2 text-muted-foreground">
                <ArrowLeft class="size-4" /> Tap Masuk
              </span>
              <span
                class="flex items-center gap-1.5"
                :class="isTappedIn ? (isLate ? 'font-semibold text-destructive' : 'font-semibold') : 'text-muted-foreground'"
              >
                <template v-if="tapInTime">
                  <span>{{ tapInTime }}</span>
                  <Badge v-if="isLate" variant="warning">+{{ lateMinutes }}m</Badge>
                </template>
                <template v-else>
                  — WIB (Belum Tap)
                </template>
              </span>
            </div>

            <div class="flex items-center justify-between py-2.5">
              <span class="flex items-center gap-2 text-muted-foreground">
                <ArrowRight class="size-4" /> Tap Pulang
              </span>
              <span :class="isTappedOut ? 'font-semibold text-primary' : 'text-muted-foreground'">
                {{ tapOutTime ? tapOutTime : '— WIB (Belum Tap)' }}
              </span>
            </div>

            <div class="flex items-center justify-between py-2.5">
              <span class="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 class="size-4" /> Status Presensi
              </span>
              <Badge v-if="isLeaveActive" variant="info">Izin / Cuti Resmi</Badge>
              <span v-else-if="!isTappedIn" class="text-muted-foreground">(Belum Tap)</span>
              <Badge v-else-if="isLate" variant="destructive">Terlambat</Badge>
              <Badge v-else variant="success">Tepat Waktu</Badge>
            </div>
          </div>

          <div
            v-if="isLeaveActive"
            class="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800"
          >
            <Info class="mt-0.5 size-4 shrink-0 text-blue-600" />
            <div>
              <strong class="block font-semibold text-blue-900">Pengajuan Izin / Cuti Terverifikasi</strong>
              <span>{{ leaveRecordInfo?.notes || 'Pengajuan izin atau ketidakhadiran Anda telah tersinkronisasi ke sistem monitoring BMIS.' }}</span>
            </div>
          </div>

          <div
            v-else-if="!isTappedIn"
            class="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-800"
          >
            <Clock class="mt-0.5 size-4 shrink-0 text-sky-600" />
            <span>Pastikan perangkat Anda berada dalam radius 100 meter dari gardu/lokasi penugasan saat melakukan tap presensi.</span>
          </div>

          <div
            v-else-if="isTappedOut"
            class="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800"
          >
            <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div>
              <strong class="block font-semibold text-emerald-900">Presensi Pulang Berhasil</strong>
              <span>Presensi pulang berhasil dicatat pada {{ tapOutTime }}. Total jam kerja: <strong>{{ totalWorkHours }}</strong>.</span>
            </div>
          </div>

          <div
            v-else-if="isLate"
            class="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700"
          >
            <AlertTriangle class="mt-0.5 size-4 shrink-0 text-rose-600" />
            <div>
              <strong class="block font-semibold text-rose-800">Peringatan Keterlambatan Shift</strong>
              <span>Presensi masuk tercatat pada {{ tapInTime }} (Terlambat {{ lateMinutes }} menit dari jadwal shift).</span>
            </div>
          </div>

          <div
            v-else
            class="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800"
          >
            <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div>
              <strong class="block font-semibold text-emerald-900">Presensi Masuk Tepat Waktu</strong>
              <span>Presensi masuk berhasil dicatat pada {{ tapInTime }} di dalam radius gedung.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- FILTER -->
    <Card>
      <CardContent class="flex flex-wrap items-end gap-3 pt-6">
        <div class="space-y-1.5">
          <Label>Periode</Label>
          <Select v-model="selectedMonthFilter">
            <SelectTrigger class="h-9 w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in monthOptions" :key="opt.value" :value="opt.value">
                {{ opt.text }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label>Status</Label>
          <Select v-model="selectedStatusFilter">
            <SelectTrigger class="h-9 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua Status">Semua Status</SelectItem>
              <SelectItem value="Tepat Waktu">Tepat Waktu</SelectItem>
              <SelectItem value="Terlambat">Terlambat</SelectItem>
              <SelectItem value="Izin/Sakit">Izin / Sakit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button class="h-9" @click="applyFilter">
          Terapkan
        </Button>
        <Button variant="ghost" class="h-9" @click="resetFilter">
          Reset
        </Button>

        <div class="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <span>Baris per halaman</span>
          <Select v-model="itemsPerPageModel">
            <SelectTrigger class="h-8 w-[76px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- HISTORY TABLE -->
    <Card>
      <CardHeader class="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2">
          <CardTitle class="text-base">Detail Riwayat Kehadiran</CardTitle>
          <Badge variant="secondary">{{ historyLogs.length }} Total Record</Badge>
        </div>
        <span class="text-xs text-muted-foreground">
          <template v-if="filteredLogs.length > 0">
            Menampilkan {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredLogs.length) }} dari {{ filteredLogs.length }} riwayat
          </template>
        </span>
      </CardHeader>
      <CardContent class="px-0">
        <Table v-if="paginatedLogs.length">
          <TableHeader>
            <TableRow>
              <TableHead class="w-12 pl-6 text-center">#</TableHead>
              <TableHead>Tanggal &amp; Lokasi</TableHead>
              <TableHead>Jadwal Shift</TableHead>
              <TableHead>Tap Aktual</TableHead>
              <TableHead>Total Jam</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="pr-6">Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(row, index) in paginatedLogs" :key="row.day + '-' + index">
              <TableCell class="pl-6 text-center text-muted-foreground">
                {{ ((currentPage - 1) * itemsPerPage) + index + 1 }}
              </TableCell>
              <TableCell>
                <p class="text-sm font-medium">{{ row.day }}</p>
                <p class="text-xs text-muted-foreground">{{ row.location }}</p>
              </TableCell>
              <TableCell>{{ row.shift }}</TableCell>
              <TableCell class="text-muted-foreground">{{ row.actual }}</TableCell>
              <TableCell class="font-semibold">{{ row.totalHours }}</TableCell>
              <TableCell>
                <Badge v-if="row.status === 'Terlambat'" variant="warning">Terlambat</Badge>
                <Badge v-else-if="row.status === 'Izin/Sakit'" variant="info">Izin / Sakit</Badge>
                <Badge v-else variant="success">Tepat Waktu</Badge>
              </TableCell>
              <TableCell class="pr-6 text-muted-foreground">{{ row.notes }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div v-else class="px-6 pb-6">
          <EmptyState
            title="Tidak ada riwayat kehadiran"
            description="Tidak ada data yang sesuai dengan filter yang dipilih."
            :icon="Calendar"
          />
        </div>

        <div class="flex flex-col gap-3 border-t px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span class="text-xs text-muted-foreground">
            Halaman <strong class="text-foreground">{{ currentPage }}</strong> dari
            <strong class="text-foreground">{{ totalPages }}</strong>
            (Total {{ filteredLogs.length }} data riwayat)
          </span>

          <div class="flex items-center gap-1.5">
            <Button variant="outline" size="sm" :disabled="currentPage === 1" @click="currentPage--">
              <ArrowLeft />
              <span class="hidden sm:inline">Sebelumnya</span>
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
              size="sm"
              :disabled="currentPage === totalPages || totalPages === 0"
              @click="currentPage++"
            >
              <span class="hidden sm:inline">Selanjutnya</span>
              <ArrowRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- DIALOG: CHECK-OUT -->
    <Dialog v-model:open="isCheckOutModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-1 ring-rose-100">
            <LogOut class="size-6" />
          </div>
          <DialogTitle class="text-center">Apakah anda ingin Check-Out sekarang?</DialogTitle>
          <DialogDescription class="text-center">
            Pastikan seluruh pekerjaan shift Anda telah selesai sebelum keluar.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-2.5 text-sm text-muted-foreground">
          <div class="flex items-center gap-2.5">
            <Clock class="size-4 shrink-0" />
            <span>Waktu saat ini: <strong class="font-semibold text-foreground">{{ checkOutDisplayTime }}</strong></span>
          </div>
          <div class="flex items-center gap-2.5">
            <Calendar class="size-4 shrink-0" />
            <span>Shift Pagi: <strong class="font-semibold text-foreground">08:00 - 17:00</strong></span>
          </div>
          <div class="flex items-center gap-2.5">
            <Timer class="size-4 shrink-0" />
            <span>Estimasi Jam Kerja: <strong class="font-semibold text-emerald-600">{{ estimatedWorkDuration }}</strong></span>
          </div>
          <div class="mt-2 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <Navigation class="size-4 shrink-0 text-emerald-600" />
            <span>Sistem akan memverifikasi lokasi GPS kepulangan Anda.</span>
          </div>
        </div>

        <DialogFooter class="gap-2 sm:justify-stretch">
          <Button variant="outline" class="flex-1" @click="isCheckOutModalOpen = false">
            Batal
          </Button>
          <Button class="flex-1" @click="confirmCheckOut">
            <LogOut />
            Ya, Check-Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: ALASAN TERLAMBAT -->
    <Dialog v-model:open="isLateReasonModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <AlertTriangle class="size-4 text-rose-500" />
            Konfirmasi Alasan Terlambat
          </DialogTitle>
          <DialogDescription>
            Jadwal shift dimulai pukul 08:00 WIB. Anda melakukan presensi masuk pukul
            {{ currentTime ? currentTime.substring(0, 5) : '08:23' }} WIB
            (Terlambat {{ lateMinutes }} menit).
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3.5">
          <div class="space-y-1.5">
            <Label>Kategori Alasan</Label>
            <Select v-model="lateReasonCategory">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kemacetan Lalu Lintas">Kemacetan Lalu Lintas</SelectItem>
                <SelectItem value="Kendaraan Rusak / Kendala Transportasi">Kendaraan Rusak / Kendala Transportasi</SelectItem>
                <SelectItem value="Keperluan Keluarga Mendesak">Keperluan Keluarga Mendesak</SelectItem>
                <SelectItem value="Cuaca Buruk / Hujan Deras">Cuaca Buruk / Hujan Deras</SelectItem>
                <SelectItem value="Kendala Teknis / GPS Gedung">Kendala Teknis / GPS Gedung</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Keterangan Tambahan</Label>
            <Textarea
              v-model="lateReasonNotes"
              rows="3"
              placeholder="Contoh: Terjebak macet padat di ruas tol / Ban sepeda motor bocor di jalan..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isLateReasonModalOpen = false">
            Batal
          </Button>
          <Button @click="submitLateReason">
            Simpan &amp; Masuk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: PULANG CEPAT -->
    <Dialog v-model:open="isEarlyLeaveModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <AlertTriangle class="size-4 text-amber-500" />
            Konfirmasi Pulang Cepat
          </DialogTitle>
          <DialogDescription>
            Shift reguler berakhir pukul 17:00 WIB. Anda melakukan tap keluar lebih awal
            (pukul {{ currentTime ? currentTime.substring(0, 5) : '14:31' }} WIB).
            Harap cantumkan alasan kepulangan lebih awal.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3.5">
          <div class="space-y-1.5">
            <Label>Kategori Alasan</Label>
            <Select v-model="earlyLeaveCategory">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Izin Sakit">Izin Sakit</SelectItem>
                <SelectItem value="Keperluan Keluarga Mendesak">Keperluan Keluarga Mendesak</SelectItem>
                <SelectItem value="Tugas / Dinas Luar Gedung">Tugas / Dinas Luar Gedung</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Keterangan Tambahan / Alasan Detail <span class="text-destructive">*</span></Label>
            <Textarea
              v-model="earlyLeaveNotes"
              rows="3"
              placeholder="Contoh: Mengalami demam mendadak / Menghadiri urusan keluarga mendesak..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isEarlyLeaveModalOpen = false">
            Batal
          </Button>
          <Button @click="submitEarlyLeave">
            Simpan &amp; Check-Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: PANDUAN -->
    <Dialog v-model:open="isGuideModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Info class="size-4 text-primary" />
            Panduan Presensi Mandiri BMIS
          </DialogTitle>
          <DialogDescription>
            Ikuti langkah berikut agar presensi Anda tercatat valid.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <div class="rounded-lg border bg-muted/40 p-3">
            <strong class="mb-1 block text-foreground">1. Radius GPS Geofence (100 Meter)</strong>
            Pastikan Anda telah mengaktifkan GPS pada smartphone/laptop dan berada di dalam batas radius resmi 100m kantor sebelum menekan tombol <strong>MASUK</strong>.
          </div>
          <div class="rounded-lg border bg-muted/40 p-3">
            <strong class="mb-1 block text-foreground">2. Toleransi Shift Pagi (08:00 - 17:00 WIB)</strong>
            Shift dimulai pukul 08:00 WIB. Melakukan tap lewat dari pukul 08:00 WIB akan otomatis tercatat sebagai <strong>Terlambat</strong> dan selisih menitnya dihitung.
          </div>
          <div class="rounded-lg border bg-muted/40 p-3">
            <strong class="mb-1 block text-foreground">3. Tap Pulang &amp; Pulang Cepat</strong>
            Tombol <strong>KELUAR</strong> aktif setelah check-in. Jika melakukan tap keluar sebelum 17:00 WIB, wajib mengisi alasan kepulangan lebih awal.
          </div>
        </div>

        <DialogFooter>
          <Button @click="isGuideModalOpen = false">
            Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- DIALOG: PENGAJUAN IZIN / SAKIT -->
    <Dialog v-model:open="isLeaveModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Calendar class="size-4 text-blue-600" />
            Pengajuan Izin / Cuti / Sakit
          </DialogTitle>
          <DialogDescription>
            Data akan langsung disinkronkan ke monitoring admin dan status presensi Anda hari ini akan diperbarui.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3.5">
          <div class="space-y-1.5">
            <Label>Jenis Pengajuan <span class="text-destructive">*</span></Label>
            <Select v-model="leaveForm.type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Izin Sakit">Izin Sakit</SelectItem>
                <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
                <SelectItem value="Keperluan Keluarga Mendesak">Keperluan Keluarga Mendesak</SelectItem>
                <SelectItem value="Tugas Dinas Luar">Tugas Dinas Luar</SelectItem>
                <SelectItem value="Izin Lainnya">Izin Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Alasan / Keterangan <span class="text-destructive">*</span></Label>
            <Textarea
              v-model="leaveForm.reason"
              rows="3"
              placeholder="Tuliskan alasan pengajuan secara jelas dan lengkap..."
            />
          </div>

          <div class="space-y-1.5">
            <Label>Unggah Lampiran / Dokumen Pendukung (Opsional)</Label>
            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              @change="handleFileSelect"
            />
            <div class="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                class="min-w-0 flex-1 justify-start"
                @click="fileInputRef?.click()"
              >
                <Paperclip class="shrink-0" />
                <span class="truncate">
                  {{ leaveForm.attachmentName ? leaveForm.attachmentName : 'Pilih Berkas (PDF / Foto Surat Sakit)' }}
                </span>
              </Button>
              <Button
                v-if="leaveForm.attachmentName"
                type="button"
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                @click="leaveForm.attachmentName = ''"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isLeaveModalOpen = false">
            Batal
          </Button>
          <Button @click="submitLeaveRequest">
            Kirim Pengajuan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
