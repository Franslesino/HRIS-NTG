# BMIS — Modul Manajemen Operasional Gedung (New Modul NTG)

Proyek mandiri (*standalone*) pemisahan seluruh modul operasional BMIS yang baru dibangun dengan teknologi modern:

- **Vue 3** (`<script setup lang="ts">` Composition API) untuk antarmuka HTML reaktif
- **Tailwind CSS v3** untuk seluruh tata letak (*styling*) dan warna resmi BMIS
- **TypeScript** untuk keamanan tipe data (`types/roster.ts`, `types/attendance.ts`, `types/overtime.ts`)
- **Lucide Icons** untuk ikon modern dan profesional (Zero Emoji)

---

## 📁 Struktur Direktori Proyek

```text
new modul ntg/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Navbar.vue        # Header notifikasi & chip profil pengguna
│   │       └── Sidebar.vue       # Navigasi utama bernuansa hijau BMIS
│   ├── data/
│   │   └── mockData.ts           # Data realistis gedung, divisi, staf, dan log
│   ├── pages/
│   │   ├── dashboard/
│   │   │   └── Dashboard.vue     # KPI agregat & akses cepat seluruh modul
│   │   ├── attendance/
│   │   │   ├── UserPresensi.vue  # Check-in GPS geofence & live clock karyawan
│   │   │   └── AdminPresensi.vue # Monitoring presensi seluruh gedung & ekspor
│   │   ├── roster/
│   │   │   ├── RotasiJadwal.vue  # Rotasi & Tim Kerja (Card Grid + Modal Tambah)
│   │   │   ├── AdminRoster.vue   # Papan Matriks 31 Hari (Sticky Columns P/S/M)
│   │   │   ├── TambahJadwal.vue  # Penugasan shift susulan batch (Multi-select)
│   │   │   └── UserRoster.vue    # Kalender giliran jaga individu staf
│   │   └── overtime/
│   │       └── Overtime.vue      # Manajemen SPKL 2-Tahap (Rencana vs Realisasi)
│   ├── router/
│   │   └── index.ts              # Rute navigasi Vue Router v4
│   ├── types/
│   │   ├── attendance.ts         # Definisi tipe kehadiran
│   │   ├── overtime.ts           # Definisi tipe lembur & SPKL
│   │   └── roster.ts             # Definisi tipe shift, tim, dan penugasan
│   ├── App.vue
│   ├── main.ts
│   └── style.css                 # Import Tailwind directives & font Montserrat/Inter
├── tailwind.config.js            # Token palet warna resmi BMIS (#3abf94 & #00a389)
└── package.json
```

---

## 🚀 Cara Menjalankan Proyek di Komputer Anda

Buka terminal pada folder proyek:
```bash
cd "C:\Kuliah Edo\sem 7 (magang)\new modul ntg"
```

Jalankan dev server Vite:
```bash
npm run dev
```

Aplikasi dapat langsung diakses melalui browser di:
```text
http://localhost:5173
```

Untuk mengompilasi ke berkas produksi:
```bash
npm run build
```
*(Hasil kompilasi telah teruji 100% bebas error type-check)*
