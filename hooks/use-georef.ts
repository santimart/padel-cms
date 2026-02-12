import { useState, useEffect } from 'react'

export interface Province {
  id: string
  nombre: string
  centroide: {
    lat: number
    lon: number
  }
}

export interface Locality {
  id: string
  nombre: string
  centroide: {
    lat: number
    lon: number
  }
}

interface GeorefResponse<T> {
  cantidad: number
  inicio: number
  total: number
  [key: string]: any
}

interface ProvincesResponse extends GeorefResponse<Province> {
  provincias: Province[]
}

interface LocalitiesResponse extends GeorefResponse<Locality> {
  localidades: Locality[]
}

export function useGeoRef() {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [provincesError, setProvincesError] = useState<string | null>(null)

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const response = await fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre,centroide')
        if (!response.ok) throw new Error('Error al cargar provincias')
        
        const data: ProvincesResponse = await response.json()
        // Sort alphabetically
        const sorted = data.provincias.sort((a, b) => a.nombre.localeCompare(b.nombre))
        setProvinces(sorted)
      } catch (err: any) {
        setProvincesError(err.message)
        console.error('Error fetching provinces:', err)
      } finally {
        setLoadingProvinces(false)
      }
    }

    fetchProvinces()
  }, [])

  // Function to fetch localities for a specific province
  const getLocalities = async (provinceId: string) => {
    try {
      // The API returns all localities for a province if we use max=1000 (usually enough)
      const response = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinceId}&campos=id,nombre,centroide&max=1000`)
      if (!response.ok) throw new Error('Error al cargar localidades')
      
      const data: LocalitiesResponse = await response.json()
      // Sort alphabetically
      return data.localidades.sort((a, b) => a.nombre.localeCompare(b.nombre))
    } catch (err: any) {
      console.error('Error fetching localities:', err)
      throw err
    }
  }

  return {
    provinces,
    loadingProvinces,
    provincesError,
    getLocalities
  }
}
