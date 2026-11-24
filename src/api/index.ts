import type {
  AssignmentInput, BankInput, CityRef, DistrictRef, EducationInput, EmployeeDetail,
  EmployeeForm, EmployeeOption, EmployeePage, EmployeeQuery, FamilyInput, References,
  StatusChangeInput, VillageRef, WorkHistoryInput,
} from '@/types/employee'
import type { OrgApi } from './org'
import { mockApi } from './mock/mockApi'
import { mockOrgApi } from './mock/orgApi'

export { ApiError, errorMessage } from './errors'
export type { OrgApi } from './org'

/**
 * KONTRAK API frontend ⇄ backend.
 * Saat ini diimplementasikan oleh `mockApi` (data di memori, bentuk mengikuti DB_REV_3_0).
 * Saat backend siap: buat adapter HTTP yang memenuhi interface ini lalu ganti `api` di bawah —
 * komponen/halaman tidak perlu diubah.
 *
 * Catatan untuk backend (ditegakkan di server, bukan hanya di UI):
 *  - identitas (NIK/NPWP/NIP) & rekening dikirim penuh saat tulis, tetapi dibalas hanya 4 digit terakhir
 *  - id[] selalu uuid; tanggal 'YYYY-MM-DD'; '' pada input tanggal/relasi opsional = null
 */
export interface EmployeeApi {
  /* referensi */
  getReferences(): Promise<References>
  listCities(provinceId: string): Promise<CityRef[]>
  listDistricts(cityId: string): Promise<DistrictRef[]>
  listVillages(districtId: string): Promise<VillageRef[]>
  /** Untuk pemilih atasan langsung (mock: semua pegawai; backend sebaiknya pencarian/typeahead) */
  listEmployeeOptions(): Promise<EmployeeOption[]>

  /* pegawai */
  listEmployees(q: EmployeeQuery): Promise<EmployeePage>
  getEmployee(id: string): Promise<EmployeeDetail | null>
  isEmployeeNumberTaken(employeeNumber: string, exceptEmployeeId?: string): Promise<boolean>
  createEmployee(form: EmployeeForm): Promise<EmployeeDetail>
  updateEmployee(id: string, form: EmployeeForm): Promise<void>

  /* status */
  /** authorize.users.status → hanya ACTIVE <-> DISABLED dari layar ini */
  setAccountStatus(employeeId: string, status: 'ACTIVE' | 'DISABLED'): Promise<void>
  /** master.employment_status_histories + pembaruan employees.employment_status_id */
  changeEmploymentStatus(employeeId: string, input: StatusChangeInput): Promise<void>

  /* data turunan; recordId kosong = tambah baru */
  saveAssignment(employeeId: string, input: AssignmentInput, recordId?: string): Promise<void>
  saveWorkHistory(employeeId: string, input: WorkHistoryInput, recordId?: string): Promise<void>
  saveEducation(employeeId: string, input: EducationInput, recordId?: string): Promise<void>
  saveFamily(employeeId: string, input: FamilyInput, recordId?: string): Promise<void>
  saveBank(employeeId: string, input: BankInput, recordId?: string): Promise<void>
}

/** Seluruh kontrak API: pegawai + organisasi/jabatan */
export interface HrisApi extends EmployeeApi, OrgApi {}

export const api: HrisApi = { ...mockApi, ...mockOrgApi }
