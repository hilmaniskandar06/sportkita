import { parseImage } from './image'

// Membuat "varian" dari sebuah produk — satu varian per foto.
// Foto yang bertag warna jadi varian dengan warna tsb (klik → detail ?color=...),
// foto tanpa tag warna tetap jadi varian (klik → detail tanpa pilihan warna).
export function getProductVariants(product) {
  if (!product) return []
  const rawImages =
    product.images?.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : []
  if (rawImages.length === 0) {
    return [{ product, color: null, image: null, key: product.id }]
  }
  return rawImages.map((raw, idx) => {
    const img = parseImage(raw)
    return {
      product,
      color: img.color || null,
      image: img,
      key: `${product.id}__${idx}`,
    }
  })
}

export function flattenVariants(products) {
  return (products || []).flatMap(getProductVariants)
}
