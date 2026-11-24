import type {
  Assignment, AssignmentInput, BankInput, CityRef, DistrictRef, EducationInput, EmployeeDetail,
  EmployeeForm, EmployeeListItem, EmployeeOption, EmployeePage, EmployeeQuery, FamilyInput,
  Person, References, RefItem, StatusChangeInput, VillageRef, WorkHistoryInput,
} from '@/types/employee'
import type { EmployeeApi } from '../index'
import { ApiError } from '../errors'
import { displayAssignment, todayIso } from '@/utils/employee'
import { uid } from '@/utils/id'
import { db } from './db'
import type { AssignmentRow, EmployeeRow, PersonRow } from './seed'

/**
 * Implementasi API palsu: data di memori (hilang saat refresh), latensi disimulasikan.
 * Aturan yang di backend/DB nyata ditegakkan oleh constraint (unik, FK wilayah, dst.)
 * ditiru di sini secukupnya agar perilaku UI-nya bisa dicoba.
 */
const refs = db.refs

const sleep = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms))
const clone = <T>(v: T): T => structuredClone(v)
const byId = <T extends { id: string }>(list: T[], id: string): T | undefined => list.find((x) => x.id === id)
const pick = <T extends RefItem>(list: T[], id: string): RefItem | null => {
  const x = byId(list, id)
  return x ? { id: x.id, code: x.code, name: x.name } : null
}
const norm = (v: string) => v.trim().toLowerCase()

function employeeRow(id: string): EmployeeRow {
  const e = byId(db.employees, id)
  if (!e) throw new ApiError('Pegawai tidak ditemukan.')
  return e
}
const personOf = (e: EmployeeRow): PersonRow => db.people.find((p) => p.id === e.personId)!
const last4Of = (v: string) => v.replace(/\D/g, '').slice(-4)

/* ---------------- row → DTO ---------------- */
function toAssignment(a: AssignmentRow): Assignment {
  const pos = byId(refs.positions, a.positionId)
  const unit = pos ? byId(refs.organizationUnits, pos.organizationUnitId) : undefined
  const parent = unit?.parentUnitId ? byId(refs.organizationUnits, unit.parentUnitId) : undefined
  const boss = a.reportsToEmployeeId ? byId(db.employees, a.reportsToEmployeeId) : undefined
  return {
    id: a.id, positionId: a.positionId, positionName: pos?.name ?? '-', unitName: unit?.name ?? '-',
    parentUnitName: parent?.name ?? '', officeId: a.officeId, officeName: byId(refs.offices, a.officeId)?.name ?? '',
    reportsToEmployeeId: a.reportsToEmployeeId, reportsToName: boss ? personOf(boss).fullName : '',
    validFrom: a.validFrom, validTo: a.validTo, isPrimary: a.isPrimary, note: a.note,
  }
}
const assignmentsOf = (employeeId: string) =>
  db.assignments
    .filter((a) => a.employeeId === employeeId)
    .map(toAssignment)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom))

function toListItem(e: EmployeeRow): EmployeeListItem {
  const cur = displayAssignment(assignmentsOf(e.id))
  const status = byId(refs.employmentStatuses, e.employmentStatusId)!
  return {
    id: e.id, employeeNumber: e.employeeNumber, fullName: personOf(e).fullName,
    unitName: cur ? (cur.parentUnitName ? `${cur.parentUnitName} / ${cur.unitName}` : cur.unitName) : '-',
    positionName: cur?.positionName ?? '-',
    employmentType: pick(refs.employmentTypes, e.employmentTypeId)!,
    employmentStatus: { ...pick(refs.employmentStatuses, status.id)!, isTerminal: status.isTerminal },
  }
}

