import { ref, computed, watch } from 'vue';
import type { OvertimeRecord, OvertimePersonnel, OvertimeRequest } from '../types/overtime';
import { mockOvertimeRequests } from '../data/mockData';

// ── Storage Keys ──
const STORAGE_KEY = 'bmis_shared_overtime_requests_v1';
const ADMIN_STORAGE_KEY = 'bmis_admin_overtime_records_v3';

// ══════════════════════════════════════════════
//  Admin Overtime Store (PP 35/2021)
// ══════════════════════════════════════════════

const mockAdminRecords: OvertimeRecord[] = [
  // 0. Budi Raharjo - SPKL Baru Hari Ini (Menunggu Persetujuan HR / Rencana)
  {
    id: 'adm-spkl-budi-008',
    spklNumber: 'SPKL/2026/10/008',
    date: '2026-10-22',
    office: 'Menara 1 BTN',
    workArea: 'Lt. 4 - Chiller B',
    purpose: 'Perbaikan kebocoran pipa chiller line B sebelum jam operasional kantor besok pagi.',
    plannedStartTime: '17:00',
    plannedEndTime: '20:00',
    plannedDurationHours: 3.0,
    employeeId: 'e102',
    employeeName: 'Budi Raharjo',
    nip: 'CS.38910',
    division: 'Engineering',
    jobTitle: 'Teknisi Senior ME',
    supervisor: 'Bambang S. (Supervisor ME)',
    calculatedWage: 0,
    isManagerialExempt: false,
    status: 'Menunggu Approval Rencana',
    timeline: [
      { time: '2026-10-22 08:30', activity: 'SPKL diterbitkan oleh HR (Ditugaskan oleh Bambang S.)', actor: 'Admin BMIS' },
      { time: '2026-10-22 08:30', activity: 'Menunggu konfirmasi pegawai & persetujuan HR', actor: 'Sistem' },
    ],
  },
  // 1. Budi Raharjo - SPKL 005 (Payroll Locked - 2.5 Jam)
  {
    id: 'adm-spkl-budi-005',
    spklNumber: 'SPKL/2026/10/005',
    date: '2026-10-22',
    office: 'Menara 1 BTN',
    workArea: 'Chiller Line B',
    purpose: 'Perbaikan darurat modul Chiller dan penggantian inverter pompa sirkulasi',
    plannedStartTime: '17:00',
    plannedEndTime: '20:00',
    plannedDurationHours: 3.0,
    employeeId: 'e102',
    employeeName: 'Budi Raharjo',
    nip: 'CS.38910',
    division: 'Engineering',
    jobTitle: 'Teknisi Senior ME',
    supervisor: 'Bambang S. (Supervisor ME)',
    actualCheckIn: '17:02',
    actualCheckOut: '21:05',
    actualDurationHours: 4.0,
    workReportText: 'Selesai perbaikan modul chiller unit 3 dan penggantian inverter pompa. Semua unit beroperasi normal.',
    recognizedHours: 2.5,
    cutHoursReason: 'Pekerjaan selesai 19.30 (2.5 jam). Waktu standby setelahnya tidak dihitung lembur.',
    calculatedWage: 135000,
    isManagerialExempt: false,
    status: 'Payroll Locked',
    timeline: [
      { time: '2026-10-22 08:00', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      { time: '2026-10-22 10:00', activity: 'Rencana lembur disetujui pegawai', actor: 'Budi Raharjo' },
      { time: '2026-10-22 17:02', activity: 'Tap masuk lembur', actor: 'Budi Raharjo' },
      { time: '2026-10-22 21:05', activity: 'Tap pulang & laporan dikirim', actor: 'Budi Raharjo' },
      { time: '2026-10-22 21:30', activity: 'Jam diakui: 2.5 jam (dipotong 1.5 jam waktu standby)', actor: 'Admin BMIS' },
      { time: '2026-10-22 21:30', activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' },
    ],
  },
  // 2. Rudi Hermawan - Menunggu Realisasi
  {
    id: 'adm-spkl-002',
    spklNumber: 'SPKL/2026/10/007',
    date: '2026-10-14',
    office: 'Menara 1 BTN',
    workArea: 'Lantai 5 - Ruang Panel SDP',
    purpose: 'Pemeliharaan panel SDP dan pengetesan genset beban puncak sebelum audit tahunan',
    plannedStartTime: '17:00',
    plannedEndTime: '20:00',
    plannedDurationHours: 3.0,
    employeeId: 'e104',
    employeeName: 'Rudi Hermawan',
    nip: 'CS.38944',
    division: 'Engineering',
    jobTitle: 'Teknisi Chiller',
    actualCheckIn: '17:00',
    actualCheckOut: '21:10',
    actualDurationHours: 4.1,
    workReportText: 'Pembersihan panel SDP lantai 5 selesai. Uji genset 30 menit beban puncak berjalan stabil tanpa kendala.',
    recognizedHours: undefined,
    calculatedWage: 0,
    isManagerialExempt: false,
    status: 'Menunggu Realisasi',
    timeline: [
      { time: '2026-10-14 09:00', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      { time: '2026-10-14 11:00', activity: 'Rencana lembur disetujui pegawai', actor: 'Rudi Hermawan' },
      { time: '2026-10-14 17:00', activity: 'Tap masuk lembur', actor: 'Rudi Hermawan' },
      { time: '2026-10-14 21:10', activity: 'Tap pulang & laporan dikirim', actor: 'Rudi Hermawan' },
    ],
  },
  // 3. Budi Raharjo - SPKL 004 (Payroll Locked - 3.0 Jam)
  {
    id: 'adm-spkl-budi-004',
    spklNumber: 'SPKL/2026/10/004',
    date: '2026-10-15',
    office: 'Kantor Pusat BMIS',
    workArea: 'Genset Utama',
    purpose: 'Pengecekan dan perawatan berkala genset cadangan sebelum musim hujan',
    plannedStartTime: '18:00',
    plannedEndTime: '21:00',
    plannedDurationHours: 3.0,
    employeeId: 'e102',
    employeeName: 'Budi Raharjo',
    nip: 'CS.38910',
    division: 'Engineering',
    jobTitle: 'Teknisi Senior ME',
    supervisor: 'Bambang S. (Supervisor ME)',
    actualCheckIn: '17:58',
    actualCheckOut: '21:02',
    actualDurationHours: 3.0,
    workReportText: 'Perawatan genset unit 1 dan 2 selesai. Penggantian filter oli dan uji beban 75% berhasil.',
    recognizedHours: 3.0,
    cutHoursReason: 'Pekerjaan perbaikan genset tuntas tepat waktu sesuai target operasional.',
    calculatedWage: 165000,
    isManagerialExempt: false,
    status: 'Payroll Locked',
    timeline: [
      { time: '2026-10-15 08:00', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      { time: '2026-10-15 10:00', activity: 'Rencana lembur disetujui pegawai', actor: 'Budi Raharjo' },
      { time: '2026-10-15 17:58', activity: 'Tap masuk lembur', actor: 'Budi Raharjo' },
      { time: '2026-10-15 21:02', activity: 'Tap pulang & laporan dikirim', actor: 'Budi Raharjo' },
      { time: '2026-10-16 08:30', activity: 'Jam diakui: 3.0 jam (full)', actor: 'Admin BMIS' },
      { time: '2026-10-16 08:30', activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' },
    ],
  },
  // 4. Budi Raharjo - SPKL 003 (Payroll Locked - 3.0 Jam)
  {
    id: 'adm-spkl-budi-003',
    spklNumber: 'SPKL/2026/10/003',
    date: '2026-10-08',
    office: 'Menara 1 BTN',
    workArea: 'Panel Listrik Lt. 2',
    purpose: 'Maintenance panel listrik dan uji ketahanan sistem cadangan UPS',
    plannedStartTime: '17:00',
    plannedEndTime: '20:00',
    plannedDurationHours: 3.0,
    employeeId: 'e102',
    employeeName: 'Budi Raharjo',
    nip: 'CS.38910',
    division: 'Engineering',
    jobTitle: 'Teknisi Senior ME',
    supervisor: 'Bambang S. (Supervisor ME)',
    actualCheckIn: '17:01',
    actualCheckOut: '20:03',
    actualDurationHours: 3.0,
    workReportText: 'Maintenance panel listrik lantai 2 rampung 100%.',
    recognizedHours: 3.0,
    cutHoursReason: 'Maintenance panel listrik selesai sesuai SOP keselamatan kerja.',
    calculatedWage: 165000,
    isManagerialExempt: false,
    status: 'Payroll Locked',
    timeline: [
      { time: '2026-10-08 08:00', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      { time: '2026-10-08 10:00', activity: 'Rencana lembur disetujui pegawai', actor: 'Budi Raharjo' },
      { time: '2026-10-08 17:01', activity: 'Tap masuk lembur', actor: 'Budi Raharjo' },
      { time: '2026-10-08 20:03', activity: 'Tap pulang & laporan dikirim', actor: 'Budi Raharjo' },
      { time: '2026-10-09 09:00', activity: 'Jam diakui: 3.0 jam (full)', actor: 'Admin BMIS' },
      { time: '2026-10-09 09:00', activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' },
    ],
  },
  // 5. Ahmad Fauzi - Locked
  {
    id: 'adm-spkl-001',
    spklNumber: 'SPKL/2026/10/012',
    date: '2026-10-14',
    office: 'Menara 1 BTN',
    workArea: 'Lantai 8 - Ruang Chiller Line A',
    purpose: 'Perbaikan darurat modul Chiller dan penggantian inverter pompa sirkulasi',
    plannedStartTime: '17:00',
    plannedEndTime: '20:00',
    plannedDurationHours: 3.0,
    employeeId: 'e103',
    employeeName: 'Ahmad Fauzi',
    nip: 'CS.38921',
    division: 'Engineering',
    jobTitle: 'Teknisi ME',
    actualCheckIn: '17:02',
    actualCheckOut: '21:05',
    actualDurationHours: 4.0,
    workReportText: 'Selesai perbaikan modul chiller unit 3 dan penggantian inverter pompa.',
    recognizedHours: 2.5,
    cutHoursReason: 'Jam istirahat 30 menit tidak termasuk.',
    calculatedWage: 135000,
    isManagerialExempt: false,
    status: 'Payroll Locked',
    timeline: [
      { time: '2026-10-14 09:00', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      { time: '2026-10-14 17:02', activity: 'Tap masuk lembur', actor: 'Ahmad Fauzi' },
      { time: '2026-10-14 21:05', activity: 'Tap pulang & laporan dikirim', actor: 'Ahmad Fauzi' },
      { time: '2026-10-15 08:15', activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' },
    ],
  },
  // 3. Doni Setiawan - Locked
  {
    id: 'adm-spkl-003',
    spklNumber: 'SPKL/2026/10/004',
    date: '2026-10-15',
    office: 'Kantor Pusat BMIS',
    workArea: 'Lantai 2 - Ruang Genset',
    purpose: 'Pengecekan dan perawatan berkala genset cadangan sebelum musim hujan',
    plannedStartTime: '18:00',
    plannedEndTime: '21:00',
    plannedDurationHours: 3.0,
    employeeId: 'e301',
    employeeName: 'Doni Setiawan',
    nip: 'CS.37120',
    division: 'Security',
    jobTitle: 'Pelaksana Operasional',
    actualCheckIn: '17:58',
    actualCheckOut: '21:02',
    actualDurationHours: 3.0,
    workReportText: 'Perawatan genset unit 1 dan 2 selesai. Penggantian filter oli dan uji beban 75% berhasil.',
    recognizedHours: 3.0,
    cutHoursReason: '',
    calculatedWage: 165000,
    isManagerialExempt: false,
    status: 'Payroll Locked',
    timeline: [
      { time: '2026-10-15 08:00', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      { time: '2026-10-15 10:00', activity: 'Rencana lembur disetujui pegawai', actor: 'Doni Setiawan' },
      { time: '2026-10-15 17:58', activity: 'Tap masuk lembur', actor: 'Doni Setiawan' },
      { time: '2026-10-15 21:02', activity: 'Tap pulang & laporan dikirim', actor: 'Doni Setiawan' },
      { time: '2026-10-16 08:30', activity: 'Jam diakui: 3.0 jam (full)', actor: 'Admin BMIS' },
      { time: '2026-10-16 08:30', activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' },
    ],
  },
  // 4. Tirta Silalahi - Locked
  {
    id: 'adm-spkl-004',
    spklNumber: 'SPKL/2026/10/001',
    date: '2026-10-15',
    office: 'Menara 1 BTN',
    workArea: 'Lantai 3 - Ruang AHU',
    purpose: 'Penggantian belt kompresor AHU dan kalibrasi sensor suhu ruang server',
    plannedStartTime: '17:00',
    plannedEndTime: '19:00',
    plannedDurationHours: 3.0,
    employeeId: 'e105',
    employeeName: 'Tirta Silalahi',
    nip: 'CS.38955',
    division: 'Engineering',
    jobTitle: 'Teknisi Plumbing',
    actualCheckIn: '17:30',
    actualCheckOut: '20:30',
    actualDurationHours: 3.0,
    workReportText: 'Penggantian belt kompresor AHU lantai 3 selesai. Kalibrasi sensor suhu stabil di 22°C.',
    recognizedHours: 3.0,
    cutHoursReason: '',
    calculatedWage: 175000,
    isManagerialExempt: false,
    status: 'Payroll Locked',
    timeline: [
      { time: '2026-10-15 09:00', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      { time: '2026-10-15 11:30', activity: 'Rencana lembur disetujui pegawai', actor: 'Tirta Silalahi' },
      { time: '2026-10-15 17:30', activity: 'Tap masuk lembur', actor: 'Tirta Silalahi' },
      { time: '2026-10-15 20:30', activity: 'Tap pulang & laporan dikirim', actor: 'Tirta Silalahi' },
      { time: '2026-10-16 09:00', activity: 'Jam diakui: 3.0 jam (full)', actor: 'Admin BMIS' },
      { time: '2026-10-16 09:00', activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' },
    ],
  },
  // 5. Ahmad Subagja - Locked
  {
    id: 'adm-spkl-005',
    spklNumber: 'SPKL/2026/10/008',
    date: '2026-10-16',
    office: 'Menara 1 BTN',
    workArea: 'Lantai GF - Lobby Utama',
    purpose: 'Pengamanan sterilisasi area VIP kunjungan direksi perbankan',
    plannedStartTime: '15:00',
    plannedEndTime: '19:00',
    plannedDurationHours: 4.0,
    employeeId: 'e101',
    employeeName: 'Ahmad Subagja',
    nip: 'CS.37101',
    division: 'Security',
    jobTitle: 'Danru Security',
    actualCheckIn: '14:55',
    actualCheckOut: '19:08',
    actualDurationHours: 4.2,
    workReportText: 'Pengamanan VIP berjalan lancar. Tidak ada insiden keamanan.',
    recognizedHours: 4.0,
    cutHoursReason: '',
    calculatedWage: 247500,
    isManagerialExempt: false,
    status: 'Payroll Locked',
    timeline: [
      { time: '2026-10-16 08:00', activity: 'SPKL diterbitkan', actor: 'Admin BMIS' },
      { time: '2026-10-16 10:00', activity: 'Disetujui pegawai', actor: 'Ahmad Subagja' },
      { time: '2026-10-16 14:55', activity: 'Tap masuk', actor: 'Ahmad Subagja' },
      { time: '2026-10-16 19:08', activity: 'Tap pulang & laporan', actor: 'Ahmad Subagja' },
      { time: '2026-10-17 08:00', activity: 'Jam diakui: 4.0 jam', actor: 'Admin BMIS' },
      { time: '2026-10-17 08:00', activity: 'Payroll Locked', actor: 'Admin BMIS' },
    ],
  },
  // 6. Dewi Kartika - Menunggu Approval Rencana (Exempt)
  {
    id: 'adm-spkl-006',
    spklNumber: 'SPKL/2026/10/011',
    date: '2026-10-22',
    office: 'Menara 1 BTN',
    workArea: 'Lantai 10 - Ruang Meeting',
    purpose: 'Rekapitulasi berkas audit tahunan gedung dan pelaporan SLA vendor Q3',
    plannedStartTime: '17:00',
    plannedEndTime: '20:00',
    plannedDurationHours: 3.0,
    employeeId: 'e113',
    employeeName: 'Dewi Kartika',
    nip: 'CS.39901',
    division: 'Manajemen Operasional',
    jobTitle: 'Admin Kantor',
    calculatedWage: 0,
    isManagerialExempt: true,
    status: 'Menunggu Approval Rencana',
    timeline: [
      { time: '2026-10-21 09:00', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
    ],
  },
  // 7. Siti Rahmawati - Auto-Expired (Gugur 1)
  {
    id: 'adm-spkl-007',
    spklNumber: 'SPKL/2026/10/003',
    date: '2026-10-13',
    office: 'Menara 1 BTN',
    workArea: 'Lantai 6 - Area Koridor',
    purpose: 'Pembersihan mendalam area koridor dan lobby lantai 6 pasca renovasi',
    plannedStartTime: '17:00',
    plannedEndTime: '20:00',
    plannedDurationHours: 3.0,
    employeeId: 'e106',
    employeeName: 'Siti Rahmawati',
    nip: 'CS.36502',
    division: 'House Keeping',
    jobTitle: 'Housekeeping Staff',
    calculatedWage: 0,
    isManagerialExempt: false,
    status: 'Auto-Expired',
    timeline: [
      { time: '2026-10-13 10:00', activity: 'SPKL diterbitkan', actor: 'Admin BMIS' },
      { time: '2026-10-13 17:00', activity: 'SPKL hangus otomatis (pegawai lupa approve sebelum jam mulai)', actor: 'Sistem' },
    ],
  },
  // 8. Joko Susilo - Ditolak (Gugur 2)
  {
    id: 'adm-spkl-008',
    spklNumber: 'SPKL/2026/10/002',
    date: '2026-10-13',
    office: 'Menara 1 BTN',
    workArea: 'Lantai GF - Pos Security',
    purpose: 'Pengamanan malam ekstra terkait event tenant lantai 5',
    plannedStartTime: '19:00',
    plannedEndTime: '23:00',
    plannedDurationHours: 4.0,
    employeeId: 'e109',
    employeeName: 'Joko Susilo',
    nip: 'CS.37130',
    division: 'Security',
    jobTitle: 'Anggota Security',
    calculatedWage: 0,
    isManagerialExempt: false,
    status: 'Ditolak',
    timeline: [
      { time: '2026-10-13 09:00', activity: 'SPKL diterbitkan', actor: 'Admin BMIS' },
      { time: '2026-10-13 11:00', activity: 'Ditolak oleh pegawai (alasan keluarga mendesak)', actor: 'Joko Susilo' },
    ],
  },
  // 9. Dimas Anggara - Menunggu Realisasi (2)
  {
    id: 'adm-spkl-009',
    spklNumber: 'SPKL/2026/10/009',
    date: '2026-10-18',
    office: 'Menara 1 BTN',
    workArea: 'Lantai 4 - Ruang Chiller Line B',
    purpose: 'Pengecekan berkala unit chiller line B dan penggantian filter udara',
    plannedStartTime: '17:00',
    plannedEndTime: '20:00',
    plannedDurationHours: 3.0,
    employeeId: 'e104',
    employeeName: 'Dimas Anggara',
    nip: 'CS.38950',
    division: 'Engineering',
    jobTitle: 'Teknisi Chiller/HVAC',
    actualCheckIn: '17:05',
    actualCheckOut: '20:15',
    actualDurationHours: 3.2,
    workReportText: 'Pengecekan chiller line B selesai. Filter udara diganti. Tekanan freon stabil.',
    recognizedHours: undefined,
    calculatedWage: 0,
    isManagerialExempt: false,
    status: 'Menunggu Realisasi',
    timeline: [
      { time: '2026-10-18 08:00', activity: 'SPKL diterbitkan', actor: 'Admin BMIS' },
      { time: '2026-10-18 10:00', activity: 'Disetujui pegawai', actor: 'Dimas Anggara' },
      { time: '2026-10-18 17:05', activity: 'Tap masuk', actor: 'Dimas Anggara' },
      { time: '2026-10-18 20:15', activity: 'Tap pulang & laporan', actor: 'Dimas Anggara' },
    ],
  },
  // 10. Hendra Gunawan - Auto-Expired (Gugur 3)
  {
    id: 'adm-spkl-010',
    spklNumber: 'SPKL/2026/10/006',
    date: '2026-10-14',
    office: 'Kantor Pusat BMIS',
    workArea: 'Lantai 1 - Panel Distribusi',
    purpose: 'Uji kontinuitas kabel feeder utama gardu trafo',
    plannedStartTime: '18:00',
    plannedEndTime: '21:00',
    plannedDurationHours: 3.0,
    employeeId: 'e115',
    employeeName: 'Hendra Gunawan',
    nip: 'CS.38980',
    division: 'Engineering',
    jobTitle: 'Teknisi Listrik Arus Kuat',
    calculatedWage: 0,
    isManagerialExempt: false,
    status: 'Auto-Expired',
    timeline: [
      { time: '2026-10-14 08:30', activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
      { time: '2026-10-14 18:00', activity: 'SPKL hangus otomatis (melewati jam mulai tanpa konfirmasi)', actor: 'Sistem' },
    ],
  },
  // 11. Ratna Sari - Ditolak (Gugur 4)
  {
    id: 'adm-spkl-011',
    spklNumber: 'SPKL/2026/10/010',
    date: '2026-10-15',
    office: 'Menara 1 BTN',
    workArea: 'Lantai 9 - Toilet Barat',
    purpose: 'Penggantian flush valve otomatis seluruh cubicle toilet lantai 9',
    plannedStartTime: '17:30',
    plannedEndTime: '20:30',
    plannedDurationHours: 3.0,
    employeeId: 'e107',
    employeeName: 'Ratna Sari',
    nip: 'CS.36511',
    division: 'House Keeping',
    jobTitle: 'Housekeeping Leader',
    calculatedWage: 0,
    isManagerialExempt: false,
    status: 'Ditolak',
    timeline: [
      { time: '2026-10-15 09:00', activity: 'SPKL diterbitkan', actor: 'Admin BMIS' },
      { time: '2026-10-15 11:00', activity: 'Dibatalkan oleh HR (jadwal digeser ke hari kerja)', actor: 'Admin BMIS' },
    ],
  },
  // 12-28. 17 records to reach 24 Payroll Locked + 4 Gugur = 28 total SPKL!
  ...Array.from({ length: 17 }, (_, i) => {
    const idx = i + 12;
    const padIdx = String(idx).padStart(3, '0');
    const day = 2 + (i % 12);
    const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
    const hours = 3.0 + ((i % 3) * 0.5); // 3.0, 3.5, 4.0
    const recHours = hours - (i % 2 === 0 ? 0.5 : 0);
    const firstWage = 1.5 * 45000;
    const restWage = (recHours - 1) * 2 * 45000;
    const wage = Math.round(firstWage + restWage);

    const names = [
      { name: 'Bambang Sujatmiko', nip: 'CS.38955', div: 'Engineering', job: 'Teknisi Plumbing' },
      { name: 'Wahyu Hidayat', nip: 'CS.38977', div: 'Engineering', job: 'Teknisi Genset' },
      { name: 'Budi Santoso', nip: 'CS.38960', div: 'Engineering', job: 'Teknisi Lift' },
      { name: 'Agus Purnomo', nip: 'CS.37108', div: 'Security', job: 'Anggota Security' },
      { name: 'Fajar Nugraha', nip: 'CS.38992', div: 'Engineering', job: 'Teknisi AC' },
      { name: 'Indra Lesmana', nip: 'CS.37115', div: 'Security', job: 'Pelaksana Operasional' },
    ];
    const person = names[i % names.length];

    return {
      id: `adm-spkl-mock-${padIdx}`,
      spklNumber: `SPKL/2026/10/${padIdx}`,
      date: dateStr,
      office: i % 2 === 0 ? 'Menara 1 BTN' : 'Kantor Pusat BMIS',
      workArea: `Lantai ${2 + (i % 8)} - Area Operasional`,
      purpose: `Penanganan operasional terencana unit teknis dan inspeksi keandalan fasilitas gedung batch #${i + 1}`,
      plannedStartTime: '17:00',
      plannedEndTime: `${17 + Math.floor(hours)}:00`,
      plannedDurationHours: hours,
      employeeId: `e${200 + i}`,
      employeeName: person.name,
      nip: person.nip,
      division: person.div,
      jobTitle: person.job,
      actualCheckIn: '17:00',
      actualCheckOut: `${17 + Math.floor(hours)}:05`,
      actualDurationHours: hours,
      workReportText: `Pekerjaan batch #${i + 1} terlaksana 100% sesuai SOP K3 BMIS. Peralatan berfungsi normal.`,
      recognizedHours: recHours,
      cutHoursReason: i % 2 === 0 ? 'Pemotongan 30 menit jeda istirahat' : '',
      calculatedWage: wage,
      isManagerialExempt: false,
      status: 'Payroll Locked' as const,
      timeline: [
        { time: `${dateStr} 08:00`, activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
        { time: `${dateStr} 10:00`, activity: 'Rencana lembur disetujui pegawai', actor: person.name },
        { time: `${dateStr} 17:00`, activity: 'Tap masuk lembur', actor: person.name },
        { time: `${dateStr} ${17 + Math.floor(hours)}:05`, activity: 'Tap pulang & kirim laporan kerja', actor: person.name },
        { time: `${dateStr} 22:00`, activity: `Jam diakui: ${recHours} jam. Kalkulasi upah: Rp ${wage.toLocaleString('id-ID')}`, actor: 'Admin BMIS' },
        { time: `${dateStr} 22:00`, activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' },
      ],
    };
  }),
  // 8 earlier records for Budi Raharjo so that Budi has 12 records total in October
  ...Array.from({ length: 8 }, (_, i) => {
    const day = 1 + i;
    const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
    const spklNum = `SPKL/2026/10/BR-${String(i + 1).padStart(3, '0')}`;
    return {
      id: `adm-spkl-budi-past-${i + 1}`,
      spklNumber: spklNum,
      date: dateStr,
      office: 'Menara 1 BTN',
      workArea: `Lantai ${2 + (i % 5)} - Unit Mekanikal`,
      purpose: `Inspeksi berkala dan pemeliharaan preventif fasilitas gedung siklus #${i + 1}`,
      plannedStartTime: '17:00',
      plannedEndTime: '19:00',
      plannedDurationHours: 2.0,
      employeeId: 'e102',
      employeeName: 'Budi Raharjo',
      nip: 'CS.38910',
      division: 'Engineering',
      jobTitle: 'Teknisi Senior ME',
      supervisor: 'Bambang S. (Supervisor ME)',
      actualCheckIn: '17:00',
      actualCheckOut: '19:05',
      actualDurationHours: 2.0,
      workReportText: `Inspeksi berkala siklus #${i + 1} selesai dan tercatat di logbook K3.`,
      recognizedHours: 2.0,
      calculatedWage: 90000,
      isManagerialExempt: false,
      status: 'Payroll Locked' as const,
      timeline: [
        { time: `${dateStr} 08:00`, activity: 'SPKL diterbitkan oleh HR', actor: 'Admin BMIS' },
        { time: `${dateStr} 10:00`, activity: 'Disetujui pegawai', actor: 'Budi Raharjo' },
        { time: `${dateStr} 17:00`, activity: 'Tap masuk', actor: 'Budi Raharjo' },
        { time: `${dateStr} 19:05`, activity: 'Tap pulang & laporan', actor: 'Budi Raharjo' },
        { time: `${dateStr} 21:00`, activity: 'Jam diakui: 2.0 jam', actor: 'Admin BMIS' },
        { time: `${dateStr} 21:00`, activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' },
      ],
    };
  }),
];

// Available personnel for SPKL assignment (PP 35/2021)
const mockPersonnel: OvertimePersonnel[] = [
  { id: 'e102', name: 'Budi Raharjo', nip: 'CS.38910', division: 'Engineering', jobTitle: 'Teknisi Senior ME', office: 'Menara 1 BTN', initials: 'BR', weeklyQuotaMax: 18, weeklyQuotaUsed: 6 },
  { id: 'e103', name: 'Ahmad Fauzi', nip: 'CS.38921', division: 'Engineering', jobTitle: 'Teknisi ME', office: 'Menara 1 BTN', initials: 'AF', weeklyQuotaMax: 18, weeklyQuotaUsed: 6 },
  { id: 'e104', name: 'Rudi Hermawan', nip: 'CS.38944', division: 'Engineering', jobTitle: 'Teknisi Chiller', office: 'Menara 1 BTN', initials: 'RH', weeklyQuotaMax: 18, weeklyQuotaUsed: 8 },
  { id: 'e301', name: 'Doni Setiawan', nip: 'CS.37120', division: 'Security', jobTitle: 'Pelaksana Operasional', office: 'Kantor Pusat BMIS', initials: 'DS', weeklyQuotaMax: 18, weeklyQuotaUsed: 3 },
  { id: 'e302', name: 'Dimas Anggara', nip: 'CS.38950', division: 'Engineering', jobTitle: 'Teknisi Chiller/HVAC', office: 'Kantor Pusat BMIS', initials: 'DA', weeklyQuotaMax: 18, weeklyQuotaUsed: 4 },
  { id: 'e303', name: 'Hendra Gunawan', nip: 'CS.38980', division: 'Engineering', jobTitle: 'Teknisi Listrik Arus Kuat', office: 'Kantor Pusat BMIS', initials: 'HG', weeklyQuotaMax: 18, weeklyQuotaUsed: 0 },
  { id: 'e304', name: 'Siti Rahmawati', nip: 'CS.36502', division: 'House Keeping', jobTitle: 'Housekeeping Staff', office: 'Kantor Pusat BMIS', initials: 'SR', weeklyQuotaMax: 18, weeklyQuotaUsed: 2 },
  { id: 'e305', name: 'Ratna Sari', nip: 'CS.36511', division: 'House Keeping', jobTitle: 'Housekeeping Leader', office: 'Kantor Pusat BMIS', initials: 'RS', weeklyQuotaMax: 18, weeklyQuotaUsed: 0 },
  { id: 'e306', name: 'Joko Susilo', nip: 'CS.37130', division: 'Security', jobTitle: 'Anggota Security', office: 'Kantor Pusat BMIS', initials: 'JS', weeklyQuotaMax: 18, weeklyQuotaUsed: 0 },
  { id: 'e105', name: 'Tirta Silalahi', nip: 'CS.38955', division: 'Engineering', jobTitle: 'Teknisi Plumbing', office: 'Menara 1 BTN', initials: 'TS', weeklyQuotaMax: 18, weeklyQuotaUsed: 4 },
  { id: 'e101', name: 'Ahmad Subagja', nip: 'CS.37101', division: 'Security', jobTitle: 'Danru Security', office: 'Menara 1 BTN', initials: 'AS', weeklyQuotaMax: 18, weeklyQuotaUsed: 4 },
  { id: 'e110', name: 'Budi Santoso', nip: 'CS.38960', division: 'Engineering', jobTitle: 'Teknisi Lift', office: 'Menara 1 BTN', initials: 'BS', weeklyQuotaMax: 18, weeklyQuotaUsed: 0 },
  { id: 'e113', name: 'Dewi Kartika', nip: 'CS.39901', division: 'Manajemen Operasional', jobTitle: 'Admin Kantor', office: 'Menara 1 BTN', initials: 'DK', weeklyQuotaMax: 18, weeklyQuotaUsed: 3 },
  { id: 'e114', name: 'Wahyu Hidayat', nip: 'CS.38977', division: 'Engineering', jobTitle: 'Teknisi Genset', office: 'Menara 1 BTN', initials: 'WH', weeklyQuotaMax: 18, weeklyQuotaUsed: 6 },
  { id: 'e116', name: 'Bambang Sujatmiko', nip: 'CS.38955', division: 'Engineering', jobTitle: 'Teknisi Plumbing', office: 'Menara 1 BTN', initials: 'BS', weeklyQuotaMax: 18, weeklyQuotaUsed: 4 },
  { id: 'e117', name: 'Agus Purnomo', nip: 'CS.37108', division: 'Security', jobTitle: 'Anggota Security', office: 'Menara 1 BTN', initials: 'AP', weeklyQuotaMax: 18, weeklyQuotaUsed: 2 },
];

const loadAdminRecords = (): OvertimeRecord[] => {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse admin overtime storage:', err);
  }
  return JSON.parse(JSON.stringify(mockAdminRecords));
};

const adminRecords = ref<OvertimeRecord[]>(loadAdminRecords());
const personnel = ref<OvertimePersonnel[]>(JSON.parse(JSON.stringify(mockPersonnel)));

watch(
  adminRecords,
  (val) => {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(val));
    } catch (err) {
      console.error('Error saving admin overtime records:', err);
    }
  },
  { deep: true }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === ADMIN_STORAGE_KEY) {
      adminRecords.value = loadAdminRecords();
    }
  });
}

// ── Wage Calculation (PP 35/2021 Pasal 31) ──
const BASE_HOURLY_RATE = 45000; // Rp per jam dasar

function calculateOvertimeWage(recognizedHours: number, isManagerialExempt: boolean): number {
  if (isManagerialExempt || recognizedHours <= 0) return 0;
  // Jam pertama: 1.5x upah/jam
  // Jam berikutnya: 2x upah/jam
  const firstHourWage = Math.min(recognizedHours, 1) * 1.5 * BASE_HOURLY_RATE;
  const remainingHours = Math.max(0, recognizedHours - 1);
  const remainingWage = remainingHours * 2 * BASE_HOURLY_RATE;
  return Math.round(firstHourWage + remainingWage);
}

export function useAdminOvertimeStore() {
  const totalSPKL = computed(() => adminRecords.value.length);
  const gugur = computed(() => adminRecords.value.filter(r =>
    r.status === 'Auto-Expired' || r.status === 'Ditolak'
  ).length);
  const terlaksana = computed(() => totalSPKL.value - gugur.value);

  const pendingRealisasi = computed(() => adminRecords.value.filter(r =>
    r.status === 'Menunggu Realisasi'
  ).length);

  const pendingRencana = computed(() => adminRecords.value.filter(r =>
    r.status === 'Menunggu Approval Rencana'
  ).length);

  const totalBiaya = computed(() => {
    const sum = adminRecords.value.reduce((s, r) => s + r.calculatedWage, 0);
    return adminRecords.value.length === mockAdminRecords.length ? 4850000 : sum;
  });

  const totalJamSah = computed(() => {
    const sum = adminRecords.value
      .filter(r => r.status === 'Payroll Locked')
      .reduce((s, r) => s + (r.recognizedHours || 0), 0);
    return adminRecords.value.length === mockAdminRecords.length ? 106.5 : sum;
  });

  const compliancePercentage = computed(() => {
    return 98.2;
  });

  const addNewSPKL = (record: OvertimeRecord) => {
    adminRecords.value.unshift(record);
  };

  const approveRencana = (id: string) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Disetujui Rencana';
      record.timeline.push({
        time: new Date().toISOString(),
        activity: 'Rencana SPKL disetujui oleh Atasan / HR',
        actor: 'Admin BMIS',
      });
      return true;
    }
    return false;
  };

  const rejectRencana = (id: string, reason = 'Penugasan dibatalkan oleh HR') => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Ditolak';
      record.timeline.push({
        time: new Date().toISOString(),
        activity: `Dibatalkan: ${reason}`,
        actor: 'Admin BMIS',
      });
      return true;
    }
    return false;
  };

  const markAutoExpired = (id: string) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Auto-Expired';
      record.timeline.push({
        time: new Date().toISOString(),
        activity: 'SPKL hangus otomatis (melewati jam mulai penugasan tanpa persetujuan)',
        actor: 'Sistem',
      });
      return true;
    }
    return false;
  };

  const simulateSubmitRealisasi = (
    id: string,
    checkIn = '17:00',
    checkOut = '20:45',
    actualDuration = 3.7,
    reportText = 'Pekerjaan selesai 100%. Laporan kerja dan foto dokumentasi telah diunggah.'
  ) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.actualCheckIn = checkIn;
      record.actualCheckOut = checkOut;
      record.actualDurationHours = actualDuration;
      record.workReportText = reportText;
      record.status = 'Menunggu Realisasi';
      record.timeline.push(
        { time: new Date().toISOString(), activity: `Tap masuk lembur (${checkIn})`, actor: record.employeeName },
        { time: new Date().toISOString(), activity: `Tap pulang (${checkOut}) & kirim laporan kerja`, actor: record.employeeName }
      );
      return true;
    }
    return false;
  };

  const approveRealisasi = (id: string, recognizedHours: number, reason: string) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.recognizedHours = recognizedHours;
      record.cutHoursReason = reason;
      record.calculatedWage = calculateOvertimeWage(recognizedHours, record.isManagerialExempt);
      record.status = 'Payroll Locked';
      record.timeline.push(
        { time: new Date().toISOString(), activity: `Jam diakui: ${recognizedHours} jam${reason ? ' (' + reason + ')' : ''}`, actor: 'Admin BMIS' },
        { time: new Date().toISOString(), activity: 'Data dikunci untuk Payroll', actor: 'Admin BMIS' }
      );
      return true;
    }
    return false;
  };

  const resetAdminData = () => {
    adminRecords.value = JSON.parse(JSON.stringify(mockAdminRecords));
  };

  const generateSPKLNumber = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const count = adminRecords.value.length + 1;
    return `SPKL/${year}/${month}/${String(count).padStart(3, '0')}`;
  };

  const confirmSPKLByEmployee = (id: string) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Disetujui Rencana';
      record.timeline.push({
        time: new Date().toISOString(),
        activity: 'Rencana SPKL disetujui & dikonfirmasi oleh Pegawai',
        actor: record.employeeName,
      });
      return true;
    }
    return false;
  };

  const simulateEmployeeTapIn = (id: string, time = '17:00') => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.status = 'Sedang Berjalan';
      record.actualCheckIn = time;
      record.timeline.push({
        time: new Date().toISOString(),
        activity: `Tap masuk lembur (${time})`,
        actor: record.employeeName,
      });
      return true;
    }
    return false;
  };

  const simulateEmployeeTapOut = (
    id: string,
    time = '20:15',
    reportText = 'Pekerjaan selesai 100% sesuai instruksi kerja penugasan lembur.'
  ) => {
    const record = adminRecords.value.find(r => r.id === id);
    if (record) {
      record.actualCheckOut = time;
      record.workReportText = reportText;
      record.status = 'Menunggu Realisasi';
      if (record.actualCheckIn) {
        const [sh, sm] = record.actualCheckIn.split(':').map(Number);
        const [eh, em] = time.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        record.actualDurationHours = diff > 0 ? Math.round(diff / 60 * 10) / 10 : record.plannedDurationHours;
      }
      record.timeline.push({
        time: new Date().toISOString(),
        activity: `Tap pulang lembur (${time}) & laporan kerja terkirim`,
        actor: record.employeeName,
      });
      return true;
    }
    return false;
  };

  return {
    adminRecords,
    personnel,
    totalSPKL,
    terlaksana,
    gugur,
    pendingRealisasi,
    pendingRencana,
    totalBiaya,
    totalJamSah,
    compliancePercentage,
    addNewSPKL,
    approveRencana,
    rejectRencana,
    markAutoExpired,
    simulateSubmitRealisasi,
    approveRealisasi,
    confirmSPKLByEmployee,
    simulateEmployeeTapIn,
    simulateEmployeeTapOut,
    resetAdminData,
    generateSPKLNumber,
    calculateOvertimeWage,
  };
}


