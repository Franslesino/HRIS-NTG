<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  CalendarDays,
  PlusCircle,
  Search,
  Building2,
  Layers,
  RotateCcw,
  Pencil,
  Trash2,
  Users,
  Info,
  X,
  Save,
  CheckCircle2,
  Calendar
} from 'lucide-vue-next';
import { mockRosterTeams, mockOffices, mockDivisions } from '../../data/mockData';
import type { RosterTeam } from '../../types/roster';
import { toast } from 'vue-sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';

const router = useRouter();

// State Kartu Tim
const teams = ref<RosterTeam[]>([...mockRosterTeams]);

// Filter & Search State
const searchQuery = ref('');
const selectedGedung = ref('');
const selectedDivisi = ref('');

const selectedGedungModel = computed({
  get: () => selectedGedung.value || 'all',
  set: (value: string) => {
    selectedGedung.value = value === 'all' ? '' : value;
  },
});

const selectedDivisiModel = computed({
  get: () => selectedDivisi.value || 'all',
  set: (value: string) => {
    selectedDivisi.value = value === 'all' ? '' : value;
  },
});

// Modal State
const isModalOpen = ref(false);
const modalTitle = ref('');
const modalGedung = ref('');
const modalLantai = ref('');
const modalDivisi = ref('');
const modalStartDate = ref('2026-11-01');
const modalEndDate = ref('2026-11-30');
const modalQuota = ref(1);

// Toast State
const showToast = (msg: string) => {
  toast.success(msg);
};

// Filtered Teams
const filteredTeams = computed(() => {
  return teams.value.filter(team => {
    const q = searchQuery.value.toLowerCase().trim();
    const matchQuery = !q ||
      team.title.toLowerCase().includes(q) ||
      team.divisi.toLowerCase().includes(q) ||
      team.gedung.toLowerCase().includes(q) ||
      team.members.some(m => m.name.toLowerCase().includes(q));

    const matchGedung = !selectedGedung.value || team.gedung === selectedGedung.value;
    const matchDivisi = !selectedDivisi.value || team.divisi === selectedDivisi.value;

    return matchQuery && matchGedung && matchDivisi;
  });
});

const resetFilters = () => {
  searchQuery.value = '';
  selectedGedung.value = '';
  selectedDivisi.value = '';
  showToast('Filter pencarian telah direset.');
};

