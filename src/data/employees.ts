import type { EmployeePage, EmployeeQuery } from '@/types/employee'
import { employeeStore } from '@/stores/employeeStore'

export { DEPARTMENTS, STATUSES, TYPES, POSITIONS } from './seed'

/**
 * Simulasi pemanggilan API daftar pegawai (data dari store di memori).
 * Ganti isinya dengan `fetch`/axios ke backend Anda.
 */
export function fetchEmployees(q: EmployeeQuery): Promise<EmployeePage> {
  const keyword = q.search.trim().toLowerCase()

  const filtered = employeeStore.all.value.filter((e) => {
    const matchSearch =
      !keyword ||
      e.name.toLowerCase().includes(keyword) ||
      e.department.toLowerCase().includes(keyword) ||
      e.id.toLowerCase().includes(keyword)
    return (
      matchSearch &&
      (q.department === 'Semua' || e.department === q.department) &&
      (q.status === 'Semua' || e.status === q.status) &&
      (q.type === 'Semua' || e.type === q.type)
    )
  })

  const start = (q.page - 1) * q.pageSize
  const result: EmployeePage = {
    data: filtered.slice(start, start + q.pageSize).map((e) => ({
      id: e.id, name: e.name, department: e.department,
      position: e.position, type: e.type, status: e.status,
    })),
    total: filtered.length,
  }
  return new Promise((resolve) => setTimeout(() => resolve(result), 700))
}