function toDetail(e: EmployeeRow): EmployeeDetail {
  const p = personOf(e)
  const village = byId(db.villages, p.villageId)
  const person: Person = {
    id: p.id, frontTitle: p.frontTitle, fullName: p.fullName, backTitle: p.backTitle,
    birthDate: p.birthDate, gender: p.gender, bloodType: p.bloodType, maritalStatus: p.maritalStatus,
    phoneNumber: p.phoneNumber, personalEmail: p.personalEmail,
    religion: pick(refs.religions, p.religionId), addressLine: p.addressLine,
    province: pick(refs.provinces, p.provinceId), city: pick(db.cities, p.cityId),
    district: pick(db.districts, p.districtId),
    village: village ? { id: village.id, code: village.code, name: village.name, postalCode: village.postalCode } : null,
  }
  const status = byId(refs.employmentStatuses, e.employmentStatusId)!
  const statusName = (id: string) => byId(refs.employmentStatuses, id)?.name ?? ''
  return {
    id: e.id, employeeNumber: e.employeeNumber, person, workEmail: e.workEmail, workPhone: e.workPhone,
    startDate: e.startDate, endDate: e.endDate,
    employmentType: pick(refs.employmentTypes, e.employmentTypeId)!,
    employmentStatus: { ...pick(refs.employmentStatuses, status.id)!, isTerminal: status.isTerminal },
    accountStatus: e.accountStatus,
    identifiers: db.identifiers.filter((i) => i.personId === p.id).map((i) => {
      const t = byId(refs.identifierTypes, i.typeId)!
      return { id: i.id, typeCode: t.code, typeName: t.name, last4: i.last4 }
    }),
    assignments: assignmentsOf(e.id),
    statusHistories: db.statusHistories
      .filter((h) => h.employeeId === e.id)
      .map((h) => ({
        id: h.id, previousStatusName: statusName(h.previousStatusId), newStatusName: statusName(h.newStatusId),
        changeType: h.changeType, effectiveFrom: h.effectiveFrom, approvalStatus: h.approvalStatus,
        decreeNumber: h.decreeNumber, decreeDate: h.decreeDate, reason: h.reason,
      }))
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)),
    workHistories: db.workHistories
      .filter((w) => w.personId === p.id)
      .map(({ personId: _p, ...w }) => w)
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    educations: db.educations
      .filter((x) => x.personId === p.id)
      .map((x) => ({
        id: x.id, educationLevelId: x.educationLevelId,
        educationLevelName: byId(refs.educationLevels, x.educationLevelId)?.name ?? '-',
        institutionName: x.institutionName, fieldOfStudy: x.fieldOfStudy,
        graduationYear: x.graduationYear, isHighest: x.isHighest,
      }))
      .sort((a, b) => (b.graduationYear ?? 0) - (a.graduationYear ?? 0)),
    family: db.family.filter((f) => f.personId === p.id).map(({ personId: _p, ...f }) => f),
    banks: db.banks
      .filter((b) => b.employeeId === e.id)
      .map((b) => ({
        id: b.id, bankId: b.bankId, bankName: byId(refs.banks, b.bankId)?.name ?? '-',
        accountNumberLast4: b.last4, accountHolderName: b.holderName, isPrimary: b.isPrimary, isActive: b.isActive,
      })),
  }
}

/* ---------------- validasi gaya constraint DB ---------------- */
const employeeNumberTaken = (num: string, exceptId?: string) =>
  db.employees.some((e) => e.id !== exceptId && norm(e.employeeNumber) === norm(num))

function assertEmployeeForm(f: EmployeeForm, exceptId?: string) {
  const errors: Record<string, string> = {}
  if (employeeNumberTaken(f.employeeNumber, exceptId)) errors.employeeNumber = 'Nomor pegawai sudah digunakan.'
  const city = f.cityId ? byId(db.cities, f.cityId) : undefined
  const district = f.districtId ? byId(db.districts, f.districtId) : undefined
  const village = f.villageId ? byId(db.villages, f.villageId) : undefined
  if (city && city.provinceId !== f.provinceId) errors.cityId = 'Kota/kabupaten tidak berada di provinsi yang dipilih.'
  if (district && district.cityId !== f.cityId) errors.districtId = 'Kecamatan tidak berada di kota/kabupaten yang dipilih.'
  if (village && village.districtId !== f.districtId) errors.villageId = 'Kelurahan/desa tidak berada di kecamatan yang dipilih.'
  if (Object.keys(errors).length) throw new ApiError('Data belum valid. Periksa kolom yang ditandai.', errors)
}

function personFields(f: EmployeeForm): Omit<PersonRow, 'id'> {
  return {
    frontTitle: f.frontTitle.trim(), fullName: f.fullName.trim(), backTitle: f.backTitle.trim(),
    birthDate: f.birthDate, gender: f.gender, bloodType: f.bloodType, maritalStatus: f.maritalStatus,
    phoneNumber: f.phoneNumber.trim(), personalEmail: f.personalEmail.trim(), religionId: f.religionId,
    addressLine: f.addressLine.trim(), provinceId: f.provinceId, cityId: f.cityId,
    districtId: f.districtId, villageId: f.villageId,
  }
}

function upsertIdentifier(personId: string, typeCode: string, value: string) {
  if (!value.trim()) return
  const type = refs.identifierTypes.find((t) => t.code === typeCode)!
  const existing = db.identifiers.find((i) => i.personId === personId && i.typeId === type.id)
  if (existing) existing.last4 = last4Of(value)
  else db.identifiers.push({ id: uid(), personId, typeId: type.id, last4: last4Of(value) })
}

