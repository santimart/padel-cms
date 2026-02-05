'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trophy, Loader2 } from 'lucide-react'

interface GeneratePlayoffsButtonProps {
  tournamentId: string
  onSuccess: () => void
}

export function GeneratePlayoffsButton({ tournamentId, onSuccess }: GeneratePlayoffsButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const response = await fetch(`/api/tournaments/${tournamentId}/generate-playoffs`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate playoffs')
      }

      setOpen(false)
      onSuccess()
    } catch (err: any) {
      console.error('Error generating playoffs:', err)
      setError(err.message || 'Error al generar playoffs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Trophy className="h-5 w-5" />
          Generar Playoffs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generar Fase de Playoffs</DialogTitle>
          <DialogDescription>
            Se generará el bracket de playoffs con los mejores 2 equipos de cada zona.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Clasificación:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Top 2 parejas de cada zona</li>
              <li>Ordenadas por: victorias, diferencia de sets, diferencia de games</li>
              <li>Formato de eliminación simple</li>
            </ul>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              ⚠️ <strong>Importante:</strong> Asegúrate de que todos los partidos de zona estén completados antes de generar los playoffs.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Generando...' : 'Generar Playoffs'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
