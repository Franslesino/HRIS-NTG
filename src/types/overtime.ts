// ── Tipe Data Modul Lembur / SPKL BMIS ──
// Sesuai alur PP 35/2021 & flowchart BMIS

export type SPKLStatus =
  | 'Draft'
  | 'Menunggu Approval Rencana'
  | 'Disetujui Rencana'
  | 'Ditolak'
  | 'Auto-Expired'
  | 'Sedang Berjalan'
  | 'Menunggu Realisasi'
  | 'Payroll Locked';

export interface TimelineEntry {
  time: string;
  activity: string;
  actor: string;
}

export interface OvertimeRecord {
  id: string;
  spklNumber: string;
  date: string;
  office: string;
  workArea: string;
  purpose: string;

  // Rencana
  plannedStartTime: string;
  plannedEndTime: string;
  plannedDurationHours: number;

  // Pegawai & Atasan
  employeeId: string;
  employeeName: string;
  nip: string;
  division: string;
  jobTitle: string;
  supervisor?: string;

  // Realisasi & Laporan Kerja
  actualCheckIn?: string;
  actualCheckOut?: string;
  actualDurationHours?: number;
  workReportText?: string;
  workReportPhotos?: string[];

  // Evaluasi HR / Atasan
  recognizedHours?: number;
  cutHoursReason?: string;
  calculatedWage: number;
  isManagerialExempt: boolean;

  // Status Alur
  status: SPKLStatus;
  timeline: TimelineEntry[];
}

export interface OvertimePersonnel {
  id: string;
  name: string;
  nip: string;
  division: string;
  jobTitle: string;
  office: string;
  initials: string;
  weeklyQuotaMax: number;     // 18 jam (PP 35/2021)
  weeklyQuotaUsed: number;    // Akumulasi jam minggu ini
  isSelected?: boolean;
}

// Legacy interface kept for backward compatibility
export interface OvertimeRequest {
  id: string;
  spklNumber: string;
  employeeName: string;
  nip: string;
  division: string;
  office: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  purpose: string;
  stage: 'rencana' | 'realisasi';
  status: 'Menunggu Approval' | 'Disetujui' | 'Ditolak' | 'Selesai';
  isManagerial: boolean; // PP 35/2021: Building Manager ke atas exempt upah lembur
  estimatedCost: number;
}

export interface OvertimeKPI {
  totalSPKL: number;
  pendingPlan: number;
  pendingRealization: number;
  totalCost: number;
}
