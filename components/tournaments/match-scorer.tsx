'use client'

import { useState, useRef, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Trophy } from 'lucide-react'

interface MatchScorerProps {
  matchId: string
  pair1Name: string
  pair2Name: string
  pair1Id: string
  pair2Id: string
  currentStatus: string
  phase?: string
  round?: string
  onSuccess?: () => void
}

export function MatchScorer({
  matchId,
  pair1Name,
  pair2Name,
  pair1Id,
  pair2Id,
  currentStatus,
  phase,
  round,
  onSuccess,
}: MatchScorerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isWalkover, setIsWalkover] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)
  
  const [scores, setScores] = useState({
    set1: { pair1: '', pair2: '' },
    set2: { pair1: '', pair2: '' },
    set3: { pair1: '', pair2: '' },
  })

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (open && !isWalkover) {
      // Use a longer timeout to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        firstInputRef.current?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [open, isWalkover])

  const handleScoreChange = (set: 'set1' | 'set2' | 'set3', pair: 'pair1' | 'pair2', value: string) => {
    // Prevent leading zeros (e.g., "01" is invalid)
    if (value.length > 1 && value.startsWith('0')) {
      return
    }
    
    // Limit to 2 digits max
    if (value.length > 2) {
      return
    }
    
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) {
      return
    }
    
    setScores(prev => ({
      ...prev,
      [set]: {
        ...prev[set],
        [pair]: value,
      },
    }))
  }

  const validateScore = (): { valid: boolean; error?: string } => {
    if (isWalkover) return { valid: true }

    const sets = [scores.set1, scores.set2, scores.set3]
    let pair1Sets = 0
    let pair2Sets = 0

    // At least 2 sets must be played
    if (!scores.set1.pair1 || !scores.set1.pair2 || !scores.set2.pair1 || !scores.set2.pair2) {
      return { valid: false, error: 'Debes completar al menos los primeros 2 sets' }
    }

    // Validate each set
    for (let i = 0; i < 2; i++) {
      const set = sets[i]
      const p1 = parseInt(set.pair1)
      const p2 = parseInt(set.pair2)

      if (isNaN(p1) || isNaN(p2)) {
        return { valid: false, error: `Set ${i + 1}: Ingresa números válidos` }
      }

      // Basic padel rules: 6-0 to 7-6
      if (p1 < 0 || p2 < 0 || p1 > 7 || p2 > 7) {
        return { valid: false, error: `Set ${i + 1}: Puntaje inválido (0-7)` }
      }

      // Determine winner
      if (p1 > p2) pair1Sets++
      else if (p2 > p1) pair2Sets++
    }

    // Check if match is decided (2 sets won)
    if (pair1Sets === 2 || pair2Sets === 2) {
      // Match is over, set 3 should be empty
      if (scores.set3.pair1 || scores.set3.pair2) {
        return { valid: false, error: 'El partido ya terminó en 2 sets' }
      }
      return { valid: true }
    }

    // If 1-1, need set 3
    if (pair1Sets === 1 && pair2Sets === 1) {
      if (!scores.set3.pair1 || !scores.set3.pair2) {
        return { valid: false, error: 'Debes completar el tercer set' }
      }
    }

    return { valid: true }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const validation = validateScore()
      if (!validation.valid) {
        setError(validation.error || 'Puntaje inválido')
        setLoading(false)
        return
      }

      const supabase = createClient()

      let winnerId: string
      let pair1SetsWon = 0
      let pair2SetsWon = 0
      const pair1Games: number[] = []
      const pair2Games: number[] = []

      if (isWalkover) {
        // For W.O., ask which pair won
        winnerId = pair1Id // Default, should be selected by user
        pair1SetsWon = 2
        pair2SetsWon = 0
        pair1Games.push(6, 6)
        pair2Games.push(0, 0)
      } else {
        // Calculate from scores
        const sets = [scores.set1, scores.set2, scores.set3]
        
        sets.forEach(set => {
          if (!set.pair1 || !set.pair2) return
          
          const p1 = parseInt(set.pair1)
          const p2 = parseInt(set.pair2)
          
          pair1Games.push(p1)
          pair2Games.push(p2)
          
          if (p1 > p2) pair1SetsWon++
          else if (p2 > p1) pair2SetsWon++
        })

        winnerId = pair1SetsWon > pair2SetsWon ? pair1Id : pair2Id
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update({
          pair1_sets: pair1SetsWon,
          pair2_sets: pair2SetsWon,
          pair1_games: pair1Games,
          pair2_games: pair2Games,
          winner_id: winnerId,
          status: isWalkover ? 'walkover' : 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', matchId)

      if (updateError) throw updateError

      // If this is a playoff match, advance the winner to the next round
      if (phase === 'playoffs' && round) {
        try {
          const response = await fetch(`/api/matches/${matchId}/advance-winner`, {
            method: 'POST',
          })
          
          if (!response.ok) {
            console.error('Failed to advance winner to next round')
          }
        } catch (advanceError) {
          console.error('Error advancing winner:', advanceError)
          // Don't fail the whole operation if advancement fails
        }
      }

      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Error updating match score:', err)
      setError(err.message || 'Error al guardar el resultado')
    } finally {
      setLoading(false)
    }
  }

  const isCompleted = currentStatus === 'completed' || currentStatus === 'walkover'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isCompleted ? "outline" : "default"} size="sm">
          <Trophy className="h-4 w-4 mr-2" />
          {isCompleted ? 'Editar Resultado' : 'Cargar Resultado'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cargar Resultado del Partido</DialogTitle>
          <DialogDescription>
            {pair1Name} vs {pair2Name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* W.O. Option */}
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="walkover"
              checked={isWalkover}
              onCheckedChange={(checked) => setIsWalkover(checked as boolean)}
            />
            <label
              htmlFor="walkover"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Marcar como W.O. (Walkover)
            </label>
          </div>

          {!isWalkover && (
            <div className="space-y-4 py-4">
              {/* Set 1 */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Set 1</Label>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <Input
                    ref={firstInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={scores.set1.pair1}
                    onChange={(e) => handleScoreChange('set1', 'pair1', e.target.value)}
                    disabled={loading}
                    className="text-center"
                    maxLength={2}
                  />
                  <span className="text-center text-sm text-muted-foreground">-</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={scores.set1.pair2}
                    onChange={(e) => handleScoreChange('set1', 'pair2', e.target.value)}
                    disabled={loading}
                    className="text-center"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Set 2 */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Set 2</Label>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={scores.set2.pair1}
                    onChange={(e) => handleScoreChange('set2', 'pair1', e.target.value)}
                    disabled={loading}
                    className="text-center"
                    maxLength={2}
                  />
                  <span className="text-center text-sm text-muted-foreground">-</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={scores.set2.pair2}
                    onChange={(e) => handleScoreChange('set2', 'pair2', e.target.value)}
                    disabled={loading}
                    className="text-center"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Set 3 */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Set 3 (opcional)</Label>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={scores.set3.pair1}
                    onChange={(e) => handleScoreChange('set3', 'pair1', e.target.value)}
                    disabled={loading}
                    className="text-center"
                    maxLength={2}
                  />
                  <span className="text-center text-sm text-muted-foreground">-</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={scores.set3.pair2}
                    onChange={(e) => handleScoreChange('set3', 'pair2', e.target.value)}
                    disabled={loading}
                    className="text-center"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          )}

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
              {loading ? 'Guardando...' : 'Guardar Resultado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
