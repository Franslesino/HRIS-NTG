export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  nip: string;
  division: string;
  office: string;
  date: string;
  shift: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'Tepat Waktu' | 'Terlambat' | 'Cuti/Izin' | 'Alpa' | 'Hadir';
  location: string;
  verificationStatus: 'Terverifikasi' | 'Menunggu' | 'Ditolak';
}

export interface AttendanceKPI {
  onTime: number;
  late: number;
  leave: number;
  absent: number;
  totalEmployees: number;
}
