'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface GenerateZonesButtonProps {
  tournamentId: string
  onSuccess?: () => void
}

export function GenerateZonesButton({ tournamentId, onSuccess }: GenerateZonesButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerateZones = async () => {
    if (!confirm('¿Estás seguro de generar las zonas? Esto cerrará las inscripciones y no se podrán agregar más parejas.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/generate-zones`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar zonas')
      }

      // Success! Reload tournament data
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (err: any) {
      console.error('Error generating zones:', err)
      setError(err.message || 'Error al generar zonas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}
      <Button 
        className="w-full" 
        size="lg"
        onClick={handleGenerateZones}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
            Generando zonas...
          </>
        ) : (
          'Generar Zonas y Comenzar Torneo'
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Esto cerrará las inscripciones y generará automáticamente las zonas
      </p>
    </div>
  )
}
