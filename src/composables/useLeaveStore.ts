import { ref, computed, watch } from 'vue';

export interface ApprovalStep {
  level: string;
  role: string;
  name?: string;
  status: 'Disetujui' | 'Ditolak' | 'Menunggu';
  statusText: string;
  timestamp?: string;
  notes?: string;
  badge?: string;
  description?: string;
}

export interface LeaveRecord {
  id: string;
  empId: string;
  empName: string;
  initials: string;
  avatarColor: string;
  department: string;
  leaveType: string;
  categoryTag?: string;
  startDate?: string;
  endDate?: string;
  dateRange: string;
  dateRangeLabel?: string;
  durationDays: number;
  shiftLabel?: string;
  status: 'Menunggu HR' | 'Menunggu Approval' | 'Menunggu' | 'Menunggu Surat Dokter' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';
  statusLabel?: string;
  submitDate: string;
  reason: string;
  attachmentName?: string;
  attachmentSize?: string;
  approver?: string;
  rejectionReason?: string;
  processedDate?: string;
  processedBy?: string;
  approvalSteps?: ApprovalStep[];
}

export interface EmployeeQuota {
  empId: string;
  empName: string;
  initials: string;
  avatarColor: string;
  department: string;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  status: 'Aktif' | 'Cuti Panjang';
}

const STORAGE_KEY_LEAVES = 'bmis_shared_leave_records_v4';
const STORAGE_KEY_QUOTAS = 'bmis_shared_quota_records_v4';

// ── DEFAULT INITIAL SEED DATA (KOSONG, MENUNGGU PENGAJUAN NYATA) ──
const defaultSeedLeaves: LeaveRecord[] = [];

const defaultSeedQuotas: EmployeeQuota[] = [
  {
    empId: 'EMP-031',
    empName: 'Asep Milo',
    initials: 'AM',
    avatarColor: 'bg-blue-100 text-blue-700',
    department: 'Housekeeping',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif'
  },
  {
    empId: 'EMP-1001',
    empName: 'Dimas Ukin',
    initials: 'DU',
    avatarColor: 'bg-slate-100 text-slate-700',
    department: 'Operasional Lapangan',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif'
  },
  {
    empId: 'EMP-1002',
    empName: 'Irfan Fadhiil',
    initials: 'IF',
    avatarColor: 'bg-teal-100 text-teal-700',
    department: 'Logistik & Gudang',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif'
  },
  {
    empId: 'EMP-1005',
    empName: 'Farhan Rashidin',
    initials: 'FR',
    avatarColor: 'bg-purple-100 text-purple-700',
    department: 'Operator Alat Berat',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif'
  },
  {
    empId: 'EMP-1008',
    empName: 'Rian Hidayat',
    initials: 'RH',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    department: 'Security',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif'
  },
  {
    empId: 'EMP-1009',
    empName: 'Bagus Wicaksono',
    initials: 'BW',
    avatarColor: 'bg-amber-100 text-amber-700',
    department: 'ME',
    totalQuota: 12,
    usedQuota: 0,
    remainingQuota: 12,
    status: 'Aktif'
  }
];

// ── LOAD & PERSISTENCE ──
const loadLeavesFromStorage = (): LeaveRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEAVES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse leave storage:', err);
  }
  return [...defaultSeedLeaves];
};

const loadQuotasFromStorage = (): EmployeeQuota[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTAS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse quota storage:', err);
  }
  return [...defaultSeedQuotas];
};

// Global singleton reactive state
const leaveRecords = ref<LeaveRecord[]>(loadLeavesFromStorage());
const quotaList = ref<EmployeeQuota[]>(loadQuotasFromStorage());

// Synchronize to localStorage
watch(
  leaveRecords,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(val));
    } catch (err) {
      console.error('Error saving leaves to localStorage', err);
    }
  },
  { deep: true }
);

watch(
  quotaList,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY_QUOTAS, JSON.stringify(val));
    } catch (err) {
      console.error('Error saving quotas to localStorage', err);
    }
  },
  { deep: true }
);