// Buka Modal
const openModal = () => {
  modalTitle.value = '';
  modalGedung.value = '';
  modalLantai.value = '';
  modalDivisi.value = '';
  modalStartDate.value = '2026-11-01';
  modalEndDate.value = '2026-11-30';
  modalQuota.value = 1;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

// Simpan Tim Baru
const handleCreateTeam = () => {
  if (!modalTitle.value || !modalGedung.value || !modalLantai.value || !modalDivisi.value) {
    toast.warning('Harap isi semua kolom wajib!');
    return;
  }

  const newTeam: RosterTeam = {
    id: `team-${Date.now()}`,
    orderNum: teams.value.length + 1,
    title: modalTitle.value,
    divisi: modalDivisi.value,
    gedung: modalGedung.value,
    lantai: modalLantai.value,
    startDate: modalStartDate.value,
    status: 'Draft',
    personelCount: 0,
    quotaMax: modalQuota.value,
    members: [],
  };

  teams.value.push(newTeam);
  closeModal();
  showToast(`Jadwal "${newTeam.title}" berhasil dibuat dan disimpan!`);
};

// Hapus Tim
const isDeleteConfirmOpen = ref(false);
const teamToDelete = ref<RosterTeam | null>(null);

const deleteTeam = (team: RosterTeam) => {
  teamToDelete.value = team;
  isDeleteConfirmOpen.value = true;
};

const executeDeleteTeam = () => {
  if (!teamToDelete.value) return;
  const { id, title } = teamToDelete.value;
  teams.value = teams.value.filter(t => t.id !== id);
  isDeleteConfirmOpen.value = false;
  teamToDelete.value = null;
  showToast(`Jadwal "${title}" berhasil dihapus.`);
};

// Navigasi ke Matriks 31 Hari
const goToRosterMatrix = (team: RosterTeam) => {
  showToast(`Membuka Papan Matriks Shift untuk ${team.title}...`);
  router.push({
    name: 'AdminRoster',
    query: {
      team: team.title,
      gedung: team.gedung,
      divisi: team.divisi,
    }
  });
};
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Rotasi & Jadwal Kerja"
      description="Atur siklus rotasi shift (contoh pola PPSSMM-Libur) dan titik mulainya (cycle anchor date) untuk tiap jadwal kerja, agar seluruh shift terisi 24/7."
      badge="Rotasi Shift"
      badge-variant="info"
      :breadcrumbs="[{ label: 'Roster' }, { label: 'Jadwal Kerja' }]"
    >
      <template #actions>
        <Button @click="openModal">
          <PlusCircle />
          Tambah Jadwal Baru
        </Button>
      </template>
    </PageHeader>

    <!-- FILTER -->
    <Card>
      <CardContent class="flex flex-col gap-2.5 pt-6 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="search"
            placeholder="Cari nama personel, divisi, atau gedung..."
            class="h-9 pl-9"
          />
        </div>

        <Select v-model="selectedGedungModel">
          <SelectTrigger class="h-9 w-full lg:w-48">
            <Building2 class="mr-1 size-4 text-muted-foreground" />
            <SelectValue placeholder="Semua Gedung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Gedung</SelectItem>
            <SelectItem v-for="g in mockOffices" :key="g" :value="g">{{ g }}</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="selectedDivisiModel">
          <SelectTrigger class="h-9 w-full lg:w-48">
            <Layers class="mr-1 size-4 text-muted-foreground" />
            <SelectValue placeholder="Semua Divisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Divisi</SelectItem>
            <SelectItem v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" class="h-9" @click="resetFilters">
          <RotateCcw />
          Reset
        </Button>
      </CardContent>
    </Card>

    <!-- TEAM CARDS -->
    <div v-if="filteredTeams.length" class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="team in filteredTeams"
        :key="team.id"
        class="flex flex-col justify-between transition-shadow hover:shadow-md"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2.5">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                :class="team.status === 'Aktif' ? 'bg-primary' : 'bg-slate-700'"
              >
                {{ team.orderNum }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold" :title="team.title">{{ team.title }}</p>
                <p class="text-xs text-muted-foreground">{{ team.divisi }}</p>
              </div>
            </div>

            <Badge :variant="team.status === 'Aktif' ? 'success' : 'secondary'">
              {{ team.status }}
            </Badge>
          </div>
        </CardHeader>

        <CardContent class="space-y-3 pb-3">
          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 text-muted-foreground">
                <Layers class="size-3.5" /> Divisi
              </span>
              <span class="truncate font-medium">{{ team.divisi }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 text-muted-foreground">
                <Building2 class="size-3.5" /> Penugasan
              </span>
              <span class="truncate font-medium">{{ team.gedung }}, {{ team.lantai }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 text-muted-foreground">
                <Calendar class="size-3.5" /> Tanggal Mulai
              </span>
              <span class="font-medium">{{ team.startDate }}</span>
            </div>
          </div>

          <div class="space-y-2 border-t pt-3">
            <div class="flex items-center justify-between text-xs">
              <span class="uppercase tracking-wide text-muted-foreground">
                {{ team.personelCount }} Personel Aktif
              </span>
              <span
                class="font-semibold"
                :class="team.personelCount >= team.quotaMax ? 'text-primary' : 'text-amber-600'"
              >
                Kuota ({{ team.personelCount }}/{{ team.quotaMax }})
              </span>
            </div>

            <Progress
              :model-value="team.quotaMax ? Math.min((team.personelCount / team.quotaMax) * 100, 100) : 0"
              class="h-1.5"
            />

            <div class="flex items-center gap-2">
              <div v-if="team.members.length > 0" class="flex -space-x-2 overflow-hidden py-1">
                <div
                  v-for="(member, mIdx) in team.members"
                  :key="mIdx"
                  class="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold text-white shadow-sm"
                  :class="member.bgClass"
                  :title="member.name"
                >
                  {{ member.initials }}
                </div>
              </div>
              <span v-else class="text-xs italic text-muted-foreground">
                Belum ada personel dialokasikan
              </span>
              <span
                v-if="team.members.length > 0"
                class="max-w-[160px] truncate text-xs text-muted-foreground"
              >
                {{ team.members.map((m) => m.name.split(' ')[0]).join(', ') }}...
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter class="gap-2 pt-0">
          <Button class="flex-1" @click="goToRosterMatrix(team)">
            <Users />
            Lihat Detail &amp; Atur Personel
          </Button>
          <Button
            variant="outline"
            size="icon"
            class="text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            title="Hapus Jadwal"
            @click="deleteTeam(team)"
          >
            <Trash2 />
          </Button>
        </CardFooter>
      </Card>
    </div>

    <EmptyState
      v-else
      title="Tidak ada jadwal yang cocok"
      description="Silakan ubah filter gedung, divisi, atau kata kunci pencarian Anda."
      :icon="Users"
    />

    <!-- DIALOG: NEW TEAM -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div class="flex items-center gap-2">
            <DialogTitle>Buat Jadwal Shift Baru</DialogTitle>
            <Badge variant="success">Jadwal Baru</Badge>
          </div>
          <DialogDescription>
            Kelompokkan personel ke dalam siklus pola rotasi kerja otomatis.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="space-y-3 rounded-lg border bg-muted/40 p-4">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-sm font-medium">
                <span class="size-1.5 rounded-full bg-primary" />
                Identitas &amp; Lokasi Gardu
              </span>
              <span class="text-xs text-muted-foreground">*Wajib diisi</span>
            </div>

            <div class="space-y-1.5">
              <Label>Judul Jadwal</Label>
              <Input v-model="modalTitle" type="text" placeholder="Contoh: Tim 1 (Alpha)" />
            </div>

            <div class="space-y-1.5">
              <Label>Lokasi Penugasan</Label>
              <div class="grid grid-cols-2 gap-2">
                <Select v-model="modalGedung">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Gedung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="g in mockOffices" :key="g" :value="g">{{ g }}</SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="modalLantai">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Lantai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lantai Basement P1">Lantai Basement P1</SelectItem>
                    <SelectItem value="Lantai GF">Lantai GF (Ground Floor)</SelectItem>
                    <SelectItem value="Lantai 1">Lantai 1</SelectItem>
                    <SelectItem value="Lantai 2">Lantai 2</SelectItem>
                    <SelectItem value="Lantai 3">Lantai 3</SelectItem>
                    <SelectItem value="Lantai 4">Lantai 4</SelectItem>
                    <SelectItem value="Lantai 5">Lantai 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div class="space-y-3 rounded-lg border bg-muted/40 p-4">
            <span class="flex items-center gap-1.5 text-sm font-medium">
              <span class="size-1.5 rounded-full bg-primary" />
              Pola Siklus &amp; Titik Mulai (Anchor Date)
            </span>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div class="space-y-1.5">
                <Label class="text-xs">Divisi</Label>
                <Select v-model="modalDivisi">
                  <SelectTrigger>
                    <SelectValue placeholder="Divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-1.5">
                <Label class="text-xs">Mulai Siklus</Label>
                <Input v-model="modalStartDate" type="date" />
              </div>

              <div class="space-y-1.5">
                <Label class="text-xs">Berakhir</Label>
                <Input v-model="modalEndDate" type="date" />
              </div>
            </div>

            <div class="space-y-1.5">
              <Label class="text-xs">Kuota Minimum per Shift</Label>
              <div class="flex items-center gap-2">
                <Input v-model="modalQuota" type="number" min="1" max="50" class="w-24 text-center" />
                <span class="text-xs text-muted-foreground">orang / shift</span>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">
            <Info class="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Pratinjau rotasi dan alokasi personel dikelola di halaman
              <strong class="font-semibold">Detail Jadwal</strong> setelah disimpan.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeModal">
            Batal
          </Button>
          <Button @click="handleCreateTeam">
            <Save />
            Simpan &amp; Buat Jadwal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- CONFIRM DELETE -->
    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Jadwal Shift?</AlertDialogTitle>
          <AlertDialogDescription>
            Jadwal
            <strong class="font-medium text-foreground">{{ teamToDelete?.title }}</strong>
            akan dihapus permanen beserta pengaturan rotasinya. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="teamToDelete = null">Batal</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="executeDeleteTeam"
          >
            Ya, Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
