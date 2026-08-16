import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as brandService from '../services/brandService'

const BrandsContext = createContext(null)

export function BrandsProvider({ children }) {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await brandService.listBrands()
    setBrands(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addBrand(brandObj) {
    const next = await brandService.addBrand(brandObj)
    setBrands(next)
    return next
  }

  async function updateBrand(oldName, updatedObj) {
    const next = await brandService.updateBrand(oldName, updatedObj)
    setBrands(next)
    return next
  }

  async function removeBrand(name) {
    const next = await brandService.deleteBrand(name)
    setBrands(next)
    return next
  }

  return (
    <BrandsContext.Provider value={{ brands, loading, addBrand, updateBrand, removeBrand, refresh }}>
      {children}
    </BrandsContext.Provider>
  )
}

export function useBrands() {
  const ctx = useContext(BrandsContext)
  if (!ctx) throw new Error('useBrands must be used within BrandsProvider')
  return ctx
}