export function useLeaveStore() {
  // Pending records for Admin
  const pendingList = computed(() => {
    return leaveRecords.value.filter(
      (item) =>
        item.status === 'Menunggu HR' ||
        item.status === 'Menunggu Approval' ||
        item.status === 'Menunggu' ||
        item.status === 'Menunggu Surat Dokter'
    );
  });

  // Processed records for Admin
  const historyList = computed(() => {
    return leaveRecords.value.filter(
      (item) => item.status === 'Disetujui' || item.status === 'Ditolak'
    );
  });

  // Get records for a specific employee (used in UserCuti.vue)
  const getUserLeaveHistory = (identifier: string = 'Asep Milo') => {
    const idClean = identifier.toLowerCase().trim();
    return leaveRecords.value.filter((r) => {
      const matchName = r.empName.toLowerCase() === idClean || (idClean.includes('asep') && r.empName.toLowerCase().includes('asep'));
      const matchEmpId = r.empId.toLowerCase() === idClean || (idClean === 'cs.50101' && r.empId === 'EMP-031');
      return matchName || matchEmpId;
    });
  };

  // Get employee quota
  const getUserQuota = (identifier: string = 'Asep Milo') => {
    const idClean = identifier.toLowerCase().trim();
    const found = quotaList.value.find((q) => {
      return (
        q.empName.toLowerCase() === idClean ||
        q.empId.toLowerCase() === idClean ||
        (idClean.includes('asep') && q.empName.toLowerCase().includes('asep')) ||
        (idClean === 'cs.50101' && q.empId === 'EMP-031')
      );
    });
    return (
      found || {
        empId: 'EMP-031',
        empName: 'Asep Milo',
        initials: 'AM',
        avatarColor: 'bg-blue-100 text-blue-700',
        department: 'Housekeeping',
        totalQuota: 12,
        usedQuota: 0,
        remainingQuota: 12,
        status: 'Aktif' as const
      }
    );
  };

  // Add a new leave request (from UserCuti or AdminCuti)
  const addLeaveRequest = (data: Partial<LeaveRecord>): LeaveRecord => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const todayFormatted = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newId =
      data.id ||
      `CT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(leaveRecords.value.length + 10).padStart(4, '0')}`;

    const defaultSteps: ApprovalStep[] = data.approvalSteps || [
      {
        level: 'Level 1 (Supervisor)',
        role: `Supervisor ${data.department || 'Operasional'}`,
        name: `Bpk. Ahmad Fauzi - SPV ${data.department || 'Ops'}`,
        status: 'Disetujui',
        statusText: 'Disetujui',
        timestamp: `${todayFormatted}, 09:15 WIB`,
        notes: 'Disetujui oleh atasan langsung'
      },
      {
        level: 'Level 2 (HRD)',
        role: 'HR Operations',
        name: 'HR Operations',
        status: 'Menunggu',
        statusText: 'Menunggu Persetujuan HR',
        badge: 'Dalam Antrean Verifikasi',
        description: 'Pemeriksaan kelengkapan dokumen dan kuota cuti oleh tim HR.'
      }
    ];

    const record: LeaveRecord = {
      id: newId,
      empId: data.empId || 'EMP-031',
      empName: data.empName || 'Asep Milo',
      initials: data.initials || 'AM',
      avatarColor: data.avatarColor || 'bg-blue-100 text-blue-700',
      department: data.department || 'Housekeeping',
      leaveType: data.leaveType || 'Cuti Tahunan',
      categoryTag: data.categoryTag || (data.leaveType?.includes('Sakit') ? 'Medis' : 'Tahunan'),
      startDate: data.startDate,
      endDate: data.endDate,
      dateRange: data.dateRange || data.dateRangeLabel || todayFormatted,
      dateRangeLabel: data.dateRangeLabel || data.dateRange || todayFormatted,
      durationDays: data.durationDays || 1,
      shiftLabel: data.shiftLabel || 'Shift Pagi: 08:00 - 17:00',
      status: data.status || 'Menunggu HR',
      statusLabel: data.status === 'Menunggu Surat Dokter' ? 'MENUNGGU SURAT DOKTER' : 'MENUNGGU HRD',
      submitDate: data.submitDate || todayFormatted,
      reason: data.reason || '-',
      attachmentName: data.attachmentName,
      attachmentSize: data.attachmentSize,
      approvalSteps: defaultSteps
    };

    leaveRecords.value.unshift(record);
    return record;
  };

  // Approve a leave request (Admin action)
  const approveLeave = (id: string, adminName: string = 'Lucia Maria (HR Admin)') => {
    const target = leaveRecords.value.find((r) => r.id === id);
    if (!target) return false;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = 'Hari Ini, ' + timeStr + ' WIB';

    target.status = 'Disetujui';
    target.statusLabel = 'DISETUJUI';
    target.processedDate = dateStr;
    target.processedBy = adminName;
    target.approver = adminName;

    // Update approval steps
    if (target.approvalSteps && target.approvalSteps.length >= 2) {
      target.approvalSteps[1].status = 'Disetujui';
      target.approvalSteps[1].statusText = 'Disetujui';
      target.approvalSteps[1].name = adminName;
      target.approvalSteps[1].timestamp = dateStr;
    }

    // Deduct quota if Tahunan
    if (target.leaveType.toLowerCase().includes('tahunan')) {
      const targetEmpId = target.empId.toLowerCase().trim();
      const targetName = target.empName.toLowerCase().trim();

      const q = quotaList.value.find((item) => {
        const itemEmpId = item.empId.toLowerCase().trim();
        const itemName = item.empName.toLowerCase().trim();
        return (
          itemEmpId === targetEmpId ||
          itemName === targetName ||
          (targetName.includes('asep') && itemName.includes('asep')) ||
          (targetEmpId === 'cs.50101' && itemEmpId === 'emp-031')
        );
      });

      if (q) {
        q.usedQuota += target.durationDays;
        q.remainingQuota = Math.max(0, q.remainingQuota - target.durationDays);
      }
    }

    return true;
  };

  // Reject a leave request (Admin action)
  const rejectLeave = (id: string, rejectionReason: string, adminName: string = 'Lucia Maria (HR Admin)') => {
    const target = leaveRecords.value.find((r) => r.id === id);
    if (!target) return false;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = 'Hari Ini, ' + timeStr + ' WIB';

    target.status = 'Ditolak';
    target.statusLabel = 'DITOLAK';
    target.rejectionReason = rejectionReason;
    target.processedDate = dateStr;
    target.processedBy = adminName;

    if (target.approvalSteps && target.approvalSteps.length >= 2) {
      target.approvalSteps[1].status = 'Ditolak';
      target.approvalSteps[1].statusText = 'Ditolak';
      target.approvalSteps[1].name = adminName;
      target.approvalSteps[1].timestamp = dateStr;
      target.approvalSteps[1].notes = rejectionReason;
    }

    return true;
  };

  // Cancel a leave request (User action)
  const cancelLeave = (id: string) => {
    const idx = leaveRecords.value.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const target = leaveRecords.value[idx];
      // If was approved, refund quota
      if (target.status === 'Disetujui' && target.leaveType.toLowerCase().includes('tahunan')) {
        const targetEmpId = target.empId.toLowerCase().trim();
        const targetName = target.empName.toLowerCase().trim();
        const q = quotaList.value.find((item) => {
          const itemEmpId = item.empId.toLowerCase().trim();
          const itemName = item.empName.toLowerCase().trim();
          return (
            itemEmpId === targetEmpId ||
            itemName === targetName ||
            (targetName.includes('asep') && itemName.includes('asep')) ||
            (targetEmpId === 'cs.50101' && itemEmpId === 'emp-031')
          );
        });
        if (q) {
          q.usedQuota = Math.max(0, q.usedQuota - target.durationDays);
          q.remainingQuota = Math.min(q.totalQuota, q.remainingQuota + target.durationDays);
        }
      }
      leaveRecords.value.splice(idx, 1);
      return true;
    }
    return false;
  };

  // Update a leave request (e.g., upload doctor note or edit)
  const updateLeave = (id: string, updates: Partial<LeaveRecord>) => {
    const target = leaveRecords.value.find((r) => r.id === id);
    if (!target) return false;

    Object.assign(target, updates);
    return true;
  };

  // Reset demo data to seed
  const resetToSeed = () => {
    leaveRecords.value = [...defaultSeedLeaves];
    quotaList.value = [...defaultSeedQuotas];
    localStorage.removeItem(STORAGE_KEY_LEAVES);
    localStorage.removeItem(STORAGE_KEY_QUOTAS);
  };

  return {
    leaveRecords,
    quotaList,
    pendingList,
    historyList,
    getUserLeaveHistory,
    getUserQuota,
    addLeaveRequest,
    approveLeave,
    rejectLeave,
    cancelLeave,
    updateLeave,
    resetToSeed
  };
}
