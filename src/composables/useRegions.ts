import { ref } from 'vue'
import { api } from '@/api'
import type { CityRef, DistrictRef, VillageRef } from '@/types/employee'

/** Pilihan wilayah bertingkat: provinsi → kota/kabupaten → kecamatan → kelurahan/desa */
export function useRegions() {
  const cities = ref<CityRef[]>([])
  const districts = ref<DistrictRef[]>([])
  const villages = ref<VillageRef[]>([])

  async function selectProvince(id: string) {
    districts.value = []
    villages.value = []
    cities.value = id ? await api.listCities(id) : []
  }
  async function selectCity(id: string) {
    villages.value = []
    districts.value = id ? await api.listDistricts(id) : []
  }
  async function selectDistrict(id: string) {
    villages.value = id ? await api.listVillages(id) : []
  }
  /** Muat seluruh rantai sekaligus (saat edit, nilai awal sudah terisi) */
  async function loadChain(provinceId: string, cityId: string, districtId: string) {
    const [c, d, v] = await Promise.all([
      provinceId ? api.listCities(provinceId) : Promise.resolve([]),
      cityId ? api.listDistricts(cityId) : Promise.resolve([]),
      districtId ? api.listVillages(districtId) : Promise.resolve([]),
    ])
    cities.value = c
    districts.value = d
    villages.value = v
  }
  return { cities, districts, villages, selectProvince, selectCity, selectDistrict, loadChain }
}