const isOpen = (a: AssignmentRow) => !a.validTo || a.validTo >= todayIso()
const isHeldNow = (a: { validFrom: string; validTo: string }) => a.validFrom <= todayIso() && (!a.validTo || a.validTo >= todayIso())

/** Jabatan harus aktif; jabatan yang tidak boleh banyak pemegang tidak boleh sedang dipegang pegawai lain */
function assertPositionAvailable(positionId: string, exceptEmployeeId?: string) {
  const pos = db.positionRows.find((p) => p.id === positionId)
  if (!pos || pos.deleted || !pos.isActive) {
    throw new ApiError('Jabatan tidak aktif.', { positionId: 'Jabatan tidak aktif atau tidak ditemukan.' })
  }
  if (!pos.allowsMultipleHolders) {
    const taken = db.assignments.some((a) => a.positionId === positionId && a.employeeId !== exceptEmployeeId && isHeldNow(a))
    if (taken) throw new ApiError('Jabatan sudah terisi.', { positionId: 'Jabatan ini hanya boleh dipegang satu pegawai dan sudah terisi.' })
  }
}

function descendantUnitIds(unitId: string): Set<string> {
  const set = new Set([unitId])
  let changed = true
  while (changed) {
    changed = false
    for (const u of refs.organizationUnits) {
      if (u.parentUnitId && set.has(u.parentUnitId) && !set.has(u.id)) { set.add(u.id); changed = true }
    }
  }
  return set
}

