import { parseImage } from '../utils/image'

export default function ProductThumb({ product, size = 64, className = '' }) {
  const first = product?.images?.[0] || product?.image
  const imgUrl = parseImage(first).url
  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={product?.name}
        style={{ width: size, height: size }}
        className={`object-cover rounded-lg ${className}`}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={`bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-xs text-slate-500 font-semibold ${className}`}
    >
      No Image
    </div>
  )
}
