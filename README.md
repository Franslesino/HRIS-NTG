# BMIS – Profil Saya (Portal Pegawai)

Website terpisah untuk pegawai: melihat profil sendiri (read-only).
Vue 3 + TypeScript + Tailwind CSS 3 + Vue Router (Vite).

```bash
npm install
npm run dev      # http://localhost:5173  (otomatis ke /profil-saya)
npm run build
```

- Tab: Data Pribadi, Riwayat Jabatan/Pekerjaan, Riwayat Pendidikan, Data Keluarga, Rekening Bank (`?tab=jabatan|pendidikan|keluarga|rekening`)
- Data: `src/data/profile.ts` → ganti `fetchMyProfile()` dengan API (mis. `GET /api/me/profile`)
- Tersedia tampilan memuat dan gagal-muat (tombol "Coba lagi")
