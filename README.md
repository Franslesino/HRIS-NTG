# BMIS – Kepegawaian (Admin HR)

Vue 3 + TypeScript + Tailwind CSS 3 + Vue Router (Vite).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build produksi
```

## Halaman
| Rute | Isi |
|---|---|
| `/kepegawaian` | Daftar pegawai: pencarian, 3 filter, paginasi, skeleton loading, hasil kosong |
| `/kepegawaian/tambah` | Form Tambah Pegawai Baru (validasi + banner error) |
| `/kepegawaian/:id` | Profil pegawai, 5 tab (`?tab=data|jabatan|pendidikan|keluarga|rekening`) |
| `/kepegawaian/:id/edit` | Form Edit Data Pegawai |

## Struktur direktori

```text
bmis-admin-kepegawaian/
├── src/
│   ├── components/   # Komponen UI
│   │   ├── profile/                   # Komponen halaman profil
│   │   │   ├── BankTab.vue            # Tab Rekening Bank
│   │   │   ├── DataPegawaiTab.vue     # Tab Data Pegawai + Nonaktifkan/Aktifkan
│   │   │   ├── EducationTab.vue       # Tab Riwayat Pendidikan
│   │   │   ├── FamilyTab.vue          # Tab Data Keluarga
│   │   │   ├── InfoCard.vue           # Kartu label-nilai
│   │   │   ├── JobHistoryTab.vue      # Tab Riwayat Jabatan/Pekerjaan
│   │   │   ├── ProfileHeaderCard.vue  # Kartu ringkasan pegawai
│   │   │   ├── profileTabs.ts         # Daftar tab & penjaga tipe
│   │   │   └── ProfileTabs.vue        # Navigasi 5 tab
│   │   ├── ui/                        # Komponen UI umum
│   │   │   ├── BaseModal.vue      # Modal dasar (judul, isi, footer)
│   │   │   ├── ConfirmDialog.vue  # Dialog konfirmasi
│   │   │   ├── DetailModal.vue    # Modal detail (lihat)
│   │   │   ├── EmptyState.vue     # Tampilan "Belum ada data"
│   │   │   ├── FormField.vue      # Label + input + pesan error
│   │   │   ├── FormModal.vue      # Modal berisi form
│   │   │   ├── ModalShell.vue     # Overlay & panel modal
│   │   │   ├── RecordTable.vue    # Tabel generik + paginasi + aksi
│   │   │   ├── ToastHost.vue      # Notifikasi toast
│   │   │   └── ToggleSwitch.vue   # Saklar on/off
│   │   ├── AppHeader.vue              # Header: breadcrumb, judul, info pengguna
│   │   ├── AppIcon.vue                # Kumpulan ikon SVG
│   │   ├── AppLogo.vue                # Logo BMIS
│   │   ├── AppSidebar.vue             # Menu navigasi samping
│   │   ├── EmployeeEmptyState.vue     # Tampilan hasil pencarian kosong
│   │   ├── EmployeeTable.vue          # Tabel daftar pegawai
│   │   ├── EmployeeTableSkeleton.vue  # Skeleton saat memuat
│   │   ├── EmployeeToolbar.vue        # Pencarian, filter, tombol Tambah
│   │   ├── FilterSelect.vue           # Dropdown filter
│   │   ├── StatusBadge.vue            # Badge Aktif / Cuti / Nonaktif
│   │   ├── tableLayout.ts             # Lebar kolom tabel bersama
│   │   └── TablePagination.vue        # Tombol paginasi
│   ├── composables/  # Logika reaktif yang dipakai ulang
│   │   ├── useEmployees.ts      # Pencarian, filter, paginasi daftar
│   │   ├── useProfileFields.ts  # Susunan field kartu profil
│   │   ├── useRecordModal.ts    # State modal lihat/tambah/ubah
│   │   ├── useSidebar.ts        # Buka/tutup sidebar mobile
│   │   └── useToast.ts          # Antrian notifikasi
│   ├── data/         # Data contoh / pemanggilan API
│   │   ├── employees.ts  # fetchEmployees() — ganti dengan API
│   │   ├── options.ts    # Daftar pilihan dropdown
│   │   └── seed.ts       # Data awal 45 pegawai
│   ├── router/       # Definisi rute
│   │   └── index.ts
│   ├── stores/       # State data di memori
│   │   └── employeeStore.ts  # Store pegawai + operasi simpan
│   ├── types/        # Tipe TypeScript
│   │   └── employee.ts  # Tipe data pegawai
│   ├── utils/        # Fungsi bantu
│   │   ├── format.ts      # Format tanggal, nama, nomor rekening
│   │   ├── id.ts          # Pembuat ID unik
│   │   └── validators.ts  # Validasi NIK, email, HP, rekening
│   ├── views/        # Halaman (satu file per rute)
│   │   ├── EmployeeFormView.vue     # /kepegawaian/tambah & /:id/edit — form
│   │   ├── EmployeeListView.vue     # /kepegawaian — daftar pegawai
│   │   └── EmployeeProfileView.vue  # /kepegawaian/:id — profil + tab
│   ├── App.vue       # Layout utama (sidebar + konten)
│   ├── main.ts       # Inisialisasi aplikasi Vue
│   └── style.css     # Gaya global & kelas tombol/input
├── index.html          # Titik masuk HTML
├── package-lock.json   # Kunci versi dependensi
├── package.json        # Dependensi & script npm
├── postcss.config.js   # Konfigurasi PostCSS
├── README.md           # Dokumentasi ini
├── tailwind.config.js  # Tema Tailwind (warna, font)
├── tsconfig.json       # Konfigurasi TypeScript
└── vite.config.ts      # Konfigurasi Vite (alias @ → src)
```

## Catatan struktur
- `src/stores/employeeStore.ts` – data di memori (ganti dengan API) + semua operasi simpan
- `src/data/seed.ts` – data contoh. Rina Wulandari (EMP-2019-0042) lengkap di semua tab; pegawai lain sebagian kosong untuk mencoba tampilan "Belum ada data"
- `src/views/` – 3 halaman utama
- `src/components/profile/` – header profil, tab, dan 5 isi tab
- `src/components/ui/` – modal, dialog konfirmasi, field form, toast, tabel generik

Catatan: data hanya tersimpan di memori; refresh halaman mengembalikan data awal.

