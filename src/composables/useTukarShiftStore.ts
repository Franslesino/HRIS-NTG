import { ref, computed, watch } from 'vue';
import type { TukarShiftItem } from '../types/tukarShift';

const STORAGE_KEY = 'bmis_tukar_shift_requests_v4';

const seedShiftRequests: TukarShiftItem[] = [
  // 1. TS-042 - Asep Milo & Budi Raharjo (Persis Screenshot Row 1)
  {
    id: 'TS-42',
    tiketId: '#TS-202310-042',
    rosterUnit: 'Roster Unit 3',
    hasAccent: true,
    pemohon: {
      initials: 'AM',
      nama: 'Asep Milo',
      empId: 'EMP-018',
      gardu: 'Gardu Cawang',
      jabatan: 'Teknisi Operasional'
    },
    pengganti: {
      initials: 'BR',
      nama: 'Budi Raharjo',
      empId: 'EMP-042',
      gardu: 'Gardu Cawang',
      jabatan: 'Teknisi Gardu Induk'
    },
    pertukaran: [
      { label: 'Shift A', jadwal: 'Min, 8 Okt (00:00 - 08:00)', shiftCode: 'Malam', icon: 'moon' },
      { label: 'Shift B', jadwal: 'Sen, 9 Okt (08:00 - 16:00)', shiftCode: 'Pagi', icon: 'sun' }
    ],
    rekanApproval: {
      approved: true,
      dateStr: '8 Okt 14:20'
    },
    status: 'pending_hr',
    diajukanPadaDate: '8 Okt 2023',
    diajukanPadaTime: '11:15 WIB',
    alasan: 'Keperluan keluarga mendesak di luar kota pada shift Pagi. Mohon bantuannya rekan Budi, terima kasih banyak sebelumnya.'
  },
  // 2. TS-040 - Dewi Wulandari & Rian Hidayat (Persis Screenshot Row 2)
  {
    id: 'TS-40',
    tiketId: '#TS-202310-040',
    rosterUnit: 'Roster Unit 1',
    hasAccent: true,
    pemohon: {
      initials: 'DW',
      nama: 'Dewi Wulandari',
      empId: 'EMP-024',
      gardu: 'Gardu Plumpang',
      jabatan: 'Pengawas Distribusi'
    },
    pengganti: {
      initials: 'RH',
      nama: 'Rian Hidayat',
      empId: 'EMP-031',
      gardu: 'Gardu Plumpang',
      jabatan: 'Pengawas Distribusi'
    },
    pertukaran: [
      { label: 'Shift A', jadwal: 'Sel, 10 Okt (16:00 - 00:00)', shiftCode: 'Siang', icon: 'sun' },
      { label: 'Shift B', jadwal: 'Rab, 11 Okt (08:00 - 16:00)', shiftCode: 'Pagi', icon: 'sun' }
    ],
    rekanApproval: {
      approved: true,
      dateStr: '8 Okt 08:30'
    },
    hrApproval: {
      approved: true,
      approverName: 'Lucia Maria',
      dateStr: '8 Okt 2023 09:40 WIB'
    },
    status: 'approved',
    diajukanPadaDate: '8 Okt 2023',
    diajukanPadaTime: '09:40 WIB',
    alasan: 'Pertukaran jadwal piket shift mingguan terjadwal antar pengawas.'
  },
  // 3. TS-038 - Hendra Saputra & Fajar Anshori (Persis Screenshot Row 3)
  {
    id: 'TS-38',
    tiketId: '#TS-202310-038',
    rosterUnit: 'Roster Unit 2',
    hasAccent: false,
    pemohon: {
      initials: 'HS',
      nama: 'Hendra Saputra',
      empId: 'EMP-012',
      gardu: 'Gardu Gandul',
      jabatan: 'Operator SCADA'
    },
    pengganti: {
      initials: 'FA',
      nama: 'Fajar Anshori',
      empId: 'EMP-015',
      gardu: 'Gardu Gandul',
      jabatan: 'Operator SCADA'
    },
    pertukaran: [
      { label: 'Shift A', jadwal: 'Sab, 7 Okt (08:00 - 16:00)', shiftCode: 'Pagi', icon: 'sun' },
      { label: 'Shift B', jadwal: 'Min, 8 Okt (16:00 - 00:00)', shiftCode: 'Siang', icon: 'sun' }
    ],
    rekanApproval: {
      approved: true,
      dateStr: '7 Okt 12:00'
    },
    hrApproval: {
      approved: true,
      approverName: 'Lucia Maria',
      dateStr: '7 Okt 18:30 WIB'
    },
    status: 'approved',
    diajukanPadaDate: '7 Okt 2023',
    diajukanPadaTime: '14:02 WIB',
    alasan: 'Menghadiri agenda maintenance gardu Gandul.'
  }
];

const loadRequests = (): TukarShiftItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse shift swap requests:', e);
  }
  return JSON.parse(JSON.stringify(seedShiftRequests));
};

const shiftRequests = ref<TukarShiftItem[]>(loadRequests());

watch(
  shiftRequests,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch (e) {
      console.error('Failed to save shift swap requests:', e);
    }
  },
  { deep: true }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      shiftRequests.value = loadRequests();
    }
  });
}

export function useTukarShiftStore() {
  const addShiftRequest = (newItem: TukarShiftItem) => {
    shiftRequests.value.unshift(newItem);
  };

  const approveByRekan = (id: string, note?: string) => {
    const target = shiftRequests.value.find((r) => r.id === id || r.tiketId === id);
    if (target) {
      target.status = 'pending_hr';
      target.rekanApproval = {
        approved: true,
        dateStr: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' +
                 new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        note: note || 'Disetujui oleh rekan'
      };
      return true;
    }
    return false;
  };

  const rejectByRekan = (id: string, note?: string) => {
    const target = shiftRequests.value.find((r) => r.id === id || r.tiketId === id);
    if (target) {
      target.status = 'rejected';
      target.rekanApproval = {
        approved: false,
        dateStr: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' +
                 new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        note: note || 'Ditolak oleh rekan pengganti'
      };
      return true;
    }
    return false;
  };

  const approveByHR = (id: string, approverName: string = 'Lucia Maria', note?: string) => {
    const target = shiftRequests.value.find((r) => r.id === id || r.tiketId === id);
    if (target) {
      target.status = 'approved';
      target.hrApproval = {
        approved: true,
        approverName,
        dateStr: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' +
                 new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        note
      };
      target.catatanAdmin = note || 'Disetujui oleh Admin HR';
      return true;
    }
    return false;
  };

  const rejectByHR = (id: string, note?: string) => {
    const target = shiftRequests.value.find((r) => r.id === id || r.tiketId === id);
    if (target) {
      target.status = 'rejected';
      target.catatanAdmin = note || 'Ditolak oleh Admin HR';
      return true;
    }
    return false;
  };

  const cancelRequest = (id: string) => {
    const target = shiftRequests.value.find((r) => r.id === id || r.tiketId === id);
    if (target) {
      target.status = 'cancelled';
      return true;
    }
    return false;
  };

  return {
    shiftRequests,
    addShiftRequest,
    approveByRekan,
    rejectByRekan,
    approveByHR,
    rejectByHR,
    cancelRequest
  };
}
