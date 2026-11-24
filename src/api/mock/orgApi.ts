import type {
  Office, OfficeInput, OrgReferences, OrgUnit, OrgUnitInput, Position, PositionHolder,
  PositionInput, TypeInput, TypeItem, TypeKind,
} from '@/types/organization'
import type { OrgApi } from '../org'
import { ApiError } from '../errors'
import { todayIso } from '@/utils/employee'
import { uid } from '@/utils/id'
import { db } from './db'
import type { TypeRow } from './seed'

const sleep = (ms = 250) => new Promise<void>((r) => setTimeout(r, ms))
const clone = <T>(v: T): T => structuredClone(v)
const norm = (v: string) => v.trim().toLowerCase()
const live = <T extends { deleted: boolean }>(rows: T[]): T[] => rows.filter((r) => !r.deleted)
const fail = (message: string, fieldErrors: Record<string, string> = {}): never => {
  throw new ApiError(message, fieldErrors)
}
const throwIfAny = (errors: Record<string, string>) => {
  if (Object.keys(errors).length) fail('Data belum valid. Periksa kolom yang ditandai.', errors)
}

/** true bila menjadikan newParentId sebagai induk id akan membentuk siklus */
function createsCycle<T extends { id: string }>(rows: T[], id: string, newParentId: string, parentOf: (r: T) => string | null): boolean {
  const seen = new Set<string>()
  let cur: string | null = newParentId
  while (cur) {
    if (cur === id) return true
    if (seen.has(cur)) return false
    seen.add(cur)
    const found: T | undefined = rows.find((r) => r.id === cur)
    cur = found ? parentOf(found) : null
  }
  return false
}

const heldNow = (a: { validFrom: string; validTo: string }) =>
  a.validFrom <= todayIso() && (!a.validTo || a.validTo >= todayIso())
const typeTable = (kind: TypeKind): TypeRow[] =>
  kind === 'UNIT' ? db.unitTypes : kind === 'OFFICE' ? db.officeTypes : db.positionTypes
const typeName = (table: TypeRow[], id: string) => table.find((t) => t.id === id)?.name ?? '-'
const holdersOf = (positionId: string) =>
  db.assignments.filter((a) => a.positionId === positionId && heldNow(a))

function typeUsage(kind: TypeKind, id: string): number {
  if (kind === 'UNIT') return live(db.units).filter((u) => u.unitTypeId === id).length
  if (kind === 'OFFICE') return live(db.officeRows).filter((o) => o.officeTypeId === id).length
  return live(db.positionRows).filter((p) => p.positionTypeId === id).length
}

function assertRegion(f: { provinceId: string; cityId: string; districtId: string; villageId: string }, errors: Record<string, string>) {
  const city = f.cityId ? db.cities.find((c) => c.id === f.cityId) : undefined
  const district = f.districtId ? db.districts.find((d) => d.id === f.districtId) : undefined
  const village = f.villageId ? db.villages.find((v) => v.id === f.villageId) : undefined
  if (city && city.provinceId !== f.provinceId) errors.cityId = 'Kota/kabupaten tidak berada di provinsi yang dipilih.'
  if (district && district.cityId !== f.cityId) errors.districtId = 'Kecamatan tidak berada di kota/kabupaten yang dipilih.'
  if (village && village.districtId !== f.districtId) errors.villageId = 'Kelurahan/desa tidak berada di kecamatan yang dipilih.'
}

