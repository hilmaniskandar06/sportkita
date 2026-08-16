import { supabase } from '../config/supabase'

function mapFromDb(c) {
  if (!c) return null
  return {
    ...c,
    image: c.image_url,
  }
}

function mapToDb(c) {
  return {
    id: c.id || c.name.toLowerCase().replace(/\s+/g, '-'),
    name: c.name,
    description: c.description || '',
    image_url: c.image || '',
  }
}

export const DEFAULT_BRANDS = [
  { id: 'nike', name: 'Nike', description: '', image_url: '' },
  { id: 'adidas', name: 'Adidas', description: '', image_url: '' },
  { id: 'puma', name: 'Puma', description: '', image_url: '' },
  { id: 'specs', name: 'Specs', description: '', image_url: '' },
  { id: 'ortuseight', name: 'Ortuseight', description: '', image_url: '' },
  { id: 'mizuno', name: 'Mizuno', description: '', image_url: '' },
  { id: 'asics', name: 'Asics', description: '', image_url: '' },
  { id: 'vans', name: 'Vans', description: '', image_url: '' },
  { id: 'converse', name: 'Converse', description: '', image_url: '' },
  { id: 'mills', name: 'Mills', description: '', image_url: '' },
  { id: 'yonex', name: 'Yonex', description: '', image_url: '' },
  { id: 'lining', name: 'Li-Ning', description: '', image_url: '' },
]

const STORAGE_KEY = 'sk_brands_custom'

function getLocalBrands() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_BRANDS
  } catch {
    return DEFAULT_BRANDS
  }
}

function saveLocalBrands(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

export async function listBrands() {
  try {
    const { data, error } = await supabase.from('brands').select('*')
    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('Brands table tidak ditemukan di Supabase, beralih ke penyimpanan lokal:', error.message)
      }
      return getLocalBrands()
    }
    const mapped = data.map(mapFromDb)
    saveLocalBrands(mapped)
    return mapped
  } catch {
    return getLocalBrands()
  }
}

export async function addBrand(brandObj) {
  const dbData = mapToDb(brandObj)
  const localList = getLocalBrands()
  const exists = localList.some(b => b.name.toLowerCase() === brandObj.name.toLowerCase())
  const nextLocal = exists 
    ? localList.map(b => b.name.toLowerCase() === brandObj.name.toLowerCase() ? mapFromDb(dbData) : b)
    : [...localList, mapFromDb(dbData)]
  saveLocalBrands(nextLocal)

  try {
    const { error } = await supabase.from('brands').insert(dbData)
    if (!error) return listBrands()
  } catch (err) {
    console.warn('Gagal simpan brand ke Supabase, tersimpan di lokal:', err.message)
  }
  return nextLocal
}

export async function updateBrand(oldName, updatedObj) {
  const dbData = mapToDb(updatedObj)
  const localList = getLocalBrands()
  const nextLocal = localList.map(b => b.name.toLowerCase() === oldName.toLowerCase() ? mapFromDb(dbData) : b)
  saveLocalBrands(nextLocal)

  try {
    const { error } = await supabase.from('brands').update(dbData).eq('name', oldName)
    if (!error) return listBrands()
  } catch (err) {
    console.warn('Gagal update brand ke Supabase, tersimpan di lokal:', err.message)
  }
  return nextLocal
}

export async function deleteBrand(name) {
  const localList = getLocalBrands()
  const nextLocal = localList.filter(b => b.name.toLowerCase() !== name.toLowerCase())
  saveLocalBrands(nextLocal)

  try {
    const { error } = await supabase.from('brands').delete().eq('name', name)
    if (!error) return listBrands()
  } catch (err) {
    console.warn('Gagal hapus brand dari Supabase, dihapus dari lokal:', err.message)
  }
  return nextLocal
}
