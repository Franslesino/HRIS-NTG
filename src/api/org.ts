import type {
  Office, OfficeInput, OrgReferences, OrgUnit, OrgUnitInput, Position, PositionHolder,
  PositionInput, TypeInput, TypeItem, TypeKind,
} from '@/types/organization'

/**
 * KONTRAK API modul Organisasi & Jabatan.
 * Penghapusan = soft delete (deleted_at). Server menolak penghapusan data yang masih dipakai
 * (unit bersubunit/berjabatan, jabatan yang pernah ditempati, kantor yang dipakai penempatan, jenis yang dipakai).
 * Kesalahan validasi dikirim sebagai ApiError.fieldErrors {namaKolom: pesan}.
 */
export interface OrgApi {
  getOrgReferences(): Promise<OrgReferences>

  listTypes(kind: TypeKind): Promise<TypeItem[]>
  saveType(kind: TypeKind, input: TypeInput, id?: string): Promise<void>
  deleteType(kind: TypeKind, id: string): Promise<void>

  listUnits(): Promise<OrgUnit[]>
  saveUnit(input: OrgUnitInput, id?: string): Promise<void>
  deleteUnit(id: string): Promise<void>

  listPositions(): Promise<Position[]>
  listPositionHolders(positionId: string): Promise<PositionHolder[]>
  savePosition(input: PositionInput, id?: string): Promise<void>
  deletePosition(id: string): Promise<void>

  listOffices(): Promise<Office[]>
  saveOffice(input: OfficeInput, id?: string): Promise<void>
  deleteOffice(id: string): Promise<void>
}
