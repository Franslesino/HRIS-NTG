import { ref, computed, watch } from 'vue';
import type { RosterTeam } from '../types/roster';
import { mockRosterTeams } from '../data/mockData';

export interface ShiftSwapRecord {
  id: string;
  requesterId: string;
  requesterName: string;
  colleagueId: string;
  colleagueName: string;
  swapDate: string;
  myShift: string;
  colleagueShift: string;
  status: 'Menunggu Approval' | 'Disetujui' | 'Ditolak';
  colleagueApproved: boolean;
  restValidationNotes: string;
  reason?: string;
  createdAt?: string;
}

const STORAGE_KEY_TEAMS = 'bmis_shared_roster_teams_v1';
const STORAGE_KEY_SWAPS = 'bmis_shared_shift_swaps_v1';

const defaultSeedSwaps: ShiftSwapRecord[] = [
  {
    id: 'swap-001',
    requesterId: 'e301',
    requesterName: 'Ahmad Fauzi',
    colleagueId: 'e102',
    colleagueName: 'Budi Raharjo',
    swapDate: 'Besok',
    myShift: 'Shift 1 (07:00 - 15:00)',
    colleagueShift: 'Shift 2 (15:00 - 23:00)',
    status: 'Menunggu Approval',
    colleagueApproved: true,
    restValidationNotes: 'Telah divalidasi tidak melanggar batas jeda istirahat 11 jam.',
    reason: 'Kebutuhan keluarga mendesak',
    createdAt: 'Hari ini, 09:30 WIB',
  },
];

const loadTeams = (): RosterTeam[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse teams storage:', err);
  }
  return JSON.parse(JSON.stringify(mockRosterTeams));
};

const loadSwaps = (): ShiftSwapRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SWAPS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse swaps storage:', err);
  }
  return JSON.parse(JSON.stringify(defaultSeedSwaps));
};

const teams = ref<RosterTeam[]>(loadTeams());
const swapRequests = ref<ShiftSwapRecord[]>(loadSwaps());

watch(
  teams,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  },
  { deep: true }
);

watch(
  swapRequests,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY_SWAPS, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  },
  { deep: true }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_TEAMS) teams.value = loadTeams();
    if (e.key === STORAGE_KEY_SWAPS) swapRequests.value = loadSwaps();
  });
}

export function useRosterStore() {
  const activeTeams = computed(() => {
    return teams.value.filter((t) => t.status === 'Aktif');
  });

  const activeTeam = computed(() => {
    return activeTeams.value[0] || teams.value[0];
  });

  const totalActivePersonnel = computed(() => {
    return activeTeams.value.reduce((acc, t) => acc + (t.personelCount || 0), 0);
  });

  const pendingSwaps = computed(() => {
    return swapRequests.value.filter((s) => s.status === 'Menunggu Approval');
  });

  const urgentSwap = computed(() => {
    return pendingSwaps.value[0] || null;
  });

  const approveSwap = (id: string) => {
    const target = swapRequests.value.find((s) => s.id === id);
    if (target) {
      target.status = 'Disetujui';
      return true;
    }
    return false;
  };

  const addSwapRequest = (newSwap: ShiftSwapRecord) => {
    swapRequests.value.unshift(newSwap);
  };

  return {
    teams,
    activeTeams,
    activeTeam,
    totalActivePersonnel,
    swapRequests,
    pendingSwaps,
    urgentSwap,
    approveSwap,
    addSwapRequest,
  };
}
