import type { OrgUnit, UnitNode } from '@/types/organization'

/** Daftar datar → pohon (urut nama) */
export function buildUnitTree(units: OrgUnit[]): UnitNode[] {
  const map = new Map<string, UnitNode>()
  units.forEach((u) => map.set(u.id, { ...u, children: [] }))
  const roots: UnitNode[] = []
  for (const n of map.values()) {
    const parent = n.parentUnitId ? map.get(n.parentUnitId) : undefined
    if (parent) parent.children.push(n)
    else roots.push(n)
  }
  const sort = (list: UnitNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name, 'id'))
    list.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

/** id unit + seluruh turunannya */
export function descendantIds(units: { id: string; parentUnitId: string | null }[], id: string): Set<string> {
  const set = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    for (const u of units) {
      if (u.parentUnitId && set.has(u.parentUnitId) && !set.has(u.id)) { set.add(u.id); changed = true }
    }
  }
  return set
}
