import { supabase } from '../config/supabase'

const STORAGE_KEY = 'sk_colors_custom'

function mapFromDb(c) {
  if (!c) return null
  return {
    ...c,
    hexCode: c.hex_code || c.hexCode || '#000000',
    secondaryHex: c.secondary_hex || c.secondaryHex || null,
  }
}

function mapToDb(c) {
  return {
    id: c.id || c.name.toLowerCase().replace(/\s+/g, '-'),
    name: c.name,
    hex_code: c.hexCode || '#000000',
    secondary_hex: c.secondaryHex || null,
  }
}

export const DEFAULT_COLORS = [
  { id: 'hitam', name: 'Hitam', hexCode: '#000000', secondaryHex: null },
  { id: 'putih', name: 'Putih', hexCode: '#FFFFFF', secondaryHex: null },
  { id: 'hitam-putih', name: 'Hitam / Putih', hexCode: '#000000', secondaryHex: '#FFFFFF' },
  { id: 'merah-hitam', name: 'Merah / Hitam', hexCode: '#EF4444', secondaryHex: '#000000' },
  { id: 'navy-putih', name: 'Navy / Putih', hexCode: '#1E3A8A', secondaryHex: '#FFFFFF' },
  { id: 'biru-putih', name: 'Biru / Putih', hexCode: '#3B82F6', secondaryHex: '#FFFFFF' },
  { id: 'emas-hitam', name: 'Emas / Hitam', hexCode: '#EAB308', secondaryHex: '#000000' },
  { id: 'merah', name: 'Merah', hexCode: '#EF4444', secondaryHex: null },
  { id: 'biru', name: 'Biru', hexCode: '#3B82F6', secondaryHex: null },
  { id: 'navy', name: 'Navy', hexCode: '#1E3A8A', secondaryHex: null },
  { id: 'hijau', name: 'Hijau', hexCode: '#10B981', secondaryHex: null },
  { id: 'kuning', name: 'Kuning', hexCode: '#FBBF24', secondaryHex: null },
  { id: 'abu-abu', name: 'Abu-abu', hexCode: '#6B7280', secondaryHex: null },
  { id: 'orange', name: 'Orange', hexCode: '#F97316', secondaryHex: null },
  { id: 'pink', name: 'Pink', hexCode: '#EC4899', secondaryHex: null },
  { id: 'ungu', name: 'Ungu', hexCode: '#8B5CF6', secondaryHex: null },
  { id: 'coklat', name: 'Coklat', hexCode: '#78350F', secondaryHex: null },
  { id: 'emas', name: 'Emas', hexCode: '#EAB308', secondaryHex: null },
  { id: 'silver', name: 'Silver', hexCode: '#94A3B8', secondaryHex: null },
]

function getLocalColors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_COLORS
  } catch {
    return DEFAULT_COLORS
  }
}

function saveLocalColors(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

export function getColorStyle(colorObj) {
  if (!colorObj) return { backgroundColor: '#000000' }
  const hex1 = colorObj.hex_code || colorObj.hexCode || '#000000'
  const hex2 = colorObj.secondary_hex || colorObj.secondaryHex
  if (hex2) {
    return {
      background: `linear-gradient(135deg, ${hex1} 50%, ${hex2} 50%)`,
    }
  }
  return { backgroundColor: hex1 }
}

export async function listColors() {
  try {
    const { data, error } = await supabase.from('colors').select('*')
    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('Colors table tidak ditemukan di Supabase, beralih ke penyimpanan lokal:', error.message)
      }
      return getLocalColors()
    }
    const mapped = data.map(mapFromDb)
    saveLocalColors(mapped)
    return mapped
  } catch {
    return getLocalColors()
  }
}

export async function addColor(colorObj) {
  const dbData = mapToDb(colorObj)
  const localList = getLocalColors()
  const exists = localList.some(c => c.name.toLowerCase() === colorObj.name.toLowerCase())
  const nextLocal = exists 
    ? localList.map(c => c.name.toLowerCase() === colorObj.name.toLowerCase() ? mapFromDb(dbData) : c)
    : [...localList, mapFromDb(dbData)]
  saveLocalColors(nextLocal)

  try {
    const { error } = await supabase.from('colors').insert(dbData)
    if (!error) return listColors()
  } catch (err) {
    console.warn('Gagal simpan warna ke Supabase, tersimpan di lokal:', err.message)
  }
  return nextLocal
}

export async function updateColor(oldName, updatedObj) {
  const dbData = mapToDb(updatedObj)
  const localList = getLocalColors()
  const nextLocal = localList.map(c => c.name.toLowerCase() === oldName.toLowerCase() ? mapFromDb(dbData) : c)
  saveLocalColors(nextLocal)

  try {
    const { error } = await supabase.from('colors').update(dbData).eq('name', oldName)
    if (!error) return listColors()
  } catch (err) {
    console.warn('Gagal update warna ke Supabase, tersimpan di lokal:', err.message)
  }
  return nextLocal
}

export async function deleteColor(name) {
  const localList = getLocalColors()
  const nextLocal = localList.filter(c => c.name.toLowerCase() !== name.toLowerCase())
  saveLocalColors(nextLocal)

  try {
    const { error } = await supabase.from('colors').delete().eq('name', name)
    if (!error) return listColors()
  } catch (err) {
    console.warn('Gagal hapus warna dari Supabase, dihapus dari lokal:', err.message)
  }
  return nextLocal
}
