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
│   │   ├── StatusBadge.vue            # Badge status (label + tone ok/warn/off)
│   │   ├── tableLayout.ts             # Lebar kolom tabel bersama
│   │   └── TablePagination.vue        # Tombol paginasi
│   ├── composables/  # Logika reaktif yang dipakai ulang
│   │   ├── useEmployees.ts      # Pencarian, filter, paginasi daftar
│   │   ├── useApiErrors.ts      # Error API → pesan per kolom / toast
│   │   ├── useEmployeeDetail.ts # Muat detail pegawai + reload
│   │   ├── useReferences.ts     # Data referensi (master), dimuat sekali
│   │   ├── useRegions.ts        # Wilayah bertingkat
│   │   ├── useRecordModal.ts    # State modal lihat/tambah/ubah
│   │   ├── useSidebar.ts        # Buka/tutup sidebar mobile
│   │   └── useToast.ts          # Antrian notifikasi
│   ├── api/          # Kontrak API frontend ⇄ backend
│   │   ├── index.ts      # interface HrisApi + `api` (sekarang = mockApi)
│   │   ├── org.ts        # kontrak OrgApi (unit, jabatan, kantor, jenis)
│   │   ├── errors.ts     # ApiError (fieldErrors per kolom)
│   │   └── mock/         # Implementasi palsu di memori (db.ts, seed.ts, mockApi.ts, orgApi.ts)
│   ├── data/
│   │   └── options.ts    # Label enum DB (gender, status nikah, relasi keluarga, dst.)
│   ├── router/       # Definisi rute
│   │   └── index.ts
│   ├── types/        # Tipe TypeScript
│   │   └── employee.ts  # Tipe data (mengikuti DB_REV_3_0)
│   ├── utils/        # Fungsi bantu
│   │   ├── format.ts      # Format tanggal, nama, masking 4 digit terakhir
│   │   ├── employee.ts    # Penempatan aktif, form ⇄ detail, nama unit
│   │   ├── id.ts          # UUID
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
- `src/types/employee.ts` – tipe mengikuti DB_REV_3_0 (uuid, enum huruf kapital, `people` vs `employees` vs `employment_assignments`)
- `src/api/index.ts` – **kontrak** `HrisApi`. Semua halaman hanya memanggil `api`, tidak menyentuh data langsung.
  Saat backend siap: buat adapter HTTP yang memenuhi interface `HrisApi`, lalu ganti `export const api` di file itu.
- `src/api/mock/seed.ts` – data contoh 48 pegawai (bukan data nyata). Rina Wulandari (EMP-2019-0042) lengkap di semua tab.
- Identitas (NIK/NPWP/NIP) dan rekening: UI hanya menampilkan 4 digit terakhir; nomor penuh hanya dikirim saat simpan.
- Status akun (`authorize.users.status`) dan status kepegawaian (`employment_status_histories`) adalah dua aksi terpisah di tab Data Pegawai.
- Modul Organisasi & Jabatan: `types/organization.ts`, `api/org.ts` (kontrak), `api/mock/orgApi.ts`, `components/org/` (OrgNav, UnitTreeNode, TypeMaster).
  Hapus = soft delete; server menolak hapus data yang masih dipakai (unit bersubunit/berjabatan, jabatan yang pernah ditempati, kantor terpakai, jenis terpakai). Unit/jabatan/kantor nonaktif tidak muncul di pilihan form baru.
- `src/views/` – halaman utama per rute
- `src/components/profile/` – header profil, tab, dan isi tab (tab Jabatan = Penempatan + Pengalaman Kerja)
- `src/components/ui/` – modal, dialog konfirmasi, field form, toast, tabel generik

Catatan: data mock hanya tersimpan di memori; refresh halaman mengembalikan data awal.
