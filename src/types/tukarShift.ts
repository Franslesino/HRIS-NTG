export interface SwapPerson {
  initials: string;
  nama: string;
  empId: string;
  gardu: string;
  jabatan: string;
}

export interface ShiftItem {
  label: 'Shift A' | 'Shift B';
  jadwal: string;
  shiftCode?: 'Pagi' | 'Siang' | 'Malam' | 'OFF';
  dateStr?: string;
  timeStr?: string;
  icon?: 'moon' | 'sun';
}

export interface TukarShiftItem {
  id: string;
  tiketId: string;
  rosterUnit: string;
  hasAccent?: boolean;
  pemohon: SwapPerson;
  pengganti: SwapPerson;
  pertukaran: ShiftItem[];
  modelBarter?: 'same_day' | 'different_day';
  rekanApproval?: {
    approved: boolean;
    dateStr: string;
    note?: string;
  };
  hrApproval?: {
    approved: boolean;
    approverName: string;
    dateStr?: string;
    note?: string;
  };
  status: 'pending_rekan' | 'pending_hr' | 'approved' | 'rejected' | 'cancelled';
  diajukanPadaDate: string;
  diajukanPadaTime: string;
  alasan: string;
  catatanAdmin?: string;
}
