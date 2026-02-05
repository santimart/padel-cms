'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Clock } from 'lucide-react'

interface EditMatchTimeProps {
  matchId: string
  currentTime: string | null
  currentCourt?: number | null
  onSuccess?: () => void
}

export function EditMatchTime({ matchId, currentTime, currentCourt, onSuccess }: EditMatchTimeProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Parse current time or use defaults
  const currentDate = currentTime ? new Date(currentTime) : new Date()
  const [formData, setFormData] = useState({
    date: currentTime 
      ? currentDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    time: currentTime
      ? currentDate.toTimeString().slice(0, 5)
      : '09:00',
    courtNumber: currentCourt?.toString() || '1',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      // Combine date and time
      const scheduledTime = new Date(`${formData.date}T${formData.time}:00`)
      
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          scheduled_time: scheduledTime.toISOString(),
          court_number: parseInt(formData.courtNumber) || null
        })
        .eq('id', matchId)

      if (updateError) throw updateError

      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Error updating match time:', err)
      setError(err.message || 'Error al actualizar el horario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Horario del Partido</DialogTitle>
          <DialogDescription>
            Modifica la fecha, hora y cancha programada para este partido
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courtNumber">Cancha</Label>
              <Input
                id="courtNumber"
                type="number"
                min="1"
                max="10"
                value={formData.courtNumber}
                onChange={(e) => setFormData({ ...formData, courtNumber: e.target.value })}
                disabled={loading}
                placeholder="Número de cancha"
              />
              <p className="text-xs text-muted-foreground">
                Número de cancha asignada (1-10)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
