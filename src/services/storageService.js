import { supabase } from '../config/supabase'

export async function uploadImage(dataUrl, path, bucketName = 'public') {
  try {
    // Convert Data URL to Blob
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    return await uploadFile(blob, path, bucketName)
  } catch (err) {
    console.warn('Gagal upload ke Supabase Storage, menggunakan format data lokal:', err.message)
    return dataUrl
  }
}

export async function uploadFile(fileOrBlob, path, bucketName = 'public') {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(path, fileOrBlob, {
      upsert: true
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path)

  return publicUrlData.publicUrl
}
