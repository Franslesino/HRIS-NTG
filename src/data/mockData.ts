import type { Employee, RosterTeam } from '../types/roster';
import type { AttendanceLog, AttendanceKPI } from '../types/attendance';
import type { OvertimeRequest, OvertimeKPI } from '../types/overtime';

export const mockOffices = [
  'Menara 1 BTN',
  'Kantor Pusat BMIS',
  'Gedung BMIS',
  'Gedung Arsip Cibubur',
  'Gedung R',
  'Gedung Q'
];

export const mockDivisions = [
  'Security',
  'Engineering',
  'House Keeping',
  'Cleaning Service',
  'Manajemen Operasional'
];

export const mockEmployees: Employee[] = [
  { id: "e101", nama: "Ahmad Subagja", nip: "CS.37101", divisi: "Security", jabatan: "Danru Security", kantor: "Menara 1 BTN" },
  { id: "e102", nama: "Bambang Pamungkas", nip: "CS.37105", divisi: "Security", jabatan: "Anggota Security", kantor: "Menara 1 BTN" },
  { id: "e103", nama: "Candra Wijaya", nip: "CS.38942", divisi: "Engineering", jabatan: "Teknisi Listrik", kantor: "Menara 1 BTN" },
  { id: "e104", nama: "Dimas Anggara", nip: "CS.38950", divisi: "Engineering", jabatan: "Teknisi Chiller/HVAC", kantor: "Menara 1 BTN" },
  { id: "e105", nama: "Eko Prasetyo", nip: "CS.38955", divisi: "Engineering", jabatan: "Teknisi Plumbing", kantor: "Menara 1 BTN" },
  { id: "e106", nama: "Siti Rahmawati", nip: "CS.36502", divisi: "House Keeping", jabatan: "Housekeeping Staff", kantor: "Menara 1 BTN" },
  { id: "e107", nama: "Dedi Supriyadi", nip: "CS.34011", divisi: "House Keeping", jabatan: "Leader Kebersihan", kantor: "Menara 1 BTN" },
  { id: "e108", nama: "Agus Prabowo", nip: "CS.37125", divisi: "Security", jabatan: "Danru Security", kantor: "Menara 1 BTN" },
  { id: "e109", nama: "Joko Susilo", nip: "CS.37130", divisi: "Security", jabatan: "Anggota Security", kantor: "Menara 1 BTN" },
  { id: "e110", nama: "Budi Santoso", nip: "CS.38960", divisi: "Engineering", jabatan: "Teknisi Lift", kantor: "Menara 1 BTN" },
  { id: "e111", nama: "Ratna Sari", nip: "CS.36515", divisi: "House Keeping", jabatan: "Housekeeping Staff", kantor: "Menara 1 BTN" },
  { id: "e112", nama: "Hendro Wibowo", nip: "CS.37142", divisi: "Security", jabatan: "Anggota Security", kantor: "Menara 1 BTN" },
  { id: "e113", nama: "Dewi Kartika", nip: "CS.39901", divisi: "Manajemen Operasional", jabatan: "Admin Kantor", kantor: "Menara 1 BTN" },
  { id: "e114", nama: "Wahyu Hidayat", nip: "CS.38977", divisi: "Engineering", jabatan: "Teknisi Genset", kantor: "Menara 1 BTN" },
  { id: "e115", nama: "Slamet Riyadi", nip: "CS.37150", divisi: "Security", jabatan: "Anggota Security", kantor: "Menara 1 BTN" },
  
  // Gedung BMIS
  { id: "e201", nama: "A. Subagja", nip: "CS.40110", divisi: "House Keeping", jabatan: "Leader Housekeeping", kantor: "Gedung BMIS" },
  { id: "e202", nama: "Budi Santoso", nip: "CS.40112", divisi: "House Keeping", jabatan: "Housekeeping Staff", kantor: "Gedung BMIS" },
  { id: "e203", nama: "Dimas Utomo", nip: "CS.40220", divisi: "House Keeping", jabatan: "Housekeeping Staff", kantor: "Gedung BMIS" },
  { id: "e204", nama: "Rian Pratama", nip: "CS.40225", divisi: "House Keeping", jabatan: "Housekeeping Staff", kantor: "Gedung BMIS" },
  { id: "e205", nama: "Hendra N.", nip: "CS.40230", divisi: "House Keeping", jabatan: "Housekeeping Staff", kantor: "Gedung BMIS" },

  // Gedung R
  { id: "e301", nama: "Asep Milo", nip: "CS.50101", divisi: "Engineering", jabatan: "Leader Pelaksana", kantor: "Gedung R" },
  { id: "e302", nama: "Farhan Rizky", nip: "CS.50102", divisi: "Engineering", jabatan: "Teknisi ME", kantor: "Gedung R" },
  { id: "e303", nama: "Danang Kurnia", nip: "CS.50103", divisi: "Engineering", jabatan: "Teknisi ME", kantor: "Gedung R" },
  { id: "e304", nama: "Wahyu Saputra", nip: "CS.50104", divisi: "Engineering", jabatan: "Teknisi Sipil", kantor: "Gedung R" },
  { id: "e305", nama: "Teguh Julianto", nip: "CS.50105", divisi: "Engineering", jabatan: "Teknisi BAS", kantor: "Gedung R" },

  // Gedung Q
  { id: "e401", nama: "Irfan Fadhiil", nip: "CS.60101", divisi: "Cleaning Service", jabatan: "Leader Cleaning", kantor: "Gedung Q" },
  { id: "e402", nama: "Citra Ayu", nip: "CS.60102", divisi: "Cleaning Service", jabatan: "Staff Kebersihan", kantor: "Gedung Q" },
  { id: "e403", nama: "Rian Nugraha", nip: "CS.60103", divisi: "Cleaning Service", jabatan: "Staff Kebersihan", kantor: "Gedung Q" },
  { id: "e404", nama: "Bowo Widodo", nip: "CS.60104", divisi: "Cleaning Service", jabatan: "Staff Kebersihan", kantor: "Gedung Q" },
  { id: "e405", nama: "Eko Prasetyo", nip: "CS.60105", divisi: "Cleaning Service", jabatan: "Staff Kebersihan", kantor: "Gedung Q" },
];

