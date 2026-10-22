<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  FileCheck2,
  Clock,
  PlusCircle,
  Building2,
  Layers,
  Search,
  CheckCircle2,
  DollarSign,
  X,
  Save
} from 'lucide-vue-next';
import { mockOffices, mockDivisions } from '../../data/mockData';
import type { OvertimeRequest } from '../../types/overtime';
import { useOvertimeStore } from '../../composables/useOvertimeStore';
import { toast } from 'vue-sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatCard from '@/components/shared/StatCard.vue';
import EmptyState from '@/components/shared/EmptyState.vue';

const { requests } = useOvertimeStore();

// Filters
const activeTab = ref<'all' | 'rencana' | 'realisasi'>('all');
const selectedGedung = ref('');
const selectedDivisi = ref('');
const searchQuery = ref('');

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

// Modal Pengajuan SPKL Baru
const isModalOpen = ref(false);
const formEmployeeName = ref('');
const formNip = ref('');
const formDivision = ref('Engineering');
const formOffice = ref('Menara 1 BTN');
const formDate = ref('2026-10-16');
const formStartTime = ref('17:00');
const formEndTime = ref('20:00');
const formPurpose = ref('');
const formIsManagerial = ref(false);

// Toast
const showToast = (msg: string) => {
  toast.success(msg);
};

// Filtered Requests
const filteredRequests = computed(() => {
  return requests.value.filter(req => {
    const matchTab = activeTab.value === 'all' || req.stage === activeTab.value;
    const matchGedung = !selectedGedung.value || req.office === selectedGedung.value;
    const matchDivisi = !selectedDivisi.value || req.division === selectedDivisi.value;
    const q = searchQuery.value.toLowerCase().trim();
    const matchSearch = !q || req.employeeName.toLowerCase().includes(q) || req.spklNumber.toLowerCase().includes(q);
    return matchTab && matchGedung && matchDivisi && matchSearch;
  });
});

// KPI Calculations
const kpiTotal = computed(() => requests.value.length);
const kpiPendingPlan = computed(() => requests.value.filter(r => r.stage === 'rencana' && r.status === 'Menunggu Approval').length);
const kpiPendingRealization = computed(() => requests.value.filter(r => r.stage === 'realisasi' && r.status === 'Menunggu Approval').length);
const kpiTotalCost = computed(() => requests.value.reduce((acc, r) => acc + r.estimatedCost, 0));

// Actions
const approveRequest = (req: OvertimeRequest) => {
  if (req.stage === 'rencana') {
    req.status = 'Disetujui';
    showToast(`Rencana lembur ${req.spklNumber} disetujui! Lanjutkan ke tahap pelaksanaan.`);
  } else {
    req.status = 'Selesai';
    showToast(`Realisasi jam lembur ${req.spklNumber} diverifikasi dan diotorisasi untuk payroll!`);
  }
};

const moveToRealization = (req: OvertimeRequest) => {
  req.stage = 'realisasi';
  req.status = 'Menunggu Approval';
  showToast(`${req.spklNumber} dipindahkan ke tahap Realisasi Jam Aktual.`);
};

