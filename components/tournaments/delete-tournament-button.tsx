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
import { deleteTournament } from '@/lib/actions/tournaments'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export function DeleteTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteTournament(tournamentId)
      toast.success('Torneo eliminado correctamente')
      setOpen(false)
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el torneo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Eliminar Torneo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás seguro de eliminar el torneo?</DialogTitle>
          <DialogDescription>
            Esta acción eliminará el torneo permanentemente, junto con cualquier pareja inscrita.
            <br /><br />
            No se puede deshacer esta acción una vez confirmada.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} disabled={loading} variant="destructive">
            {loading ? 'Eliminando...' : 'Sí, Eliminar Torneo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