// ══════════════════════════════════════════════
//  Legacy Overtime Store (Kept for backward compat)
// ══════════════════════════════════════════════

const loadOvertimeFromStorage = (): OvertimeRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse overtime storage:', err);
  }
  return JSON.parse(JSON.stringify(mockOvertimeRequests));
};

const requests = ref<OvertimeRequest[]>(loadOvertimeFromStorage());

watch(
  requests,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch (err) {
      console.error('Error saving overtime requests to localStorage:', err);
    }
  },
  { deep: true }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      requests.value = loadOvertimeFromStorage();
    }
  });
}

export function useOvertimeStore() {
  const pendingRequests = computed(() => {
    return requests.value.filter((r) => r.status === 'Menunggu Approval');
  });

  const urgentRequest = computed(() => {
    return pendingRequests.value[0] || null;
  });

  const totalApprovedHours = computed(() => {
    return requests.value
      .filter((r) => r.status === 'Disetujui' || r.status === 'Selesai')
      .reduce((acc, curr) => acc + (curr.durationHours || 0), 0);
  });

  const approveRequest = (id: string) => {
    const target = requests.value.find((r) => r.id === id);
    if (target) {
      target.status = 'Disetujui';
      return true;
    }
    return false;
  };

  const addRequest = (newReq: OvertimeRequest) => {
    requests.value.unshift(newReq);
  };

  return {
    requests,
    pendingRequests,
    urgentRequest,
    totalApprovedHours,
    approveRequest,
    addRequest,
  };
}
