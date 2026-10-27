import { ref } from 'vue'
import { buildSeedDetails } from '@/data/seed'
import type {
  BankAccount, EmployeeDetail, EmployeeForm, EmployeeStatus, EmploymentType,
  RecordKey, RecordMap,
} from '@/types/employee'
import { uid } from '@/utils/id'

const employees = ref<EmployeeDetail[]>(buildSeedDetails())

export function emptyForm(): EmployeeForm {
  return {
    id: '', name: '', department: '', position: '', type: '', status: 'Aktif',
    nik: '', nip: '', npwp: '', birthPlace: '', birthDate: '', gender: '',
    maritalStatus: '', childCount: '0', religion: '', bloodType: '',
    frontTitle: '', backTitle: '', email: '', phone: '',
    street: '', rt: '', rw: '', village: '', district: '', city: '', province: '', postalCode: '',
    division: '', office: '', supervisor: '', joinDate: '', photo: '',
  }
}

export function toForm(d: EmployeeDetail): EmployeeForm {
  const form = emptyForm()
  ;(Object.keys(form) as (keyof EmployeeForm)[]).forEach((k) => {
    ;(form as unknown as Record<string, unknown>)[k] = String(d[k as keyof EmployeeDetail] ?? '')
  })
  return form
}

function fromForm(form: EmployeeForm) {
  return {
    ...form,
    id: form.id.trim(),
    name: form.name.trim(),
    type: form.type as EmploymentType,
    childCount: Number(form.childCount) || 0,
  }
}

function normalizeBanks(list: BankAccount[], savedId: string) {
  const saved = list.find((b) => b.id === savedId)
  if (saved?.primary) list.forEach((b) => { if (b.id !== savedId) b.primary = false })
  if (list.length && !list.some((b) => b.primary)) list[0].primary = true
}

export const employeeStore = {
  all: employees,

  find(id: string) {
    return employees.value.find((e) => e.id === id)
  },

  exists(id: string) {
    const key = id.trim().toLowerCase()
    return employees.value.some((e) => e.id.toLowerCase() === key)
  },

  create(form: EmployeeForm): EmployeeDetail {
    const base = fromForm(form)
    employees.value.unshift({
      ...base,
      jobHistory: [{
        id: uid(), position: base.position,
        unit: base.division || `Divisi ${base.department}`,
        startDate: base.joinDate, endDate: '', skNumber: '',
      }],
      educations: [], family: [], banks: [],
    })
    return employees.value[0]
  },

  update(id: string, form: EmployeeForm) {
    const emp = employees.value.find((e) => e.id === id)
    if (emp) Object.assign(emp, fromForm(form), { id: emp.id })
  },

  setStatus(id: string, status: EmployeeStatus) {
    const emp = employees.value.find((e) => e.id === id)
    if (emp) emp.status = status
  },

  saveRecord<K extends RecordKey>(empId: string, key: K, record: RecordMap[K]) {
    const emp = employees.value.find((e) => e.id === empId)
    if (!emp) return
    const list = emp[key] as unknown as RecordMap[K][]
    const i = list.findIndex((r) => r.id === record.id)
    if (i >= 0) list.splice(i, 1, record)
    else list.push(record)
    if (key === 'banks') normalizeBanks(emp.banks, record.id)
  },
}
