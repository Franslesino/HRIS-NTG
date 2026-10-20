export interface Employee {
  id: string;
  nip: string;
  nama: string;
  divisi: string;
  jabatan: string;
  kantor: string;
}

export interface Shift {
  id: number;
  code: 'P' | 'S' | 'M' | 'OFF';
  name: string;
  timeRange: string;
  badgeBg: string;
  badgeText: string;
}

export interface RosterTeam {
  id: string;
  orderNum: number;
  title: string;
  divisi: string;
  gedung: string;
  lantai: string;
  startDate: string;
  status: 'Aktif' | 'Draft';
  personelCount: number;
  quotaMax: number;
  members: {
    initials: string;
    name: string;
    bgClass: string;
  }[];
}

export interface ShiftAssignment {
  employeeId: string;
  day: number;
  shiftId: number; // 1: P, 2: S, 3: M, 0: OFF
}