export const mockRosterTeams: RosterTeam[] = [
  {
    id: "team-1",
    orderNum: 1,
    title: "Jadwal Housekeeping",
    divisi: "House Keeping",
    gedung: "Gedung BMIS",
    lantai: "Lantai 3",
    startDate: "01 Nov 2026",
    status: "Aktif",
    personelCount: 5,
    quotaMax: 5,
    members: [
      { initials: "AS", name: "A. Subagja", bgClass: "bg-[#0f172a]" },
      { initials: "BS", name: "Budi", bgClass: "bg-[#0084CC]" },
      { initials: "DU", name: "Dimas", bgClass: "bg-[#0284c7]" },
      { initials: "RP", name: "Rian", bgClass: "bg-[#d97706]" },
      { initials: "HN", name: "Hendra", bgClass: "bg-[#334155]" },
    ]
  },
  {
    id: "team-2",
    orderNum: 2,
    title: "Jadwal Pelaksana",
    divisi: "Pelaksana Engineering",
    gedung: "Gedung R",
    lantai: "Lantai 4",
    startDate: "07 Nov 2026",
    status: "Aktif",
    personelCount: 6,
    quotaMax: 6,
    members: [
      { initials: "AM", name: "Asep Milo", bgClass: "bg-[#0084CC]" },
      { initials: "FR", name: "Farhan", bgClass: "bg-[#0f172a]" },
      { initials: "DK", name: "Danang", bgClass: "bg-[#cbd5e1] text-slate-800" },
      { initials: "WS", name: "Wahyu", bgClass: "bg-[#fbbf24] text-slate-900" },
      { initials: "TJ", name: "Teguh", bgClass: "bg-[#93c5fd] text-slate-900" },
    ]
  },
  {
    id: "team-3",
    orderNum: 3,
    title: "Jadwal Cleaning",
    divisi: "Cleaning Service",
    gedung: "Gedung Q",
    lantai: "Lantai 2",
    startDate: "01 Nov 2026",
    status: "Draft",
    personelCount: 6,
    quotaMax: 6,
    members: [
      { initials: "IF", name: "Irfan Fadhiil", bgClass: "bg-[#94a3b8]" },
      { initials: "CA", name: "Citra", bgClass: "bg-[#e2e8f0] text-slate-700" },
      { initials: "RN", name: "Rian", bgClass: "bg-[#0f172a]" },
      { initials: "BW", name: "Bowo", bgClass: "bg-[#e2e8f0] text-slate-700" },
      { initials: "EK", name: "Eko", bgClass: "bg-[#000000]" },
    ]
  },
  {
    id: "team-4",
    orderNum: 4,
    title: "Jadwal Pelaksana Security 2",
    divisi: "Pelaksana Security",
    gedung: "Gedung A",
    lantai: "Lantai 4",
    startDate: "Oktober 2026",
    status: "Draft",
    personelCount: 10,
    quotaMax: 10,
    members: [
      { initials: "AF", name: "Ahmad Fauzi", bgClass: "bg-slate-700" },
      { initials: "RH", name: "Rudi Hermawan", bgClass: "bg-teal-600" },
      { initials: "DS", name: "Doni Setiawan", bgClass: "bg-emerald-500" },
      { initials: "BS", name: "Bambang Sujatmiko", bgClass: "bg-amber-600" },
      { initials: "HW", name: "Hendra Wijaya", bgClass: "bg-purple-600" },
      { initials: "SR", name: "Siti Rahmawati", bgClass: "bg-rose-600" },
    ]
  }
];

