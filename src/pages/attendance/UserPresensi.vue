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
import { useAuth } from '../../composables/useAuth';
import { useNotifications } from '../../composables/useNotifications';
import { useAttendanceStore, getTodayDateStr } from '../../composables/useAttendanceStore';

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
  if (toastTimeout) clearTimeout(toastTimeout);
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

// Non-Blocking Toast Notification (Pojok Kanan Atas)
const isToastVisible = ref(false);
const toastTitle = ref('');
const toastSubtitle = ref('');
const toastType = ref<'success' | 'warning' | 'info'>('success');
let toastTimeout: any = null;

const triggerToast = (title: string, subtitle: string, type: 'success' | 'warning' | 'info' = 'success') => {
  toastTitle.value = title;
  toastSubtitle.value = subtitle;
  toastType.value = type;
  isToastVisible.value = true;

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    isToastVisible.value = false;
  }, 4000);
};

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
  <div class="user-presensi-page space-y-5 max-w-6xl mx-auto text-slate-800 relative">
    <!-- Breadcrumb & Header Row -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1.5 text-xs text-[#64748b] mb-1">
          <span>Kehadiran &amp; Presensi</span>
          <span class="text-slate-300">&gt;</span>
          <span class="text-[#0284c7] font-semibold">Presensi Mandiri</span>
        </nav>

        <!-- Title & Badge -->
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-2xl font-black text-[#1e293b] tracking-tight">
            Kehadiran &amp; Presensi Pegawai
          </h1>
          <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#e0f2fe] text-[#0284c7] text-xs font-bold border border-[#bae6fd]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
            Presensi Mandiri
          </span>
        </div>

        <p class="text-xs text-[#64748b] mt-1">
          Pencatatan presensi real-time berbasis koordinat GPS dan kepatuhan shift kerja terintegrasi.
        </p>
      </div>

      <!-- Right Action Buttons -->
      <div class="flex items-center gap-2.5 flex-shrink-0">
        <!-- Ajukan Izin / Sakit -->
        <button
          type="button"
          @click="openLeaveModal"
          :disabled="isLeaveActive"
          :class="[
            'h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer',
            isLeaveActive
              ? 'border-blue-200 bg-blue-50 text-blue-700 cursor-default'
              : 'border-[#cbd5e1] bg-white hover:bg-slate-50 text-[#334155] shadow-2xs'
          ]"
        >
          <Calendar :size="15" class="text-blue-600" />
          <span>{{ isLeaveActive ? 'Sedang Izin / Sakit' : 'Ajukan Izin / Sakit' }}</span>
        </button>

        <!-- Panduan Presensi -->
        <button
          type="button"
          @click="isGuideModalOpen = true"
          class="h-9 px-3.5 rounded-xl border border-[#cbd5e1] bg-white hover:bg-slate-50 text-[#334155] text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
        >
          <FileText :size="15" class="text-slate-600" />
          <span>Panduan Presensi</span>
        </button>

        <!-- Unduh Laporan -->
        <button
          type="button"
          @click="handleDownload"
          class="h-9 px-4 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Download :size="15" />
          <span>Unduh Laporan</span>
        </button>
      </div>
    </div>

    <!-- ── BARIS ATAS: 2 CARDS WIDGET (60% KIRI & 40% KANAN) ── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- 1. Card Kiri: Terminal Presensi Mandiri (7 cols) -->
      <div class="lg:col-span-7 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between">
        <!-- Top Row Card Kiri -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-[#1e293b]">Terminal Presensi Mandiri</h3>
            <p class="text-[11px] text-[#94a3b8] mt-0.5">Waktu server BMIS tersinkronisasi otomatis</p>
          </div>

          <!-- Action Testing Helpers -->
          <div class="flex items-center gap-2">
            <!-- Reset Testing Button (Aktif saat dalam sesi uji coba sudah tap atau izin) -->
            <button
              v-if="isTappedIn || isLeaveActive"
              type="button"
              @click="handleTestReset"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
              title="Reset presensi hari ini untuk uji coba ulang tanpa menunggu besok"
            >
              <RotateCcw :size="12" />
              <span>Reset Uji Coba</span>
            </button>

            <!-- Geofence Simulation Quick Tester -->
            <button
              type="button"
              @click="toggleGpsSimulation"
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer',
                isWithinGeofence
                  ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0] hover:bg-emerald-100'
                  : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              ]"
              title="Klik untuk mengubah simulasi jarak GPS"
            >
              <Navigation :size="12" />
              <span>{{ isWithinGeofence ? 'GPS: 15m (Aman)' : 'GPS: 145m (Luar Area)' }}</span>
            </button>
          </div>
        </div>

        <!-- Center Giant Digital Clock -->
        <div class="my-6 text-center">
          <div class="text-4xl sm:text-5xl font-black text-[#0084c4] tracking-tight">
            {{ currentTime || '08:23:42' }} <span class="text-2xl font-bold ml-1">WIB</span>
          </div>
          <div class="flex items-center justify-center gap-1.5 text-xs text-[#64748b] mt-2">
            <Calendar :size="14" class="text-slate-400" />
            <span>{{ currentDate || 'Hari ini' }}</span>
          </div>
        </div>

        <!-- Tombol Aksi: MASUK & KELUAR ATAU STATUS SEDANG IZIN -->
        <div v-if="isLeaveActive" class="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-1">
          <div class="inline-flex items-center gap-2 text-xs font-bold text-blue-800">
            <Info :size="16" class="text-blue-600" />
            <span>STATUS: SEDANG IZIN / SAKIT RESMI</span>
          </div>
          <p class="text-[11.5px] text-blue-700 m-0">
            {{ leaveRecordInfo?.notes || 'Pengajuan izin atau sakit Anda telah tersimpan dan disinkronkan ke monitoring admin.' }}
          </p>
        </div>
        <div v-else class="flex items-center justify-center gap-3">
          <!-- Tombol MASUK (Hanya aktif jika dalam radius <= 100m dan belum tap) -->
          <button
            type="button"
            :disabled="!isWithinGeofence || isTappedIn"
            @click="handleTapIn"
            :class="[
              'w-48 h-11 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all',
              !isWithinGeofence
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : isTappedIn
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default shadow-none'
                  : 'bg-[#0084c4] hover:bg-[#0073ab] text-white cursor-pointer active:scale-98'
            ]"
            :title="!isWithinGeofence ? 'Tombol Masuk non-aktif karena Anda berada di luar radius 100m' : ''"
          >
            <CheckCircle2 v-if="isTappedIn" :size="16" class="text-emerald-600" />
            <LogIn v-else :size="16" />
            <span>{{ isTappedIn ? `MASUK: ${tapInTime ? tapInTime.replace(' WIB', '') : '08:23'} WIB` : 'MASUK' }}</span>
          </button>

          <!-- Tombol KELUAR (Hanya aktif setelah MASUK) -->
          <button
            type="button"
            :disabled="!isTappedIn || isTappedOut"
            @click="handleTapOut"
            class="w-44 h-11 rounded-xl bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#334155] text-xs font-bold flex items-center justify-center gap-2 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-98 cursor-pointer"
          >
            <LogOut :size="16" />
            <span>{{ isTappedOut ? 'SUDAH KELUAR' : 'KELUAR' }}</span>
          </button>
        </div>

        <!-- Footer Geofence Status Pill -->
        <div
          :class="[
            'mt-6 p-2 rounded-xl border text-center text-xs transition-colors',
            isWithinGeofence
              ? 'bg-[#f8fafc] border-[#f1f5f9] text-[#64748b]'
              : 'bg-red-50 border-red-200 text-red-700'
          ]"
        >
          <span
            :class="[
              'w-2 h-2 rounded-full inline-block mr-1.5',
              isWithinGeofence ? 'bg-[#16a34a]' : 'bg-red-500 animate-pulse'
            ]"
          ></span>
          <span v-if="isWithinGeofence">
            Lokasi GPS: <strong class="text-slate-800 font-bold">Menara 1 BTN (Radius {{ userDistanceMeters }}m)</strong> - Terverifikasi
          </span>
          <span v-else>
            Lokasi GPS: <strong class="text-red-700 font-bold">Di Luar Radius ({{ userDistanceMeters }}m &gt; 100m)</strong> - Tombol Masuk Dinonaktifkan
          </span>
        </div>
      </div>

      <!-- 2. Card Kanan: Status Presensi Hari Ini (5 cols) - Real-Time Update -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between">
        <!-- Top Row Card Kanan -->
        <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
          <h3 class="text-sm font-bold text-[#1e293b]">Status Presensi Hari Ini</h3>
          <span class="px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-[11px] font-bold">
            Shift Reguler
          </span>
        </div>

        <!-- 4 Rows Detail Status -->
        <div class="divide-y divide-[#f1f5f9] text-xs py-1">
          <!-- Row 1: Jadwal Shift -->
          <div class="flex items-center justify-between py-2.5">
            <span class="flex items-center gap-2 text-[#64748b] font-medium">
              <Clock :size="14" class="text-slate-400" /> Jadwal Shift:
            </span>
            <span class="font-bold text-[#1e293b]">08:00 - 17:00 WIB</span>
          </div>

          <!-- Row 2: Tap Masuk -->
          <div class="flex items-center justify-between py-2.5">
            <span class="flex items-center gap-2 text-[#64748b] font-medium">
              <ArrowLeft :size="14" class="text-slate-400" /> Tap Masuk:
            </span>
            <span
              :class="[
                'transition-all flex items-center gap-1.5',
                isTappedIn ? (isLate ? 'font-bold text-red-600' : 'font-bold text-slate-900') : 'text-[#94a3b8] font-medium'
              ]"
            >
              <template v-if="tapInTime">
                <span>{{ tapInTime }}</span>
                <span
                  v-if="isLate"
                  class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200"
                >
                  +{{ lateMinutes }}m
                </span>
              </template>
              <template v-else>
                — WIB (Belum Tap)
              </template>
            </span>
          </div>

          <!-- Row 3: Tap Pulang -->
          <div class="flex items-center justify-between py-2.5">
            <span class="flex items-center gap-2 text-[#64748b] font-medium">
              <ArrowRight :size="14" class="text-slate-400" /> Tap Pulang:
            </span>
            <span
              :class="[
                'transition-all',
                isTappedOut ? 'font-bold text-[#0084c4]' : 'text-[#94a3b8] font-medium'
              ]"
            >
              {{ tapOutTime ? tapOutTime : '— WIB (Belum Tap)' }}
            </span>
          </div>

          <!-- Row 4: Status Presensi -->
          <div class="flex items-center justify-between py-2.5">
            <span class="flex items-center gap-2 text-[#64748b] font-medium">
              <CheckCircle2 :size="14" class="text-slate-400" /> Status Presensi:
            </span>
            <div>
              <!-- Sedang Izin / Sakit -->
              <span
                v-if="isLeaveActive"
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold animate-in fade-in duration-200"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Izin / Cuti Resmi
              </span>

              <!-- Belum Tap -->
              <span
                v-else-if="!isTappedIn"
                class="text-[#94a3b8] font-medium"
              >
                (Belum Tap)
              </span>

              <!-- Terlambat -->
              <span
                v-else-if="isLate"
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold animate-in fade-in duration-200"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Terlambat
              </span>

              <!-- Tepat Waktu -->
              <span
                v-else
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0] text-[11px] font-bold animate-in fade-in duration-200"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                Tepat Waktu
              </span>
            </div>
          </div>
        </div>

        <!-- ── INLINE ALERT SESUAI KONDISI (REAL-TIME) ── -->
        <!-- Kondisi 0: Sedang Izin / Sakit -->
        <div
          v-if="isLeaveActive"
          class="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-[11.5px] text-blue-800 leading-relaxed animate-in fade-in duration-200"
        >
          <Info :size="16" class="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong class="font-bold block text-blue-900">Pengajuan Izin / Cuti Terverifikasi</strong>
            <span>{{ leaveRecordInfo?.notes || 'Pengajuan izin atau ketidakhadiran Anda telah tersinkronisasi ke sistem monitoring BMIS.' }}</span>
          </div>
        </div>

        <!-- Kondisi 1: Sebelum Tap (Default Radius Notice) -->
        <div
          v-else-if="!isTappedIn"
          class="mt-4 p-3 rounded-xl bg-[#f0f9ff] border border-[#e0f2fe] flex items-start gap-2.5 text-[11.5px] text-[#0369a1] leading-relaxed"
        >
          <Clock :size="15" class="text-[#0284c7] flex-shrink-0 mt-0.5" />
          <span>Pastikan perangkat Anda berada dalam radius 100 meter dari gardu/lokasi penugasan saat melakukan tap presensi.</span>
        </div>

        <!-- Kondisi 2: Tap Pulang (Selesai Hari Ini) -->
        <div
          v-else-if="isTappedOut"
          class="mt-4 p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-start gap-2.5 text-[11.5px] text-[#15803d] leading-relaxed animate-in fade-in duration-200"
        >
          <CheckCircle2 :size="16" class="text-[#16a34a] flex-shrink-0 mt-0.5" />
          <div>
            <strong class="font-bold block text-emerald-800">Presensi Pulang Berhasil</strong>
            <span>Presensi pulang berhasil dicatat pada {{ tapOutTime }}. Total jam kerja: <strong>{{ totalWorkHours }}</strong>.</span>
          </div>
        </div>

        <!-- Kondisi 3: Terlambat (Merah / Kuning) -->
        <div
          v-else-if="isLate"
          class="mt-4 p-3 rounded-xl bg-[#fff1f2] border border-[#fecdd3] flex items-start gap-2.5 text-[11.5px] text-[#be123c] leading-relaxed animate-in fade-in duration-200"
        >
          <AlertTriangle :size="16" class="text-[#e11d48] flex-shrink-0 mt-0.5" />
          <div>
            <strong class="font-bold block text-red-700">Peringatan Keterlambatan Shift</strong>
            <span>Presensi masuk tercatat pada {{ tapInTime }} (Terlambat {{ lateMinutes }} menit dari jadwal shift).</span>
          </div>
        </div>

        <!-- Kondisi 4: Tepat Waktu (Hijau) -->
        <div
          v-else
          class="mt-4 p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-start gap-2.5 text-[11.5px] text-[#047857] leading-relaxed animate-in fade-in duration-200"
        >
          <CheckCircle2 :size="16" class="text-[#10b981] flex-shrink-0 mt-0.5" />
          <div>
            <strong class="font-bold block text-emerald-800">Presensi Masuk Tepat Waktu</strong>
            <span>Presensi masuk berhasil dicatat pada {{ tapInTime }} di dalam radius gedung.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── BARIS FILTER (PERIODE & STATUS) ── -->
    <div class="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-3 shadow-xs flex flex-wrap items-center gap-3 text-xs">
      <span class="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
        PERIODE:
      </span>
      <select
        v-model="selectedMonthFilter"
        class="h-8 px-3 rounded-lg border border-[#cbd5e1] text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-[#0084c4]"
      >
        <option v-for="opt in monthOptions" :key="opt.value" :value="opt.value">
          {{ opt.text }}
        </option>
      </select>

      <span class="text-[11px] font-bold text-[#64748b] uppercase tracking-wider ml-2">
        STATUS:
      </span>
      <select
        v-model="selectedStatusFilter"
        class="h-8 px-3 rounded-lg border border-[#cbd5e1] text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-[#0084c4]"
      >
        <option value="Semua Status">Semua Status</option>
        <option value="Tepat Waktu">Tepat Waktu</option>
        <option value="Terlambat">Terlambat</option>
        <option value="Izin/Sakit">Izin / Sakit</option>
      </select>

      <button
        type="button"
        @click="applyFilter"
        class="h-8 px-4 rounded-lg bg-[#0084c4] hover:bg-[#0073ab] text-white font-bold transition-colors ml-1"
      >
        Terapkan
      </button>

      <button
        type="button"
        @click="resetFilter"
        class="h-8 px-3 rounded-lg text-[#64748b] hover:text-slate-800 font-semibold hover:bg-slate-50 transition-colors"
      >
        Reset
      </button>
    </div>

    <!-- ── TABEL: DETAIL RIWAYAT KEHADIRAN ── -->
    <div class="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs space-y-4">
      <!-- Header Riwayat -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#f1f5f9] gap-2">
        <div class="flex items-center gap-2">
          <h2 class="text-base font-bold text-[#1e293b]">Detail Riwayat Kehadiran</h2>
          <span class="px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] text-[11px] font-bold border border-slate-200">
            {{ historyLogs.length }} Total Record
          </span>
        </div>
        <div class="flex items-center gap-3 text-xs text-[#94a3b8]">
          <div class="flex items-center gap-1.5">
            <span>Baris per halaman:</span>
            <select
              v-model.number="itemsPerPage"
              @change="currentPage = 1"
              class="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0084c4]"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
            </select>
          </div>
          <span v-if="filteredLogs.length > 0">
            Menampilkan {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredLogs.length) }} dari {{ filteredLogs.length }} riwayat
          </span>
        </div>
      </div>

      <!-- Table Scroll -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse min-w-[850px]">
          <thead>
            <tr class="text-[11px] font-bold text-[#64748b] uppercase tracking-wider border-b border-[#e2e8f0]">
              <th class="py-3 px-3 text-center w-12">#</th>
              <th class="py-3 px-4">TANGGAL &amp; LOKASI</th>
              <th class="py-3 px-4">JADWAL SHIFT</th>
              <th class="py-3 px-4">TAP AKTUAL</th>
              <th class="py-3 px-4">TOTAL JAM</th>
              <th class="py-3 px-4 text-center">STATUS</th>
              <th class="py-3 px-4">CATATAN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f1f5f9]">
            <tr
              v-for="(row, index) in paginatedLogs"
              :key="row.day + '-' + index"
              class="hover:bg-[#f8fafc] transition-colors"
            >
              <!-- 1. # -->
              <td class="py-3.5 px-3 text-center text-[#94a3b8] font-semibold">
                {{ ((currentPage - 1) * itemsPerPage) + index + 1 }}
              </td>

              <!-- 2. Tanggal & Lokasi -->
              <td class="py-3.5 px-4">
                <div class="font-bold text-[#1e293b] text-xs leading-tight">{{ row.day }}</div>
                <div class="text-[11px] text-[#94a3b8] mt-0.5">{{ row.location }}</div>
              </td>

              <!-- 3. Jadwal Shift -->
              <td class="py-3.5 px-4 text-[#475569] font-medium">
                {{ row.shift }}
              </td>

              <!-- 4. Tap Aktual -->
              <td class="py-3.5 px-4 text-[#475569] font-medium">
                {{ row.actual }}
              </td>

              <!-- 5. Total Jam -->
              <td class="py-3.5 px-4 font-bold text-[#1e293b]">
                {{ row.totalHours }}
              </td>

              <!-- 6. Status Pill -->
              <td class="py-3.5 px-4 text-center">
                <span
                  v-if="row.status === 'Terlambat'"
                  class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] text-[11px] font-bold"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                  Terlambat
                </span>
                <span
                  v-else-if="row.status === 'Izin/Sakit'"
                  class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Izin / Sakit
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0] text-[11px] font-bold"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                  Tepat Waktu
                </span>
              </td>

              <!-- 7. Catatan -->
              <td class="py-3.5 px-4 text-[#64748b]">
                {{ row.notes }}
              </td>
            </tr>

            <tr v-if="paginatedLogs.length === 0">
              <td colspan="7" class="py-8 text-center text-[#94a3b8] text-xs">
                Tidak ada riwayat kehadiran yang sesuai dengan filter yang dipilih.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer & Pagination Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b]">
        <div>
          Halaman <strong class="text-slate-800">{{ currentPage }}</strong> dari <strong class="text-slate-800">{{ totalPages }}</strong> (Total {{ filteredLogs.length }} data riwayat)
        </div>

        <div class="inline-flex items-center gap-1.5 self-center sm:self-auto">
          <!-- Tombol Prev -->
          <button
            type="button"
            :disabled="currentPage === 1"
            @click="currentPage--"
            class="h-8 px-2.5 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors cursor-pointer gap-1"
          >
            <ArrowLeft :size="13" />
            <span class="hidden sm:inline">Sebelumnya</span>
          </button>

          <!-- Nomor Halaman -->
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            @click="currentPage = page"
            :class="[
              'w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
              currentPage === page
                ? 'bg-[#0084c4] text-white shadow-xs'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            ]"
          >
            {{ page }}
          </button>

          <!-- Tombol Next -->
          <button
            type="button"
            :disabled="currentPage === totalPages || totalPages === 0"
            @click="currentPage++"
            class="h-8 px-2.5 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors cursor-pointer gap-1"
          >
            <span class="hidden sm:inline">Selanjutnya</span>
            <ArrowRight :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL 1: KONFIRMASI CHECK-OUT (SESUAI GAMBAR DESAIN) ── -->
    <Teleport to="body">
      <div
        v-if="isCheckOutModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
          <!-- Header -->
          <div class="flex items-center justify-between pb-1">
            <h3 class="text-sm font-bold text-[#1e293b]">Konfirmasi Check-Out</h3>
            <button
              type="button"
              @click="isCheckOutModalOpen = false"
              class="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1 rounded-lg"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Icon bulat merah muda & pertanyaan konfirmasi -->
          <div class="text-center pt-2">
            <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto mb-3">
              <LogOut :size="24" class="text-rose-500" />
            </div>
            <h4 class="text-base font-bold text-slate-800">
              Apakah anda ingin Check-Out sekarang?
            </h4>
          </div>

          <!-- List detail jam, shift, estimasi -->
          <div class="space-y-2.5 text-xs text-slate-600 px-1 pt-1">
            <div class="flex items-center gap-2.5">
              <Clock :size="15" class="text-slate-400 flex-shrink-0" />
              <span>Waktu saat ini: <strong class="text-slate-800 font-bold">{{ checkOutDisplayTime }}</strong></span>
            </div>

            <div class="flex items-center gap-2.5">
              <Calendar :size="15" class="text-slate-400 flex-shrink-0" />
              <span>Shift Pagi: <strong class="text-slate-800 font-bold">08:00 - 17:00</strong></span>
            </div>

            <div class="flex items-center gap-2.5">
              <Timer :size="15" class="text-slate-400 flex-shrink-0" />
              <span>Estimasi Jam Kerja: <strong class="text-emerald-600 font-bold">{{ estimatedWorkDuration }}</strong></span>
            </div>

            <!-- Box verifikasi GPS -->
            <div class="mt-3.5 p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center gap-2.5 text-xs text-[#15803d]">
              <Navigation :size="14" class="text-[#16a34a] flex-shrink-0" />
              <span class="font-medium">Sistem akan memverifikasi lokasi GPS kepulangan Anda.</span>
            </div>
          </div>

          <!-- Tombol Aksi -->
          <div class="flex items-center gap-3 pt-3">
            <button
              type="button"
              @click="isCheckOutModalOpen = false"
              class="flex-1 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="confirmCheckOut"
              class="flex-1 h-10 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <LogOut :size="15" />
              <span>Ya, Check-Out sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 1B: ALASAN KETERLAMBATAN MASUK ── -->
    <Teleport to="body">
      <div
        v-if="isLateReasonModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-[#e9ecef]">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                <AlertTriangle :size="16" />
              </div>
              <h3 class="text-sm font-bold text-[#1e293b]">Konfirmasi Alasan Terlambat</h3>
            </div>
            <button type="button" @click="isLateReasonModalOpen = false" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X :size="18" />
            </button>
          </div>

          <p class="text-xs text-[#64748b] leading-relaxed">
            Jadwal shift dimulai pukul <strong>08:00 WIB</strong>. Anda melakukan presensi masuk pukul <strong>{{ currentTime ? currentTime.substring(0, 5) : '08:23' }} WIB</strong> (Terlambat <strong>{{ lateMinutes }} menit</strong>). Harap pilih dan cantumkan keterangan alasan keterlambatan Anda.
          </p>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Kategori Alasan:</label>
              <select
                v-model="lateReasonCategory"
                class="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0084c4]"
              >
                <option value="Kemacetan Lalu Lintas">Kemacetan Lalu Lintas</option>
                <option value="Kendaraan Rusak / Kendala Transportasi">Kendaraan Rusak / Kendala Transportasi</option>
                <option value="Keperluan Keluarga Mendesak">Keperluan Keluarga Mendesak</option>
                <option value="Cuaca Buruk / Hujan Deras">Cuaca Buruk / Hujan Deras</option>
                <option value="Kendala Teknis / GPS Gedung">Kendala Teknis / GPS Gedung</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Keterangan Tambahan / Alasan Detail:</label>
              <textarea
                v-model="lateReasonNotes"
                rows="3"
                placeholder="Contoh: Terjebak macet padat di ruas tol / Ban sepeda motor bocor di jalan..."
                class="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0084c4]"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#e9ecef]">
            <button
              type="button"
              @click="isLateReasonModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitLateReason"
              class="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Simpan &amp; Masuk
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 2: ALASAN PULANG CEPAT (JIKA TAP PULANG < 17:00 WIB) ── -->
    <Teleport to="body">
      <div
        v-if="isEarlyLeaveModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-[#e9ecef]">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <AlertTriangle :size="16" />
              </div>
              <h3 class="text-sm font-bold text-[#1e293b]">Konfirmasi Pulang Cepat</h3>
            </div>
            <button type="button" @click="isEarlyLeaveModalOpen = false" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X :size="18" />
            </button>
          </div>

          <p class="text-xs text-[#64748b] leading-relaxed">
            Shift reguler berakhir pukul <strong>17:00 WIB</strong>. Anda melakukan tap keluar lebih awal (pukul {{ currentTime ? currentTime.substring(0, 5) : '14:31' }} WIB). Harap cantumkan alasan kepulangan lebih awal.
          </p>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Kategori Alasan:</label>
              <select
                v-model="earlyLeaveCategory"
                class="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0084c4]"
              >
                <option value="Izin Sakit">Izin Sakit</option>
                <option value="Keperluan Keluarga Mendesak">Keperluan Keluarga Mendesak</option>
                <option value="Tugas / Dinas Luar Gedung">Tugas / Dinas Luar Gedung</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Keterangan Tambahan / Alasan Detail: <span class="text-red-500">*</span></label>
              <textarea
                v-model="earlyLeaveNotes"
                rows="3"
                placeholder="Contoh: Mengalami demam mendadak / Menghadiri urusan keluarga mendesak..."
                class="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0084c4]"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#e9ecef]">
            <button
              type="button"
              @click="isEarlyLeaveModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitEarlyLeave"
              class="px-5 py-2 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Simpan &amp; Check-Out
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 3: PANDUAN PRESENSI ── -->
    <Teleport to="body">
      <div
        v-if="isGuideModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#e9ecef]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0084c4] flex items-center justify-center">
                <Info :size="16" />
              </div>
              <h3 class="text-sm font-bold text-[#1e293b]">Panduan Presensi Mandiri BMIS</h3>
            </div>
            <button type="button" @click="isGuideModalOpen = false" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X :size="18" />
            </button>
          </div>

          <div class="space-y-3 text-xs text-[#475569] leading-relaxed">
            <div class="p-3 bg-[#f8fafc] rounded-xl border border-slate-100">
              <strong class="text-slate-800 block mb-1">1. Radius GPS Geofence (100 Meter)</strong>
              Pastikan Anda telah mengaktifkan GPS pada smartphone/laptop dan berada di dalam batas radius resmi 100m kantor sebelum menekan tombol <strong>MASUK</strong>.
            </div>
            <div class="p-3 bg-[#f8fafc] rounded-xl border border-slate-100">
              <strong class="text-slate-800 block mb-1">2. Toleransi Shift Pagi (08:00 - 17:00 WIB)</strong>
              Shift dimulai pukul 08:00 WIB. Melakukan tap lewat dari pukul 08:00 WIB akan otomatis tercatat sebagai <strong>Terlambat</strong> dan selisih menitnya dihitung.
            </div>
            <div class="p-3 bg-[#f8fafc] rounded-xl border border-slate-100">
              <strong class="text-slate-800 block mb-1">3. Tap Pulang &amp; Pulang Cepat</strong>
              Tombol <strong>KELUAR</strong> aktif setelah check-in. Jika melakukan tap keluar sebelum 17:00 WIB, wajib mengisi alasan kepulangan lebih awal.
            </div>
          </div>

          <div class="flex justify-end pt-3 border-t border-[#e9ecef]">
            <button
              type="button"
              @click="isGuideModalOpen = false"
              class="px-5 py-2 rounded-xl bg-[#0084c4] text-white text-xs font-bold hover:bg-[#0073ab] cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 4: PENGAJUAN IZIN / SAKIT MANDIRI ── -->
    <Teleport to="body">
      <div
        v-if="isLeaveModalOpen"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between pb-3 border-b border-[#e9ecef]">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Calendar :size="16" />
              </div>
              <h3 class="text-sm font-bold text-[#1e293b]">Pengajuan Izin / Cuti / Sakit</h3>
            </div>
            <button type="button" @click="isLeaveModalOpen = false" class="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X :size="18" />
            </button>
          </div>

          <p class="text-xs text-[#64748b] leading-relaxed">
            Formulir pengajuan ketidakhadiran mandiri. Data akan langsung disinkronkan ke monitoring admin dan status presensi Anda hari ini akan diperbarui.
          </p>

          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Jenis Pengajuan: <span class="text-red-500">*</span></label>
              <select
                v-model="leaveForm.type"
                class="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0084c4]"
              >
                <option value="Izin Sakit">Izin Sakit</option>
                <option value="Cuti Tahunan">Cuti Tahunan</option>
                <option value="Keperluan Keluarga Mendesak">Keperluan Keluarga Mendesak</option>
                <option value="Tugas Dinas Luar">Tugas Dinas Luar</option>
                <option value="Izin Lainnya">Izin Lainnya</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Alasan / Keterangan: <span class="text-red-500">*</span></label>
              <textarea
                v-model="leaveForm.reason"
                rows="3"
                placeholder="Tuliskan alasan pengajuan secara jelas dan lengkap..."
                class="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0084c4]"
              ></textarea>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Unggah Lampiran / Dokumen Pendukung (Opsional):</label>
              <div class="flex items-center gap-2">
                <input
                  ref="fileInputRef"
                  type="file"
                  @change="handleFileSelect"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="fileInputRef?.click()"
                  class="h-9 px-3 rounded-xl border border-dashed border-slate-300 hover:border-[#0084c4] bg-slate-50 hover:bg-white text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Paperclip :size="14" class="text-slate-500" />
                  <span class="max-w-[200px] truncate">{{ leaveForm.attachmentName ? leaveForm.attachmentName : 'Pilih Berkas (PDF / Foto Surat Sakit)' }}</span>
                </button>
                <button
                  v-if="leaveForm.attachmentName"
                  type="button"
                  @click="leaveForm.attachmentName = ''"
                  class="text-xs text-red-500 hover:text-red-700 underline cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#e9ecef]">
            <button
              type="button"
              @click="isLeaveModalOpen = false"
              class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitLeaveRequest"
              class="px-5 py-2 rounded-xl bg-[#0084c4] hover:bg-[#0073ab] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Kirim Pengajuan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── TOAST NOTIFICATION NON-BLOCKING (POJOK KANAN ATAS, AUTO-DISMISS 4 DETIK) ── -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2 translate-x-2"
      enter-to-class="opacity-100 translate-y-0 translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 translate-x-0"
      leave-to-class="opacity-0 -translate-y-2 translate-x-2"
    >
      <div
        v-if="isToastVisible"
        class="fixed top-20 right-6 z-50 max-w-sm bg-white border border-[#e2e8f0] rounded-2xl shadow-xl p-3.5 flex items-start gap-3 pointer-events-auto"
      >
        <div
          :class="[
            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
            toastType === 'warning'
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : toastType === 'info'
                ? 'bg-sky-50 text-sky-600 border border-sky-200'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          ]"
        >
          <AlertTriangle v-if="toastType === 'warning'" :size="18" />
          <Info v-else-if="toastType === 'info'" :size="18" />
          <CheckCircle2 v-else :size="18" />
        </div>

        <div class="flex-1 pr-1">
          <div class="text-xs font-bold text-slate-800 leading-tight">
            {{ toastTitle }}
          </div>
          <div class="text-[11px] text-[#64748b] mt-1 leading-snug">
            {{ toastSubtitle }}
          </div>
          <div class="text-[10px] text-[#94a3b8] mt-1.5 flex items-center gap-1">
            <Clock :size="10" />
            <span>Otomatis hilang (4 detik)</span>
          </div>
        </div>

        <button
          type="button"
          @click="isToastVisible = false"
          class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors -mr-1 -mt-1"
          title="Tutup Notifikasi"
        >
          <X :size="14" />
        </button>
      </div>
    </transition>
  </div>
</template>