export const mockOrgApi: OrgApi = {
  async getOrgReferences(): Promise<OrgReferences> {
    await sleep(150)
    const active = (t: TypeRow[]) => live(t).filter((x) => x.isActive).map(({ id, code, name }) => ({ id, code, name }))
    return clone({
      unitTypes: active(db.unitTypes), officeTypes: active(db.officeTypes),
      positionTypes: active(db.positionTypes), echelons: db.echelons,
    })
  },

  /* ---------- jenis (unit / kantor / jabatan) ---------- */
  async listTypes(kind): Promise<TypeItem[]> {
    await sleep()
    return clone(live(typeTable(kind)).map((t) => ({
      id: t.id, code: t.code, name: t.name, description: t.description, isActive: t.isActive, usageCount: typeUsage(kind, t.id),
    })))
  },
  async saveType(kind, input: TypeInput, id) {
    await sleep(350)
    const table = typeTable(kind)
    const errors: Record<string, string> = {}
    if (live(table).some((t) => t.id !== id && norm(t.code) === norm(input.code))) errors.code = 'Kode sudah digunakan.'
    throwIfAny(errors)
    const row = id ? table.find((t) => t.id === id) : undefined
    const fields = { code: input.code.trim().toUpperCase(), name: input.name.trim(), description: input.description.trim(), isActive: input.isActive }
    if (row) Object.assign(row, fields)
    else table.push({ id: uid(), ...fields, deleted: false })
  },
  async deleteType(kind, id) {
    await sleep(350)
    const row = typeTable(kind).find((t) => t.id === id)
    if (!row) return fail('Data tidak ditemukan.')
    if (typeUsage(kind, id) > 0) fail('Jenis ini masih dipakai. Nonaktifkan saja jika tidak dipakai lagi.')
    row.deleted = true
  },

  /* ---------- unit organisasi ---------- */
  async listUnits(): Promise<OrgUnit[]> {
    await sleep()
    const units = live(db.units)
    return clone(units.map((u) => ({
      id: u.id, parentUnitId: u.parentUnitId, unitTypeId: u.unitTypeId, unitTypeName: typeName(db.unitTypes, u.unitTypeId),
      code: u.code, name: u.name, description: u.description, isActive: u.isActive,
      childCount: units.filter((c) => c.parentUnitId === u.id).length,
      positionCount: live(db.positionRows).filter((p) => p.organizationUnitId === u.id).length,
    })))
  },
  async saveUnit(input: OrgUnitInput, id) {
    await sleep(350)
    const errors: Record<string, string> = {}
    const units = live(db.units)
    if (units.some((u) => u.id !== id && norm(u.code) === norm(input.code))) errors.code = 'Kode unit sudah digunakan.'
    if (!live(db.unitTypes).some((t) => t.id === input.unitTypeId)) errors.unitTypeId = 'Jenis unit tidak valid.'
    if (input.parentUnitId) {
      if (id && input.parentUnitId === id) errors.parentUnitId = 'Unit tidak boleh menjadi induk bagi dirinya sendiri.'
      else if (!units.some((u) => u.id === input.parentUnitId)) errors.parentUnitId = 'Unit induk tidak ditemukan.'
      else if (id && createsCycle(db.units, id, input.parentUnitId, (u) => u.parentUnitId)) {
        errors.parentUnitId = 'Unit induk tidak boleh berupa subunit dari unit ini.'
      }
    }
    throwIfAny(errors)
    const fields = {
      parentUnitId: input.parentUnitId || null, unitTypeId: input.unitTypeId, code: input.code.trim().toUpperCase(),
      name: input.name.trim(), description: input.description.trim(), isActive: input.isActive,
    }
    const row = id ? db.units.find((u) => u.id === id) : undefined
    if (row) Object.assign(row, fields)
    else db.units.push({ id: uid(), ...fields, deleted: false })
  },
  async deleteUnit(id) {
    await sleep(350)
    const row = db.units.find((u) => u.id === id)
    if (!row) return fail('Unit tidak ditemukan.')
    if (live(db.units).some((u) => u.parentUnitId === id)) fail('Unit masih memiliki subunit. Pindahkan atau hapus subunit terlebih dahulu.')
    if (live(db.positionRows).some((p) => p.organizationUnitId === id)) fail('Unit masih memiliki jabatan. Pindahkan atau hapus jabatannya terlebih dahulu.')
    row.deleted = true
  },

  /* ---------- jabatan ---------- */
  async listPositions(): Promise<Position[]> {
    await sleep()
    const rows = live(db.positionRows)
    return clone(rows.map((p) => ({
      id: p.id, organizationUnitId: p.organizationUnitId,
      unitName: db.units.find((u) => u.id === p.organizationUnitId)?.name ?? '-',
      code: p.code, name: p.name, positionTypeId: p.positionTypeId, positionTypeName: typeName(db.positionTypes, p.positionTypeId),
      parentPositionId: p.parentPositionId, parentPositionName: rows.find((x) => x.id === p.parentPositionId)?.name ?? '',
      echelonId: p.echelonId, echelonName: db.echelons.find((e) => e.id === p.echelonId)?.name ?? '',
      allowsMultipleHolders: p.allowsMultipleHolders, levelLabel: p.levelLabel, description: p.description,
      isActive: p.isActive, holderCount: new Set(holdersOf(p.id).map((a) => a.employeeId)).size,
    })))
  },
  async listPositionHolders(positionId): Promise<PositionHolder[]> {
    await sleep(200)
    const list: PositionHolder[] = []
    for (const a of holdersOf(positionId)) {
      const e = db.employees.find((x) => x.id === a.employeeId)
      const p = e ? db.people.find((x) => x.id === e.personId) : undefined
      if (e && p) list.push({ employeeId: e.id, employeeNumber: e.employeeNumber, fullName: p.fullName, validFrom: a.validFrom })
    }
    return clone(list)
  },
  async savePosition(input: PositionInput, id) {
    await sleep(350)
    const errors: Record<string, string> = {}
    const rows = live(db.positionRows)
    if (rows.some((p) => p.id !== id && norm(p.code) === norm(input.code))) errors.code = 'Kode jabatan sudah digunakan.'
    if (!live(db.units).some((u) => u.id === input.organizationUnitId)) errors.organizationUnitId = 'Unit organisasi tidak valid.'
    if (!live(db.positionTypes).some((t) => t.id === input.positionTypeId)) errors.positionTypeId = 'Jenis jabatan tidak valid.'
    if (input.parentPositionId) {
      if (id && input.parentPositionId === id) errors.parentPositionId = 'Jabatan tidak boleh menjadi atasan bagi dirinya sendiri.'
      else if (!rows.some((p) => p.id === input.parentPositionId)) errors.parentPositionId = 'Jabatan atasan tidak ditemukan.'
      else if (id && createsCycle(db.positionRows, id, input.parentPositionId, (p) => p.parentPositionId || null)) {
        errors.parentPositionId = 'Jabatan atasan tidak boleh berupa bawahan dari jabatan ini.'
      }
    }
    if (id && !input.allowsMultipleHolders) {
      const n = new Set(holdersOf(id).map((a) => a.employeeId)).size
      if (n > 1) errors.allowsMultipleHolders = `Jabatan ini sedang dipegang ${n} pegawai, tidak bisa dibatasi satu pemegang.`
    }
    throwIfAny(errors)
    const fields = {
      organizationUnitId: input.organizationUnitId, code: input.code.trim().toUpperCase(), name: input.name.trim(),
      positionTypeId: input.positionTypeId, parentPositionId: input.parentPositionId, echelonId: input.echelonId,
      allowsMultipleHolders: input.allowsMultipleHolders, levelLabel: input.levelLabel.trim(),
      description: input.description.trim(), isActive: input.isActive,
    }
    const row = id ? db.positionRows.find((p) => p.id === id) : undefined
    if (row) Object.assign(row, fields)
    else db.positionRows.push({ id: uid(), ...fields, deleted: false })
  },
  async deletePosition(id) {
    await sleep(350)
    const row = db.positionRows.find((p) => p.id === id)
    if (!row) return fail('Jabatan tidak ditemukan.')
    if (db.assignments.some((a) => a.positionId === id)) fail('Jabatan sudah dipakai pada riwayat penempatan pegawai. Nonaktifkan saja jika tidak dipakai lagi.')
    if (live(db.positionRows).some((p) => p.parentPositionId === id)) fail('Jabatan ini masih menjadi atasan jabatan lain.')
    row.deleted = true
  },

  /* ---------- kantor ---------- */
  async listOffices(): Promise<Office[]> {
    await sleep()
    const rows = live(db.officeRows)
    return clone(rows.map((o) => ({
      id: o.id, officeTypeId: o.officeTypeId, officeTypeName: typeName(db.officeTypes, o.officeTypeId),
      parentOfficeId: o.parentOfficeId, parentOfficeName: rows.find((x) => x.id === o.parentOfficeId)?.name ?? '',
      code: o.code, name: o.name, addressLine: o.addressLine,
      provinceId: o.provinceId, cityId: o.cityId, districtId: o.districtId, villageId: o.villageId,
      provinceName: db.refs.provinces.find((p) => p.id === o.provinceId)?.name ?? '',
      cityName: db.cities.find((c) => c.id === o.cityId)?.name ?? '',
      districtName: db.districts.find((d) => d.id === o.districtId)?.name ?? '',
      villageName: db.villages.find((v) => v.id === o.villageId)?.name ?? '',
      phoneNumber: o.phoneNumber, isActive: o.isActive,
      employeeCount: new Set(db.assignments.filter((a) => a.officeId === o.id && heldNow(a)).map((a) => a.employeeId)).size,
    })))
  },
  async saveOffice(input: OfficeInput, id) {
    await sleep(350)
    const errors: Record<string, string> = {}
    const rows = live(db.officeRows)
    if (rows.some((o) => o.id !== id && norm(o.code) === norm(input.code))) errors.code = 'Kode kantor sudah digunakan.'
    if (!live(db.officeTypes).some((t) => t.id === input.officeTypeId)) errors.officeTypeId = 'Jenis kantor tidak valid.'
    if (input.parentOfficeId) {
      if (id && input.parentOfficeId === id) errors.parentOfficeId = 'Kantor tidak boleh menjadi induk bagi dirinya sendiri.'
      else if (!rows.some((o) => o.id === input.parentOfficeId)) errors.parentOfficeId = 'Kantor induk tidak ditemukan.'
      else if (id && createsCycle(db.officeRows, id, input.parentOfficeId, (o) => o.parentOfficeId || null)) {
        errors.parentOfficeId = 'Kantor induk tidak boleh berupa kantor di bawah kantor ini.'
      }
    }
    assertRegion(input, errors)
    throwIfAny(errors)
    const fields = {
      officeTypeId: input.officeTypeId, parentOfficeId: input.parentOfficeId, code: input.code.trim().toUpperCase(),
      name: input.name.trim(), addressLine: input.addressLine.trim(), provinceId: input.provinceId, cityId: input.cityId,
      districtId: input.districtId, villageId: input.villageId, phoneNumber: input.phoneNumber.trim(), isActive: input.isActive,
    }
    const row = id ? db.officeRows.find((o) => o.id === id) : undefined
    if (row) Object.assign(row, fields)
    else db.officeRows.push({ id: uid(), ...fields, deleted: false })
  },
  async deleteOffice(id) {
    await sleep(350)
    const row = db.officeRows.find((o) => o.id === id)
    if (!row) return fail('Kantor tidak ditemukan.')
    if (db.assignments.some((a) => a.officeId === id)) fail('Kantor sudah dipakai pada penempatan pegawai. Nonaktifkan saja jika tidak dipakai lagi.')
    if (live(db.officeRows).some((o) => o.parentOfficeId === id)) fail('Kantor ini masih menjadi induk kantor lain.')
    row.deleted = true
  },
}