export const mockAttendanceLogs: AttendanceLog[] = [
  { id: "att-1", employeeId: "e101", employeeName: "Ahmad Subagja", nip: "CS.37101", division: "Security", office: "Menara 1 BTN", date: "2026-10-13", shift: "Shift 1 (07:00 - 15:00)", checkIn: "06:48", checkOut: "15:05", status: "Tepat Waktu", location: "Menara 1 BTN (Radius 12m)", verificationStatus: "Terverifikasi" },
  { id: "att-2", employeeId: "e103", employeeName: "Candra Wijaya", nip: "CS.38942", division: "Engineering", office: "Menara 1 BTN", date: "2026-10-13", shift: "Shift 1 (07:00 - 15:00)", checkIn: "07:14", checkOut: "15:10", status: "Terlambat", location: "Menara 1 BTN (Radius 25m)", verificationStatus: "Terverifikasi" },
  { id: "att-3", employeeId: "e106", employeeName: "Siti Rahmawati", nip: "CS.36502", division: "House Keeping", office: "Menara 1 BTN", date: "2026-10-13", shift: "Shift 1 (07:00 - 15:00)", checkIn: "06:55", checkOut: "15:02", status: "Tepat Waktu", location: "Menara 1 BTN (Radius 15m)", verificationStatus: "Terverifikasi" },
  { id: "att-4", employeeId: "e108", employeeName: "Agus Prabowo", nip: "CS.37125", division: "Security", office: "Menara 1 BTN", date: "2026-10-13", shift: "Shift 2 (15:00 - 23:00)", checkIn: null, checkOut: null, status: "Cuti/Izin", location: "-", verificationStatus: "Terverifikasi" },
  { id: "att-5", employeeId: "e110", employeeName: "Budi Santoso", nip: "CS.38960", division: "Engineering", office: "Menara 1 BTN", date: "2026-10-13", shift: "Shift 1 (07:00 - 15:00)", checkIn: "06:50", checkOut: null, status: "Tepat Waktu", location: "Menara 1 BTN (Radius 8m)", verificationStatus: "Menunggu" },
  { id: "att-6", employeeId: "e113", employeeName: "Dewi Kartika", nip: "CS.39901", division: "Manajemen Operasional", office: "Menara 1 BTN", date: "2026-10-13", shift: "Non-Shift (08:00 - 17:00)", checkIn: "07:52", checkOut: null, status: "Tepat Waktu", location: "Menara 1 BTN (Radius 10m)", verificationStatus: "Terverifikasi" },
];

export const mockAttendanceKPI: AttendanceKPI = {
  onTime: 18,
  late: 2,
  leave: 1,
  absent: 0,
  totalEmployees: 21,
};

export const mockOvertimeRequests: OvertimeRequest[] = [
  {
    id: "spkl-001",
    spklNumber: "SPKL/BTN/2026/10/001",
    employeeName: "Candra Wijaya",
    nip: "CS.38942",
    division: "Engineering",
    office: "Menara 1 BTN",
    date: "2026-10-14",
    startTime: "17:00",
    endTime: "21:00",
    durationHours: 4,
    purpose: "Perbaikan darurat modul Chiller lantai 8 dan penggantian inverter pompa",
    stage: "rencana",
    status: "Menunggu Approval",
    isManagerial: false,
    estimatedCost: 185000,
  },
  {
    id: "spkl-002",
    spklNumber: "SPKL/BTN/2026/10/002",
    employeeName: "Ahmad Subagja",
    nip: "CS.37101",
    division: "Security",
    office: "Menara 1 BTN",
    date: "2026-10-12",
    startTime: "15:00",
    endTime: "19:00",
    durationHours: 4,
    purpose: "Pengamanan sterilisasi VIP kunjungan direksi perbankan",
    stage: "realisasi",
    status: "Disetujui",
    isManagerial: false,
    estimatedCost: 175000,
  },
  {
    id: "spkl-003",
    spklNumber: "SPKL/BTN/2026/10/003",
    employeeName: "Dewi Kartika",
    nip: "CS.39901",
    division: "Manajemen Operasional",
    office: "Menara 1 BTN",
    date: "2026-10-15",
    startTime: "17:00",
    endTime: "20:00",
    durationHours: 3,
    purpose: "Rekapitulasi berkas audit tahunan gedung dan SLA vendor",
    stage: "rencana",
    status: "Disetujui",
    isManagerial: true, // Kategori exempt: Rp 0, kompensasi Cuti Pengganti
    estimatedCost: 0,
  },
  {
    id: "spkl-004",
    spklNumber: "SPKL/BTN/2026/10/004",
    employeeName: "Dimas Anggara",
    nip: "CS.38950",
    division: "Engineering",
    office: "Menara 1 BTN",
    date: "2026-10-11",
    startTime: "15:00",
    endTime: "18:00",
    durationHours: 3,
    purpose: "Pemeliharaan panel SDP dan pengetesan genset beban puncak",
    stage: "realisasi",
    status: "Selesai",
    isManagerial: false,
    estimatedCost: 140000,
  }
];

export const mockOvertimeKPI: OvertimeKPI = {
  totalSPKL: 4,
  pendingPlan: 1,
  pendingRealization: 1,
  totalCost: 500000,
};
