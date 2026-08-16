// Mengubah file gambar menjadi dataURL base64 yang sudah dikompres.
// Format output menyesuaikan file asli: PNG/WebP -> PNG (agar transparansi tetap).
// JPG/JPEG/GIF -> JPEG (hemat size, tapi tanpa transparansi).
export function resizeImage(file, maxWidth = 640, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('File bukan gambar yang valid'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')

        const isPngOrWebp = /png|webp/i.test(file.type || file.name || '')

        if (isPngOrWebp) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/png'))
        } else {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function parseImage(img) {
  if (!img) return { url: '', color: '' }
  if (typeof img === 'object') {
    return { url: img.url || '', color: img.color || '' }
  }
  if (typeof img === 'string') {
    if (img.startsWith('{') && img.includes('"url"')) {
      try {
        const parsed = JSON.parse(img)
        return { url: parsed.url || '', color: parsed.color || '' }
      } catch {}
    }
    const idx = img.indexOf('#color=')
    if (idx !== -1) {
      return {
        url: img.slice(0, idx),
        color: decodeURIComponent(img.slice(idx + 7))
      }
    }
    return { url: img, color: '' }
  }
  return { url: String(img), color: '' }
}

export function formatImage(url, color) {
  if (!url) return ''
  const cleanUrl = url.split('#color=')[0]
  if (!color) return cleanUrl
  return `${cleanUrl}#color=${encodeURIComponent(color)}`
}
