'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRightLeft, AlertCircle } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatName } from '@/lib/utils'

interface BracketMatch {
  round: string
  bracketPosition: number
  pair1Id: string | null
  pair2Id: string | null
  pair1Zone?: string
  pair2Zone?: string
}

interface QualifiedPair {
  pairId: string
  zoneId: string
  zoneName: string
  position: number
}

interface PlayoffPreviewDialogProps {
  tournamentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PlayoffPreviewDialog({
  tournamentId,
  open,
  onOpenChange,
  onSuccess
}: PlayoffPreviewDialogProps) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [proposal, setProposal] = useState<BracketMatch[]>([])
  const [qualifiedPairs, setQualifiedPairs] = useState<QualifiedPair[]>([])
  const [firstRoundMatches, setFirstRoundMatches] = useState<BracketMatch[]>([])
  const [pairsMap, setPairsMap] = useState<Map<string, { p1: string, p2: string }>>(new Map())

  useEffect(() => {
    if (open) {
      fetchProposal()
    }
  }, [open, tournamentId])

  const fetchProposal = async () => {
    setLoading(true)
    try {
      // Fetch pairs to get names
      const supabase = createClient()
      const { data: pairsData } = await supabase
        .from('pairs')
        .select(`
          id,
          player1:players!pairs_player1_id_fkey(first_name, last_name),
          player2:players!pairs_player2_id_fkey(first_name, last_name)
        `)
        .eq('tournament_id', tournamentId)
      
      const pMap = new Map()
      pairsData?.forEach((p: any) => {
        pMap.set(p.id, {
          p1: `${formatName(p.player1.first_name)} ${formatName(p.player1.last_name)}`,
          p2: `${formatName(p.player2.first_name)} ${formatName(p.player2.last_name)}`
        })
      })
      setPairsMap(pMap)

      // Fetch proposal
      const response = await fetch(`/api/tournaments/${tournamentId}/generate-playoffs`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setProposal(data.proposal)
      setQualifiedPairs(data.qualifiedPairs)
      
      // Filter for first round to display
      if (data.proposal.length > 0) {
        const firstRound = data.proposal[0].round
        setFirstRoundMatches(data.proposal.filter((m: BracketMatch) => m.round === firstRound))
      }

    } catch (error: any) {
      toast.error('Error loading preview', { description: error.message })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceId = result.source.droppableId
    const destId = result.destination.droppableId
    
    // Format: match-{index}-{pair1|pair2}
    const [sourceMatchIdx, sourceSlot] = sourceId.split('-').slice(1)
    const [destMatchIdx, destSlot] = destId.split('-').slice(1)

    const newMatches = [...firstRoundMatches]
    const sourceMatch = newMatches[parseInt(sourceMatchIdx)]
    const destMatch = newMatches[parseInt(destMatchIdx)]

    // Get pair IDs and Zones
    const getPairInfo = (match: BracketMatch, slot: string) => ({
      id: slot === 'pair1' ? match.pair1Id : match.pair2Id,
      zone: slot === 'pair1' ? match.pair1Zone : match.pair2Zone
    })

    const sourceInfo = getPairInfo(sourceMatch, sourceSlot)
    const destInfo = getPairInfo(destMatch, destSlot)

    // Swap logic
    if (sourceSlot === 'pair1') {
      sourceMatch.pair1Id = destInfo.id
      sourceMatch.pair1Zone = destInfo.zone
    } else {
      sourceMatch.pair2Id = destInfo.id
      sourceMatch.pair2Zone = destInfo.zone
    }

    if (destSlot === 'pair1') {
      destMatch.pair1Id = sourceInfo.id
      destMatch.pair1Zone = sourceInfo.zone
    } else {
      destMatch.pair2Id = sourceInfo.id
      destMatch.pair2Zone = sourceInfo.zone
    }

    setFirstRoundMatches(newMatches)
  }

  const handleConfirm = async () => {
    setGenerating(true)
    try {
      // Reconstruct full proposal with modified first round
      const fullBracket = proposal.map(m => {
        const modified = firstRoundMatches.find(
          fm => fm.round === m.round && fm.bracketPosition === m.bracketPosition
        )
        return modified || m
      })

      const response = await fetch(`/api/tournaments/${tournamentId}/generate-playoffs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bracket: fullBracket })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      toast.success('Playoffs generated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Failed to generate', { description: error.message })
    } finally {
      setGenerating(false)
    }
  }

  const getPairName = (pairId: string | null) => {
    if (!pairId) return 'BYE'
    const pair = pairsMap.get(pairId)
    if (!pair) return '...'
    return (
      <div className="text-sm">
        <div className="font-medium truncate">{pair.p1}</div>
        <div className="font-medium truncate">{pair.p2}</div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vista previa de Playoffs</DialogTitle>
          <DialogDescription>
            Revisa y ajusta los cruces arrastrando las parejas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
             <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Modo de edición</AlertTitle>
              <AlertDescription>
                Arrastra una pareja sobre otra para intercambiar sus posiciones en el cuadro.
              </AlertDescription>
            </Alert>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {firstRoundMatches.map((match, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-card">
                    <div className="text-xs text-muted-foreground mb-2 text-center">
                      Partido {match.bracketPosition}
                    </div>
                    
                    <div className="space-y-2">
                      {/* Slot 1 */}
                      <Droppable droppableId={`match-${idx}-pair1`}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-2 rounded border ${snapshot.isDraggingOver ? 'bg-accent border-primary' : 'bg-background'}`}
                          >
                            <Draggable draggableId={`draggable-${idx}-pair1`} index={0}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between"
                                >
                                  {getPairName(match.pair1Id)}
                                  <Badge variant="outline" className="ml-2 shrink-0">
                                    {match.pair1Zone}
                                  </Badge>
                                </div>
                              )}
                            </Draggable>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      <div className="flex justify-center">
                        <span className="text-xs text-muted-foreground">vs</span>
                      </div>

                      {/* Slot 2 */}
                      <Droppable droppableId={`match-${idx}-pair2`}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-2 rounded border ${snapshot.isDraggingOver ? 'bg-accent border-primary' : 'bg-background'}`}
                          >
                            <Draggable draggableId={`draggable-${idx}-pair2`} index={0}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between"
                                >
                                  {getPairName(match.pair2Id)}
                                  <Badge variant="outline" className="ml-2 shrink-0">
                                    {match.pair2Zone}
                                  </Badge>
                                </div>
                              )}
                            </Draggable>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={generating || loading}>
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar y Generar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
