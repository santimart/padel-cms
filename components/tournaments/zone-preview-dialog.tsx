'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatName } from '@/lib/utils'

interface Pair {
  id: string
  player1: { first_name: string; last_name: string; current_category: string | null }
  player2: { first_name: string; last_name: string; current_category: string | null }
  seed?: number | null
}

interface ZonePreviewDialogProps {
  tournamentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ZonePreviewDialog({
  tournamentId,
  open,
  onOpenChange,
  onSuccess
}: ZonePreviewDialogProps) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [proposal, setProposal] = useState<Record<number, Pair[]>>({})
  const [numZones, setNumZones] = useState(0)

  useEffect(() => {
    if (open) {
      fetchProposal()
    }
  }, [open, tournamentId])

  const fetchProposal = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/generate-zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'preview' })
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setProposal(data.proposal)
      setNumZones(data.numZones)
    } catch (error: any) {
      toast.error('Error al cargar la previsualización', { description: error.message })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceZoneIdxStr = result.source.droppableId.split('-')[1]
    const destZoneIdxStr = result.destination.droppableId.split('-')[1]
    
    const sourceZoneIdx = parseInt(sourceZoneIdxStr)
    const destZoneIdx = parseInt(destZoneIdxStr)

    // Clone the proposal
    const newProposal = { ...proposal }
    
    // Copy arrays
    const sourcePairs = [...(newProposal[sourceZoneIdx] || [])]
    const destPairs = sourceZoneIdx === destZoneIdx ? sourcePairs : [...(newProposal[destZoneIdx] || [])]

    // Remove from source
    const [movedPair] = sourcePairs.splice(result.source.index, 1)

    // Add to dest
    destPairs.splice(result.destination.index, 0, movedPair)

    newProposal[sourceZoneIdx] = sourcePairs
    if (sourceZoneIdx !== destZoneIdx) {
      newProposal[destZoneIdx] = destPairs
    }

    setProposal(newProposal)
  }

  const handleConfirm = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/generate-zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'confirm', distribution: proposal })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success('Zonas generadas correctamente')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Error al generar zonas', { description: error.message })
    } finally {
      setGenerating(false)
    }
  }

  const getZoneLetter = (index: number) => {
    return String.fromCharCode(65 + index) // 0 -> A, 1 -> B
  }

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0 mb-2">
          <DialogTitle>Vista Previa de Zonas</DialogTitle>
          <DialogDescription>
            Revisa y ajusta la distribución de las parejas arrastrándolas entre las diferentes zonas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12 flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 pb-2 space-y-6">
             <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Modo de Edición Manual</AlertTitle>
              <AlertDescription>
                Arrastra una pareja hacia otra zona para cambiarla de grupo. Al confirmar, se cerrarán las inscripciones y se generarán los partidos.
              </AlertDescription>
            </Alert>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {Array.from({ length: numZones }).map((_, idx) => (
                  <div key={`zone-${idx}`} className="border rounded-xl bg-card overflow-hidden flex flex-col h-full">
                    <div className="bg-muted p-3 border-b text-center font-semibold text-sm">
                      ZONA {getZoneLetter(idx)}
                      <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs font-normal">
                        {proposal[idx]?.length || 0} parejas
                      </Badge>
                    </div>
                    
                    <Droppable droppableId={`zone-${idx}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-3 flex flex-col gap-2 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-background'}`}
                        >
                          {(proposal[idx] || []).map((pair, pIdx) => (
                            <Draggable key={pair.id} draggableId={pair.id} index={pIdx}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 rounded-lg border shadow-sm text-sm bg-card hover:border-primary/50 transition-colors ${
                                    snapshot.isDragging ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-border'
                                  }`}
                                >
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium truncate">
                                        {formatName(pair.player1.first_name)} {formatName(pair.player1.last_name)}
                                      </span>
                                      {pair.seed && <Badge variant="outline" className="text-[10px] h-4">S{pair.seed}</Badge>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium truncate">
                                        {formatName(pair.player2.first_name)} {formatName(pair.player2.last_name)}
                                      </span>
                                    </div>
                                    {(pair.player1.current_category || pair.player2.current_category) && (
                                       <div className="text-xs text-muted-foreground mt-1">
                                        Cat: {pair.player1.current_category}/{pair.player2.current_category}
                                       </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        <DialogFooter className="shrink-0 pt-4 border-t mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={generating || loading || numZones === 0}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando y Generando...
              </>
            ) : (
              'Confirmar Zonas y Empezar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
