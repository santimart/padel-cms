'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatName } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner or similar toast is available, if not will use alert or create simple toast
import { PairWithPlayers } from '@/lib/types'

interface RegistrationsDisplayProps {
  tournamentId: string
  registrationPrice: number
}

interface PlayerRegistration {
  id: string
  name: string
  pairId: string
  partnerName: string
  isPaid: boolean
  isPlayer1: boolean // To know which column to update in pairs table
}

export function RegistrationsDisplay({ tournamentId, registrationPrice }: RegistrationsDisplayProps) {
  const [registrations, setRegistrations] = useState<PlayerRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    player: PlayerRegistration | null
  }>({ isOpen: false, player: null })

  const loadRegistrations = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data: pairs, error } = await supabase
        .from('pairs')
        .select(`
          *,
          player1:players!pairs_player1_id_fkey (*),
          player2:players!pairs_player2_id_fkey (*)
        `)
        .eq('tournament_id', tournamentId)

      if (error) throw error

      if (pairs) {
        const flatRegistrations: PlayerRegistration[] = []
        pairs.forEach((pair: any) => {
          // Player 1
          flatRegistrations.push({
            id: pair.player1.id,
            name: `${formatName(pair.player1.first_name)} ${formatName(pair.player1.last_name)}`,
            pairId: pair.id,
            partnerName: `${formatName(pair.player2.first_name)} ${formatName(pair.player2.last_name)}`,
            isPaid: pair.player1_paid,
            isPlayer1: true
          })
          // Player 2
          flatRegistrations.push({
            id: pair.player2.id,
            name: `${formatName(pair.player2.first_name)} ${formatName(pair.player2.last_name)}`,
            pairId: pair.id,
            partnerName: `${formatName(pair.player1.first_name)} ${formatName(pair.player1.last_name)}`,
            isPaid: pair.player2_paid,
            isPlayer1: false
          })
        })
        setRegistrations(flatRegistrations)
      }
    } catch (err) {
      console.error('Error loading registrations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRegistrations()
  }, [tournamentId])

  const handleTogglePayment = (player: PlayerRegistration) => {
    if (!player.isPaid) {
      // Open confirmation dialog for marking as paid
      setConfirmDialog({ isOpen: true, player })
    } else {
      // Toggle back to unpaid directly (or maybe also confirm? let's do direct for now as un-paying is less risky financially usually for simple app)
      // Actually user asked: "al momento de marcar uno como que pago la inscripcion, deberia pedir confirmacion"
      updatePaymentStatus(player, false)
    }
  }

  const confirmPayment = () => {
    if (confirmDialog.player) {
      updatePaymentStatus(confirmDialog.player, true)
      setConfirmDialog({ isOpen: false, player: null })
    }
  }

  const updatePaymentStatus = async (player: PlayerRegistration, newStatus: boolean) => {
    try {
      const supabase = createClient()
      const fieldToUpdate = player.isPlayer1 ? 'player1_paid' : 'player2_paid'
      
      const { error } = await supabase
        .from('pairs')
        .update({ [fieldToUpdate]: newStatus })
        .eq('id', player.pairId)

      if (error) throw error

      // Update local state
      setRegistrations(prev => prev.map(p => {
        if (p.pairId === player.pairId && p.isPlayer1 === player.isPlayer1) {
          return { ...p, isPaid: newStatus }
        }
        return p
      }))

    } catch (err) {
      console.error('Error updating payment status:', err)
      alert('Error al actualizar el estado de pago')
    }
  }

  // Statistics
  const totalPlayers = registrations.length
  const paidPlayers = registrations.filter(r => r.isPaid).length
  const percentagePaid = totalPlayers > 0 ? Math.round((paidPlayers / totalPlayers) * 100) : 0
  const totalCollected = paidPlayers * registrationPrice
  const totalEstimated = totalPlayers * registrationPrice

  // Simple Circular Progress Component
  const CircularProgress = ({ value, size = 120, strokeWidth = 10 }: { value: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    return (
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted/20"
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-primary transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold">{value}%</span>
          <span className="text-xs text-muted-foreground">Pagado</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Cargando inscripciones...</div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progreso de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
             <CircularProgress value={percentagePaid} />
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <div className="text-2xl font-bold text-green-600">
                  ${totalCollected.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Recaudado</p>
             </div>
             <div>
                <div className="text-lg font-semibold text-muted-foreground">
                  ${totalEstimated.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total Estimado</p>
             </div>
          </CardContent>
        </Card>

         <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado de Jugadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between items-center">
               <span>Total Jugadores:</span>
               <span className="font-bold">{totalPlayers}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="flex items-center gap-2">
                 <CheckCircle2 className="h-4 w-4 text-green-500" /> Pagaron:
               </span>
               <span className="font-bold text-green-600">{paidPlayers}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="flex items-center gap-2">
                 <XCircle className="h-4 w-4 text-red-400" /> Pendientes:
               </span>
               <span className="font-bold text-red-500">{totalPlayers - paidPlayers}</span>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Jugadores</CardTitle>
          <CardDescription>
            Gestiona el estado de pago de cada jugador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead>Pareja</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((player) => (
                <TableRow key={`${player.pairId}-${player.isPlayer1 ? 'p1' : 'p2'}`}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-muted-foreground">{player.partnerName}</TableCell>
                  <TableCell>
                    {player.isPaid ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                        Pagado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={player.isPaid ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleTogglePayment(player)}
                      className={player.isPaid ? "text-muted-foreground" : "bg-green-600 hover:bg-green-700"}
                    >
                      {player.isPaid ? 'Deshacer' : 'Marcar Pagado'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, player: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pago</DialogTitle>
            <DialogDescription>
              ¿Confirmas que <strong>{confirmDialog.player?.name}</strong> ha pagado la inscripción de <strong>${registrationPrice.toLocaleString()}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, player: null })}>
              Cancelar
            </Button>
            <Button onClick={confirmPayment} className="bg-green-600 hover:bg-green-700">
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
