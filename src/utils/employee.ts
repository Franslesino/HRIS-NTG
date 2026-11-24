import type {
  Assignment, EmployeeDetail, EmployeeForm, EmploymentStatusRef, PositionRef, References,
} from '@/types/employee'

export const todayIso = (): string => new Date().toISOString().slice(0, 10)

/** Penempatan yang sedang berlaku (utama lebih diutamakan) */
export function currentAssignment(list: Assignment[]): Assignment | null {
  const today = todayIso()
  const active = list.filter((a) => a.validFrom <= today && (!a.validTo || a.validTo >= today))
  active.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || b.validFrom.localeCompare(a.validFrom))
  return active[0] ?? null
}

/** Penempatan yang ditampilkan di header/daftar: yang berlaku, atau yang terakhir bila sudah berakhir */
export function displayAssignment(list: Assignment[]): Assignment | null {
  return currentAssignment(list) ?? [...list].sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0] ?? null
}

/** "Teknologi Informasi / Divisi Infrastruktur" */
export function unitPath(unitId: string, units: { id: string; name: string; parentUnitId: string | null }[]): string {
  const names: string[] = []
  let cur = units.find((u) => u.id === unitId)
  while (cur) {
    names.unshift(cur.name)
    const parentId: string | null = cur.parentUnitId
    cur = parentId ? units.find((u) => u.id === parentId) : undefined
  }
  return names.join(' / ')
}

/** Jabatan dikelompokkan per unit untuk <optgroup> */
export function positionGroups(refs: References | null): { label: string; items: PositionRef[] }[] {
  if (!refs) return []
  const map = new Map<string, PositionRef[]>()
  for (const p of refs.positions) {
    const label = unitPath(p.organizationUnitId, refs.organizationUnits)
    map.set(label, [...(map.get(label) ?? []), p])
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'id'))
    .map(([label, items]) => ({ label, items: items.sort((a, b) => a.name.localeCompare(b.name, 'id')) }))
}

export type StatusTone = 'ok' | 'warn' | 'off'
export function statusTone(s: Pick<EmploymentStatusRef, 'code' | 'isTerminal'>): StatusTone {
  if (s.isTerminal) return 'off'
  return s.code === 'PROBATION' ? 'warn' : 'ok'
}

export function emptyForm(): EmployeeForm {
  return {
    frontTitle: '', fullName: '', backTitle: '', birthDate: '', gender: '', bloodType: '',
    maritalStatus: '', religionId: '', phoneNumber: '', personalEmail: '',
    addressLine: '', provinceId: '', cityId: '', districtId: '', villageId: '',
    nik: '', npwp: '', nip: '',
    employeeNumber: '', workEmail: '', workPhone: '', startDate: '',
    employmentTypeId: '', employmentStatusId: '',
    positionId: '', officeId: '', reportsToEmployeeId: '',
  }
}

/** Detail → nilai form (identitas sensitif sengaja dikosongkan) */
export function toForm(d: EmployeeDetail): EmployeeForm {
  const p = d.person
  const cur = displayAssignment(d.assignments)
  return {
    ...emptyForm(),
    frontTitle: p.frontTitle, fullName: p.fullName, backTitle: p.backTitle,
    birthDate: p.birthDate, gender: p.gender, bloodType: p.bloodType, maritalStatus: p.maritalStatus,
    religionId: p.religion?.id ?? '', phoneNumber: p.phoneNumber, personalEmail: p.personalEmail,
    addressLine: p.addressLine,
    provinceId: p.province?.id ?? '', cityId: p.city?.id ?? '',
    districtId: p.district?.id ?? '', villageId: p.village?.id ?? '',
    employeeNumber: d.employeeNumber, workEmail: d.workEmail, workPhone: d.workPhone,
    startDate: d.startDate,
    employmentTypeId: d.employmentType.id, employmentStatusId: d.employmentStatus.id,
    positionId: cur?.positionId ?? '', officeId: cur?.officeId ?? '',
    reportsToEmployeeId: cur?.reportsToEmployeeId ?? '',
  }
}