export const mockApi: EmployeeApi = {
  /* ---------- referensi ---------- */
  async getReferences(): Promise<References> {
    await sleep(200)
    // hanya data aktif yang boleh dipilih pada form (data nonaktif/terhapus tetap terbaca di riwayat)
    const units = db.units.filter((u) => u.isActive && !u.deleted)
    const unitIds = new Set(units.map((u) => u.id))
    return clone({
      ...refs,
      organizationUnits: units.map(({ id, code, name, parentUnitId }) => ({ id, code, name, parentUnitId })),
      positions: db.positionRows
        .filter((p) => p.isActive && !p.deleted && unitIds.has(p.organizationUnitId))
        .map(({ id, code, name, organizationUnitId }) => ({ id, code, name, organizationUnitId })),
      offices: db.officeRows.filter((o) => o.isActive && !o.deleted).map(({ id, code, name }) => ({ id, code, name })),
    })
  },
  async listCities(provinceId): Promise<CityRef[]> { await sleep(150); return clone(db.cities.filter((c) => c.provinceId === provinceId)) },
  async listDistricts(cityId): Promise<DistrictRef[]> { await sleep(150); return clone(db.districts.filter((d) => d.cityId === cityId)) },
  async listVillages(districtId): Promise<VillageRef[]> { await sleep(150); return clone(db.villages.filter((v) => v.districtId === districtId)) },
  async listEmployeeOptions(): Promise<EmployeeOption[]> {
    await sleep(200)
    return db.employees
      .map((e) => ({ id: e.id, employeeNumber: e.employeeNumber, fullName: personOf(e).fullName }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'id'))
  },

  /* ---------- pegawai ---------- */
  async listEmployees(q: EmployeeQuery): Promise<EmployeePage> {
    await sleep(600)
    const keyword = norm(q.search)
    const unitIds = q.unitId ? descendantUnitIds(q.unitId) : null
    const items = db.employees
      .map((e) => ({ e, item: toListItem(e), cur: displayAssignment(assignmentsOf(e.id)) }))
      .filter(({ e, item, cur }) => {
        const pos = cur ? byId(refs.positions, cur.positionId) : undefined
        const matchSearch =
          !keyword ||
          norm(item.fullName).includes(keyword) ||
          norm(item.employeeNumber).includes(keyword) ||
          norm(item.unitName).includes(keyword) ||
          norm(item.positionName).includes(keyword)
        return (
          matchSearch &&
          (!unitIds || (!!pos && unitIds.has(pos.organizationUnitId))) &&
          (!q.statusId || e.employmentStatusId === q.statusId) &&
          (!q.typeId || e.employmentTypeId === q.typeId)
        )
      })
      .map(({ item }) => item)
    const start = (q.page - 1) * q.pageSize
    return clone({ data: items.slice(start, start + q.pageSize), total: items.length })
  },

  async getEmployee(id) {
    await sleep(350)
    const e = byId(db.employees, id)
    return e ? clone(toDetail(e)) : null
  },

  async isEmployeeNumberTaken(employeeNumber, exceptEmployeeId) {
    await sleep(120)
    return employeeNumberTaken(employeeNumber, exceptEmployeeId)
  },

  async createEmployee(f) {
    await sleep(500)
    assertEmployeeForm(f)
    assertPositionAvailable(f.positionId)
    const personId = uid()
    const employeeId = uid()
    db.people.push({ id: personId, ...personFields(f) })
    upsertIdentifier(personId, 'NIK', f.nik)
    upsertIdentifier(personId, 'NPWP', f.npwp)
    upsertIdentifier(personId, 'NIP', f.nip)
    const status = byId(refs.employmentStatuses, f.employmentStatusId)!
    db.employees.unshift({
      id: employeeId, personId, employeeNumber: f.employeeNumber.trim(),
      employmentTypeId: f.employmentTypeId, employmentStatusId: f.employmentStatusId,
      startDate: f.startDate, endDate: '', workEmail: f.workEmail.trim(), workPhone: f.workPhone.trim(),
      accountStatus: null,
    })
    db.assignments.push({
      id: uid(), employeeId, positionId: f.positionId, officeId: f.officeId,
      reportsToEmployeeId: f.reportsToEmployeeId, validFrom: f.startDate, validTo: '', isPrimary: true, note: '',
    })
    db.statusHistories.push({
      id: uid(), employeeId, previousStatusId: '', newStatusId: status.id, changeType: 'INITIAL',
      effectiveFrom: f.startDate, approvalStatus: 'APPROVED', decreeNumber: '', decreeDate: '', reason: '',
    })
    return clone(toDetail(db.employees[0]))
  },

  async updateEmployee(id, f) {
    await sleep(500)
    const e = employeeRow(id)
    assertEmployeeForm(f, id)
    Object.assign(personOf(e), personFields(f))
    upsertIdentifier(e.personId, 'NIK', f.nik)
    upsertIdentifier(e.personId, 'NPWP', f.npwp)
    upsertIdentifier(e.personId, 'NIP', f.nip)
    Object.assign(e, {
      employmentTypeId: f.employmentTypeId, startDate: f.startDate,
      workEmail: f.workEmail.trim(), workPhone: f.workPhone.trim(),
    })
    // Penempatan berubah → riwayat lama ditutup, penempatan baru dibuka (backend nyata: aturannya di server)
    const latest = displayAssignment(assignmentsOf(id))
    const changed =
      !latest || latest.positionId !== f.positionId || latest.officeId !== f.officeId ||
      latest.reportsToEmployeeId !== f.reportsToEmployeeId
    if (changed) {
      if (latest?.positionId !== f.positionId) assertPositionAvailable(f.positionId, id)
      const today = todayIso()
      const base = latest ? db.assignments.find((a) => a.id === latest.id) : undefined
      if (base && base.validFrom === today) {
        Object.assign(base, { positionId: f.positionId, officeId: f.officeId, reportsToEmployeeId: f.reportsToEmployeeId })
      } else {
        if (base && isOpen(base)) base.validTo = today
        db.assignments.push({
          id: uid(), employeeId: id, positionId: f.positionId, officeId: f.officeId,
          reportsToEmployeeId: f.reportsToEmployeeId, validFrom: today, validTo: '', isPrimary: true, note: '',
        })
      }
    }
  },

  /* ---------- status ---------- */
  async setAccountStatus(employeeId, status) {
    await sleep(400)
    const e = employeeRow(employeeId)
    if (e.accountStatus === null || e.accountStatus === 'INVITED') {
      throw new ApiError('Pegawai ini belum memiliki akun yang aktif.')
    }
    e.accountStatus = status
  },

  async changeEmploymentStatus(employeeId, input: StatusChangeInput) {
    await sleep(450)
    const e = employeeRow(employeeId)
    const next = byId(refs.employmentStatuses, input.newStatusId)
    if (!next) throw new ApiError('Status kepegawaian tidak valid.', { newStatusId: 'Pilih status yang valid.' })
    if (next.id === e.employmentStatusId) {
      throw new ApiError('Status baru sama dengan status saat ini.', { newStatusId: 'Pilih status yang berbeda dari status saat ini.' })
    }
    // Mock: langsung APPROVED. Di sistem nyata, perubahan berlaku setelah persetujuan (PENDING → APPROVED/REJECTED).
    db.statusHistories.push({
      id: uid(), employeeId, previousStatusId: e.employmentStatusId, newStatusId: next.id,
      changeType: next.isTerminal ? 'SEPARATION' : 'CHANGE', effectiveFrom: input.effectiveFrom,
      approvalStatus: 'APPROVED', decreeNumber: input.decreeNumber.trim(), decreeDate: input.decreeDate,
      reason: input.reason.trim(),
    })
    e.employmentStatusId = next.id
    e.endDate = next.isTerminal ? input.effectiveFrom : ''
  },

  /* ---------- data turunan ---------- */
  async saveAssignment(employeeId, input: AssignmentInput, recordId) {
    await sleep(400)
    employeeRow(employeeId)
    if (input.validTo && input.validTo < input.validFrom) {
      throw new ApiError('Tanggal selesai tidak boleh sebelum tanggal mulai.', { validTo: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' })
    }
    if (isHeldNow({ validFrom: input.validFrom, validTo: input.validTo })) assertPositionAvailable(input.positionId, employeeId)
    const fields = {
      positionId: input.positionId, officeId: input.officeId, reportsToEmployeeId: input.reportsToEmployeeId,
      validFrom: input.validFrom, validTo: input.validTo, isPrimary: input.isPrimary, note: input.note.trim(),
    }
    let row = recordId ? db.assignments.find((a) => a.id === recordId) : undefined
    if (row) Object.assign(row, fields)
    else {
      row = { id: uid(), employeeId, ...fields }
      db.assignments.push(row)
    }
    if (row.isPrimary && !row.validTo) {
      for (const o of db.assignments) {
        if (o.employeeId === employeeId && o.id !== row.id && o.isPrimary && !o.validTo) {
          o.validTo = row.validFrom < o.validFrom ? o.validFrom : row.validFrom
        }
      }
    }
  },

  async saveWorkHistory(employeeId, input: WorkHistoryInput, recordId) {
    await sleep(400)
    const personId = employeeRow(employeeId).personId
    const fields = {
      employerName: input.employerName.trim(), positionName: input.positionName.trim(),
      startDate: input.startDate, endDate: input.endDate, description: input.description.trim(),
    }
    const row = recordId ? db.workHistories.find((w) => w.id === recordId) : undefined
    if (row) Object.assign(row, fields)
    else db.workHistories.push({ id: uid(), personId, ...fields })
  },

  async saveEducation(employeeId, input: EducationInput, recordId) {
    await sleep(400)
    const personId = employeeRow(employeeId).personId
    const fields = {
      educationLevelId: input.educationLevelId, institutionName: input.institutionName.trim(),
      fieldOfStudy: input.fieldOfStudy.trim(), graduationYear: input.graduationYear ? Number(input.graduationYear) : null,
      isHighest: input.isHighest,
    }
    let row = recordId ? db.educations.find((x) => x.id === recordId) : undefined
    if (row) Object.assign(row, fields)
    else {
      row = { id: uid(), personId, ...fields }
      db.educations.push(row)
    }
    if (row.isHighest) db.educations.forEach((x) => { if (x.personId === personId && x.id !== row!.id) x.isHighest = false })
  },

  async saveFamily(employeeId, input: FamilyInput, recordId) {
    await sleep(400)
    const personId = employeeRow(employeeId).personId
    if (!input.relationshipType) throw new ApiError('Hubungan wajib dipilih.')
    const fields = {
      relationshipType: input.relationshipType, gender: input.gender, fullName: input.fullName.trim(),
      birthDate: input.birthDate, phoneNumber: input.phoneNumber.trim(), isDependent: input.isDependent,
    }
    const row = recordId ? db.family.find((x) => x.id === recordId) : undefined
    if (row) Object.assign(row, fields)
    else db.family.push({ id: uid(), personId, ...fields })
  },

  async saveBank(employeeId, input: BankInput, recordId) {
    await sleep(400)
    employeeRow(employeeId)
    const existing = recordId ? db.banks.find((b) => b.id === recordId) : undefined
    const mine = db.banks.filter((b) => b.employeeId === employeeId)
    const row = existing ?? {
      id: uid(), employeeId, bankId: '', last4: '', holderName: '', isPrimary: false, isActive: true,
    }
    row.bankId = input.bankId
    row.holderName = input.accountHolderName.trim()
    if (input.accountNumber.trim()) row.last4 = last4Of(input.accountNumber)
    row.isPrimary = input.isPrimary || (mine.length === 0 && !existing)
    if (!existing) db.banks.push(row)
    if (row.isPrimary) db.banks.forEach((b) => { if (b.employeeId === employeeId && b.id !== row.id) b.isPrimary = false })
    else if (!db.banks.some((b) => b.employeeId === employeeId && b.isPrimary)) row.isPrimary = true
  },
}
