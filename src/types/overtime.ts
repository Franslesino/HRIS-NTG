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
