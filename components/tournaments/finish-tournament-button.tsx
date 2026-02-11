'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { finishTournament } from '@/lib/actions/tournaments'
import { toast } from 'sonner'

export function FinishTournamentButton({ tournamentId, hasRanking, allMatchesCompleted }: { 
  tournamentId: string, 
  hasRanking: boolean,
  allMatchesCompleted: boolean 
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFinish = async () => {
    setLoading(true)
    try {
      await finishTournament(tournamentId)
      toast.success('Torneo finalizado correctamente')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al finalizar el torneo')
    } finally {
      setLoading(false)
    }
  }

  if (!allMatchesCompleted) {
    return (
      <div className="flex flex-col gap-1">
        <Button variant="destructive" disabled>
          Finalizar Torneo
        </Button>
        <p className="text-xs text-muted-foreground">
          Todos los partidos de playoffs deben estar completados.
        </p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          Finalizar Torneo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás seguro de finalizar el torneo?</DialogTitle>
          <DialogDescription>
            Esta acción marcará el torneo como finalizado.
            {hasRanking 
              ? ' Se calcularán los puntos y se actualizará el ranking de los jugadores automáticamente.' 
              : ' Este torneo no tiene un ranking asociado, pero se guardará en el historial.'}
            <br /><br />
            Esta acción no se puede deshacer fácilmente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleFinish} disabled={loading} variant="destructive">
            {loading ? 'Finalizando...' : 'Sí, Finalizar Torneo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
