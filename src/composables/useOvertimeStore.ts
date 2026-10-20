import { ref, computed, watch } from 'vue';
import type { OvertimeRequest } from '../types/overtime';
import { mockOvertimeRequests } from '../data/mockData';

const STORAGE_KEY = 'bmis_shared_overtime_requests_v1';

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
