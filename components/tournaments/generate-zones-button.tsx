'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ZonePreviewDialog } from '@/components/tournaments/zone-preview-dialog'

interface GenerateZonesButtonProps {
  tournamentId: string
  pairsCount: number
  onSuccess?: () => void
}

export function GenerateZonesButton({ tournamentId, pairsCount, onSuccess }: GenerateZonesButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const isEnoughPairs = pairsCount >= 12

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-2">
      {!isEnoughPairs && (
        <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
          ⚠️ Se requieren al menos 12 parejas para comenzar el torneo (actual: {pairsCount})
        </div>
      )}

      <Button 
        className="w-full" 
        size="lg"
        onClick={() => setOpen(true)}
        disabled={!isEnoughPairs}
      >
        Generar Zonas y Comenzar Torneo
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Se mostrará una vista previa de las zonas antes de confirmar
      </p>

      <ZonePreviewDialog
        tournamentId={tournamentId}
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
