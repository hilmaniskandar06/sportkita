import { supabase } from '../config/supabase'
import { SEED_PRODUCTS } from '../data/products'

function mapFromDb(dbItem) {
  if (!dbItem) return null
  return {
    ...dbItem,
    oldPrice: dbItem.old_price,
    inStock: dbItem.in_stock,
    contentVolume: dbItem.content_volume,
    isNew: dbItem.is_new,
    shortDesc: dbItem.short_desc,
    longDesc: dbItem.description,
    externalLink: dbItem.external_link || null,
    sportType: dbItem.sport_type,
    sold: Number(dbItem.sold || 0),
    brand: dbItem.brand || '',
    colors: dbItem.colors || '',
  }
}

function mapToDb(item, excludeBrandColor = false) {
  const data = {
    id: item.id,
    name: item.name,
    price: item.price,
    old_price: item.oldPrice,
    category: item.category,
    weight: item.weight,
    in_stock: item.inStock,
    content_volume: item.contentVolume,
    is_new: item.isNew,
    short_desc: item.shortDesc,
    description: item.longDesc || item.description,
    images: item.images || [],
    external_link: item.externalLink || null,
    size: item.size || null,
    gender: item.gender || null,
    sport_type: item.sportType || item.sport_type || null,
    material: item.material || null,
    sold: Number(item.sold || 0)
  }
  if (!excludeBrandColor) {
    if (item.brand !== undefined) data.brand = item.brand || null
    if (item.colors !== undefined) data.colors = item.colors || null
  }
  return data
}

export async function incrementProductsSold(itemsWithQty) {
  if (!itemsWithQty || !itemsWithQty.length) return []
  const results = []
  for (const { id, qty } of itemsWithQty) {
    if (!id || !qty) continue
    const { data: current } = await supabase.from('products').select('sold').eq('id', id).maybeSingle()
    const newSold = Number(current?.sold || 0) + Number(qty || 0)
    const { data, error } = await supabase
      .from('products')
      .update({ sold: newSold })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (!error && data) results.push(mapFromDb(data))
  }
  return results
}

export async function decrementProductsSold(itemsWithQty) {
  if (!itemsWithQty || !itemsWithQty.length) return []
  const results = []
  for (const { id, qty } of itemsWithQty) {
    if (!id || !qty) continue
    const { data: current } = await supabase.from('products').select('sold').eq('id', id).maybeSingle()
    const newSold = Math.max(0, Number(current?.sold || 0) - Number(qty || 0))
    const { data, error } = await supabase
      .from('products')
      .update({ sold: newSold })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (!error && data) results.push(mapFromDb(data))
  }
  return results
}

export async function listProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('Error listProducts:', error)
    return []
  }
  return data.map(mapFromDb)
}

export async function getProduct(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return mapFromDb(data)
}

export async function createProduct(payload) {
  const id = payload.id || 'p' + Date.now()
  let dbData = mapToDb({ ...payload, id })
  let { data, error } = await supabase.from('products').insert(dbData).select().single()
  
  if (error && (error.message?.includes('brand') || error.message?.includes('colors') || error.message?.includes('schema cache'))) {
    console.warn('Kolom brand/colors belum ada di database products, menyimpan tanpa kolom tersebut:', error.message)
    dbData = mapToDb({ ...payload, id }, true)
    const retry = await supabase.from('products').insert(dbData).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)
  return mapFromDb(data)
}

export async function updateProduct(id, payload) {
  let dbData = mapToDb({ ...payload, id })
  let { data, error } = await supabase.from('products').update(dbData).eq('id', id).select().single()

  if (error && (error.message?.includes('brand') || error.message?.includes('colors') || error.message?.includes('schema cache'))) {
    console.warn('Kolom brand/colors belum ada di database products, menyimpan tanpa kolom tersebut:', error.message)
    dbData = mapToDb({ ...payload, id }, true)
    const retry = await supabase.from('products').update(dbData).eq('id', id).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)
  return mapFromDb(data)
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}

export async function resetProducts() {
  const dbItems = SEED_PRODUCTS.map(mapToDb)
  const { error } = await supabase.from('products').upsert(dbItems)
  if (error) throw new Error(error.message)
  return SEED_PRODUCTS
}
