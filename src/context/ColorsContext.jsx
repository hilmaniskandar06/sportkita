import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as colorService from '../services/colorService'

const ColorsContext = createContext(null)

export function ColorsProvider({ children }) {
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await colorService.listColors()
    setColors(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addColor(colorObj) {
    const next = await colorService.addColor(colorObj)
    setColors(next)
    return next
  }

  async function updateColor(oldName, updatedObj) {
    const next = await colorService.updateColor(oldName, updatedObj)
    setColors(next)
    return next
  }

  async function removeColor(name) {
    const next = await colorService.deleteColor(name)
    setColors(next)
    return next
  }

  return (
    <ColorsContext.Provider value={{ colors, loading, addColor, updateColor, removeColor, refresh }}>
      {children}
    </ColorsContext.Provider>
  )
}

export function useColors() {
  const ctx = useContext(ColorsContext)
  if (!ctx) throw new Error('useColors must be used within ColorsProvider')
  return ctx
}