// Submit Modal SPKL
const submitNewSPKL = () => {
  if (!formEmployeeName.value || !formPurpose.value) {
    toast.warning('Harap lengkapi nama pegawai dan uraian pekerjaan lembur!');
    return;
  }

  const duration = 3;
  const cost = formIsManagerial.value ? 0 : duration * 45000;

  const newReq: OvertimeRequest = {
    id: `spkl-${Date.now()}`,
    spklNumber: `SPKL/BTN/2026/10/00${requests.value.length + 1}`,
    employeeName: formEmployeeName.value,
    nip: formNip.value || 'CS.38999',
    division: formDivision.value,
    office: formOffice.value,
    date: formDate.value,
    startTime: formStartTime.value,
    endTime: formEndTime.value,
    durationHours: duration,
    purpose: formPurpose.value,
    stage: 'rencana',
    status: 'Menunggu Approval',
    isManagerial: formIsManagerial.value,
    estimatedCost: cost,
  };

  requests.value.unshift(newReq);
  isModalOpen.value = false;
  showToast(`Pengajuan SPKL ${newReq.spklNumber} berhasil dibuat!`);
};
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Manajemen & Rekapitulasi Lembur"
      description="Otorisasi Surat Perintah Kerja Lembur (SPKL) dua tahap (Rencana & Realisasi) sesuai PP 35/2021."
      badge="PP 35/2021"
      badge-variant="info"
      :breadcrumbs="[{ label: 'Lembur' }, { label: 'Manajemen & Rekap Lembur (SPKL)' }]"
    >
      <template #actions>
        <Button @click="isModalOpen = true">
          <PlusCircle />
          Ajukan SPKL Baru
        </Button>
      </template>
    </PageHeader>

    <!-- KPI -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Berkas SPKL"
        :value="`${kpiTotal} Berkas`"
        hint="Bulan Oktober 2026"
        :icon="FileCheck2"
      >
        <template #meta>
          <Badge variant="secondary">Arsip</Badge>
        </template>
      </StatCard>

      <StatCard
        title="Approval Rencana"
        :value="`${kpiPendingPlan} Pengajuan`"
        hint="Pra-pelaksanaan"
        :icon="Clock"
        icon-class="size-4 text-amber-500"
      >
        <template #meta>
          <Badge variant="warning">Menunggu</Badge>
        </template>
      </StatCard>

      <StatCard
        title="Approval Realisasi"
        :value="`${kpiPendingRealization} Berkas`"
        hint="Verifikasi jam aktual"
        :icon="CheckCircle2"
        icon-class="size-4 text-blue-500"
      >
        <template #meta>
          <Badge variant="info">Tahap 2</Badge>
        </template>
      </StatCard>

      <StatCard
        title="Estimasi Biaya"
        :value="`Rp ${kpiTotalCost.toLocaleString('id-ID')}`"
        hint="Anggaran lembur gedung"
        :icon="DollarSign"
        icon-class="size-4 text-emerald-600"
      >
        <template #meta>
          <Badge variant="success">Payroll</Badge>
        </template>
      </StatCard>
    </div>

    <!-- FILTER + TABLE -->
    <Card>
      <CardContent class="space-y-4 pt-6">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <Tabs v-model="activeTab">
            <TabsList>
              <TabsTrigger value="all">Semua Tahap</TabsTrigger>
              <TabsTrigger value="rencana">
                Tahap 1: Rencana
                <Badge variant="secondary" class="ml-2">
                  {{ requests.filter((r) => r.stage === 'rencana').length }}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="realisasi">
                Tahap 2: Realisasi
                <Badge variant="secondary" class="ml-2">
                  {{ requests.filter((r) => r.stage === 'realisasi').length }}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <span class="text-xs text-muted-foreground">
            {{ filteredRequests.length }} dari {{ requests.length }} berkas
          </span>
        </div>

        <div class="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Select v-model="selectedGedungModel">
            <SelectTrigger class="h-9 w-full lg:w-52">
              <Building2 class="mr-1 size-4 text-muted-foreground" />
              <SelectValue placeholder="Semua Gedung" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gedung</SelectItem>
              <SelectItem v-for="g in mockOffices" :key="g" :value="g">{{ g }}</SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="selectedDivisiModel">
            <SelectTrigger class="h-9 w-full lg:w-52">
              <Layers class="mr-1 size-4 text-muted-foreground" />
              <SelectValue placeholder="Semua Divisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Divisi</SelectItem>
              <SelectItem v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</SelectItem>
            </SelectContent>
          </Select>

          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Cari nomor SPKL atau nama pegawai..."
              class="h-9 pl-9"
            />
          </div>
        </div>

        <div v-if="filteredRequests.length" class="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. SPKL</TableHead>
                <TableHead>Nama Pegawai &amp; NIP</TableHead>
                <TableHead>Divisi &amp; Gedung</TableHead>
                <TableHead>Tanggal &amp; Jam</TableHead>
                <TableHead class="min-w-[220px]">Uraian Pekerjaan</TableHead>
                <TableHead>Tahap</TableHead>
                <TableHead>Biaya / Kompensasi</TableHead>
                <TableHead class="text-right">Status &amp; Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="req in filteredRequests" :key="req.id">
                <TableCell class="whitespace-nowrap font-mono text-xs font-semibold">
                  {{ req.spklNumber }}
                </TableCell>

                <TableCell>
                  <p class="text-sm font-medium">{{ req.employeeName }}</p>
                  <p class="text-xs text-muted-foreground">{{ req.nip }}</p>
                </TableCell>

                <TableCell>
                  <p class="text-sm font-medium">{{ req.division }}</p>
                  <p class="text-xs text-muted-foreground">{{ req.office }}</p>
                </TableCell>

                <TableCell>
                  <p class="whitespace-nowrap text-sm font-medium">{{ req.date }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ req.startTime }} - {{ req.endTime }} ({{ req.durationHours }} Jam)
                  </p>
                </TableCell>

                <TableCell class="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                  {{ req.purpose }}
                </TableCell>

                <TableCell>
                  <Badge :variant="req.stage === 'rencana' ? 'warning' : 'info'">
                    {{ req.stage }}
                  </Badge>
                </TableCell>

                <TableCell>
                  <template v-if="req.isManagerial">
                    <p class="text-sm font-medium">Rp 0</p>
                    <p class="text-xs font-medium text-blue-600">Exempt (Cuti Pengganti)</p>
                  </template>
                  <template v-else>
                    <p class="whitespace-nowrap text-sm font-semibold text-emerald-600">
                      Rp {{ req.estimatedCost.toLocaleString('id-ID') }}
                    </p>
                    <p class="text-xs text-muted-foreground">Upah Lembur</p>
                  </template>
                </TableCell>

                <TableCell>
                  <div class="flex flex-col items-end gap-1.5">
                    <Badge :variant="req.status === 'Disetujui' || req.status === 'Selesai' ? 'success' : 'warning'">
                      {{ req.status }}
                    </Badge>

                    <div class="flex items-center gap-1">
                      <Button
                        v-if="req.status === 'Menunggu Approval'"
                        size="xs"
                        @click="approveRequest(req)"
                      >
                        Setujui
                      </Button>

                      <Button
                        v-if="req.stage === 'rencana' && req.status === 'Disetujui'"
                        size="xs"
                        variant="info"
                        @click="moveToRealization(req)"
                      >
                        Verifikasi Jam
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <EmptyState
          v-else
          title="Tidak ada berkas SPKL"
          description="Tidak ada pengajuan lembur yang sesuai dengan filter atau pencarian."
          :icon="FileCheck2"
        />
      </CardContent>
    </Card>

    <!-- DIALOG: NEW SPKL -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <FileCheck2 class="size-4 text-primary" />
            Form Pengajuan SPKL Baru
          </DialogTitle>
          <DialogDescription>
            Tahap 1: Izin &amp; rencana kerja lembur.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3.5">
          <div class="space-y-1.5">
            <Label>Nama Pegawai <span class="text-destructive">*</span></Label>
            <Input
              v-model="formEmployeeName"
              type="text"
              placeholder="Contoh: Candra Wijaya"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>Divisi</Label>
              <Select v-model="formDivision">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="d in mockDivisions" :key="d" :value="d">{{ d }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label>Gedung</Label>
              <Select v-model="formOffice">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="g in mockOffices" :key="g" :value="g">{{ g }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1.5">
              <Label class="text-xs">Tanggal</Label>
              <Input v-model="formDate" type="date" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Jam Mulai</Label>
              <Input v-model="formStartTime" type="time" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Jam Selesai</Label>
              <Input v-model="formEndTime" type="time" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Uraian / Alasan Lembur <span class="text-destructive">*</span></Label>
            <Textarea
              v-model="formPurpose"
              rows="3"
              placeholder="Jelaskan kebutuhan pekerjaan operasional..."
            />
          </div>

          <label class="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-muted/40 p-3">
            <Checkbox v-model="formIsManagerial" class="mt-0.5" />
            <div>
              <span class="block text-sm font-medium">Jabatan Manajerial (Exempt PP 35/2021)</span>
              <span class="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                Building Manager ke atas tetap tercatat di sistem, namun upah lembur Rp 0 dan
                dikompensasi menjadi Cuti Pengganti.
              </span>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isModalOpen = false">
            Batal
          </Button>
          <Button class="w-full sm:w-auto" @click="submitNewSPKL">
            <Save />
            Simpan &amp; Ajukan SPKL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
