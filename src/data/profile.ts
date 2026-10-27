import type { EmployeeDetail } from "@/types/employee"

/**
 * Data contoh profil pegawai yang login.
 * Ganti `fetchMyProfile()` dengan pemanggilan API, misalnya GET /api/me/profile.
 */
const myProfile: EmployeeDetail = {
  id: "EMP-2019-0042",
  name: "Rina Wulandari",
  frontTitle: "",
  backTitle: "S.Kom.",
  department: "Teknologi Informasi",
  position: "Business Analyst",
  type: "Karyawan Tetap",
  status: "Aktif",
  nip: "198201142009012001",
  nik: "3272011408920001",
  npwp: "91.327.2011.4-892.000",
  birthPlace: "Bandung",
  birthDate: "1992-01-14",
  gender: "Perempuan",
  bloodType: "O",
  religion: "Islam",
  maritalStatus: "Menikah",
  childCount: 2,
  email: "rina.wulandari@bmis.id",
  phone: "+62 812 3456 7890",
  street: "Jl. Raya Kuningan Barat No. 8",
  rt: "004",
  rw: "010",
  village: "Kelurahan Setiabudi",
  district: "Kecamatan Setiabudi",
  city: "Kota Bandung",
  province: "Jawa Barat",
  postalCode: "40154",
  domicile: "Sesuai KTP",
  division: "Divisi Teknologi Informasi",
  office: "Kantor Pusat Bandung",
  supervisor: "Lucia Maria",
  joinDate: "2022-08-01",
  photo: "",
  jobHistory: [
    { id: "j1", position: "Business Analyst", unit: "Divisi Teknologi Informasi", startDate: "2022-08-01", endDate: "", skNumber: "045/HRD/SK/2022" },
    { id: "j2", position: "Associate Business Analyst", unit: "Seksi Rekayasa Sistem", startDate: "2020-05-15", endDate: "2022-07-31", skNumber: "012/HRD/SK/2020" },
    { id: "j3", position: "Junior Programmer", unit: "Seksi Aplikasi TI", startDate: "2019-03-01", endDate: "2020-05-14", skNumber: "002/HRD/SK/2019" },
  ],
  educations: [
    { id: "e1", level: "S2", institution: "Universitas Indonesia", major: "Teknologi Informasi", startYear: "2020", endYear: "2022", diplomaNumber: "9982/UI-MTI/2022" },
    { id: "e2", level: "S1", institution: "Binus University", major: "Teknik Informatika", startYear: "2014", endYear: "2018", diplomaNumber: "1104/BINUS-TI/2018" },
  ],
  family: [
    { id: "f1", relation: "Suami", name: "Andi Wijaya, M.B.A.", nik: "3174092211880003", birthDate: "1988-11-22", occupation: "Software Engineer", dependent: false },
    { id: "f2", relation: "Anak Pertama", name: "Rafi Al-Fatih", nik: "3174091508180001", birthDate: "2018-08-15", occupation: "Pelajar", dependent: true },
    { id: "f3", relation: "Anak Kedua", name: "Siti Humaira", nik: "3174091012210002", birthDate: "2021-12-10", occupation: "Belum Bekerja", dependent: true },
  ],
  banks: [
    { id: "b1", bank: "Bank Mandiri", accountNumber: "1370012345621", ownerName: "Rina Wulandari", primary: true },
    { id: "b2", bank: "Bank BCA", accountNumber: "5220123454109", ownerName: "Rina Wulandari", primary: false },
  ],
}

export function fetchMyProfile(): Promise<EmployeeDetail> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(myProfile)), 600))
}
