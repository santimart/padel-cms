'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { MatchScorer } from './match-scorer'
import { EditMatchTime } from './edit-match-time'

interface PlayoffMatch {
  id: string
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'F'
  bracket_position: number
  pair1_id: string | null
  pair2_id: string | null
  pair1_sets: number
  pair2_sets: number
  pair1_games: any
  pair2_games: any
  winner_id: string | null
  status: string
  scheduled_time: string | null
  court_number: number | null
  pair1?: {
    id: string
    zone_id: string
    player1: { first_name: string; last_name: string }
    player2: { first_name: string; last_name: string }
    zone: { name: string }
  }
  pair2?: {
    id: string
    zone_id: string
    player1: { first_name: string; last_name: string }
    player2: { first_name: string; last_name: string }
    zone: { name: string }
  }
}

interface PlayoffBracketProps {
  tournamentId: string
}

const ROUND_LABELS: Record<string, string> = {
  'R32': 'Round of 32',
  'R16': 'Round of 16',
  'QF': 'Cuartos de Final',
  'SF': 'Semifinales',
  'F': 'Final',
}

export function PlayoffBracket({ tournamentId }: PlayoffBracketProps) {
  const [matches, setMatches] = useState<PlayoffMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRound, setSelectedRound] = useState<string>('QF')
  const [availableRounds, setAvailableRounds] = useState<string[]>([])

  useEffect(() => {
    loadPlayoffMatches()
  }, [tournamentId])

  const loadPlayoffMatches = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          pair1:pairs!matches_pair1_id_fkey (
            id,
            zone_id,
            player1:players!pairs_player1_id_fkey (*),
            player2:players!pairs_player2_id_fkey (*),
            zone:zones (name)
          ),
          pair2:pairs!matches_pair2_id_fkey (
            id,
            zone_id,
            player1:players!pairs_player1_id_fkey (*),
            player2:players!pairs_player2_id_fkey (*),
            zone:zones (name)
          )
        `)
        .eq('tournament_id', tournamentId)
        .eq('phase', 'playoffs')
        .order('round')
        .order('bracket_position')

      if (error) throw error

      setMatches((data || []) as PlayoffMatch[])

      // Determine available rounds and sort them logically
      const roundOrder = ['R32', 'R16', 'QF', 'SF', 'F']
      const existingRounds = [...new Set((data || []).map(m => m.round))].filter(Boolean) as string[]
      
      const sortedRounds = existingRounds.sort((a, b) => {
        return roundOrder.indexOf(a) - roundOrder.indexOf(b)
      })
      
      setAvailableRounds(sortedRounds)
      
      // Set initial selected round (default to the earliest available round, e.g., QF)
      if (sortedRounds.length > 0 && !sortedRounds.includes(selectedRound)) {
        setSelectedRound(sortedRounds[0])
      }
    } catch (err) {
      console.error('Error loading playoff matches:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatMatchTime = (time: string | null) => {
    if (!time) return null
    const date = new Date(time)
    return date.toLocaleDateString('es-AR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderPairName = (pair: PlayoffMatch['pair1']) => {
    if (!pair) return <div className="text-sm text-muted-foreground">TBD</div>
    
    return (
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">
            {pair.player1.first_name} {pair.player1.last_name} / {pair.player2.first_name} {pair.player2.last_name}
          </div>
        </div>
        {pair.zone && (
          <Badge variant="outline" className="text-xs mt-1">
            {pair.zone.name}
          </Badge>
        )}
      </div>
    )
  }

  const renderMatch = (match: PlayoffMatch) => {
    const isCompleted = match.status === 'completed'
    const pair1Won = match.winner_id === match.pair1_id
    const pair2Won = match.winner_id === match.pair2_id

    return (
      <Card key={match.id} className="mb-3">
        <CardContent className="p-4">
          {/* Scheduled time */}
          {match.scheduled_time && (
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <span>📅 {formatMatchTime(match.scheduled_time)}</span>
              {match.court_number && <span>• Cancha {match.court_number}</span>}
              <EditMatchTime
                matchId={match.id}
                currentTime={match.scheduled_time}
                currentCourt={match.court_number}
                onSuccess={loadPlayoffMatches}
              />
            </div>
          )}

          {/* Pair 1 */}
          <div className={`flex items-center gap-3 p-2 rounded ${pair1Won ? 'bg-primary/5' : ''}`}>
            {renderPairName(match.pair1)}
            <div className="flex items-center gap-2">
              {isCompleted && (
                <span className="text-lg font-bold min-w-[20px] text-center">
                  {match.pair1_sets}
                </span>
              )}
              {pair1Won && <Check className="h-4 w-4 text-primary" />}
            </div>
          </div>

          {/* Pair 2 */}
          <div className={`flex items-center gap-3 p-2 rounded mt-1 ${pair2Won ? 'bg-primary/5' : ''}`}>
            {renderPairName(match.pair2)}
            <div className="flex items-center gap-2">
              {isCompleted && (
                <span className="text-lg font-bold min-w-[20px] text-center">
                  {match.pair2_sets}
                </span>
              )}
              {pair2Won && <Check className="h-4 w-4 text-primary" />}
            </div>
          </div>

          {/* Detailed scores */}
          {isCompleted && match.pair1_games && match.pair2_games && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {(() => {
                try {
                  const p1Games = typeof match.pair1_games === 'string' 
                    ? JSON.parse(match.pair1_games) 
                    : match.pair1_games
                  const p2Games = typeof match.pair2_games === 'string'
                    ? JSON.parse(match.pair2_games)
                    : match.pair2_games
                  
                  if (Array.isArray(p1Games) && Array.isArray(p2Games)) {
                    return `(${p1Games.map((p1: number, idx: number) => 
                      `${p1}-${p2Games[idx]}`
                    ).join(', ')})`
                  }
                } catch (e) {
                  return null
                }
              })()}
            </div>
          )}

          {/* Actions */}
          {!isCompleted && match.pair1 && match.pair2 && (
            <div className="mt-3 pt-3 border-t">
              <MatchScorer
                matchId={match.id}
                pair1Name={`${match.pair1.player1.first_name} ${match.pair1.player1.last_name} / ${match.pair1.player2.first_name} ${match.pair1.player2.last_name}`}
                pair2Name={`${match.pair2.player1.first_name} ${match.pair2.player1.last_name} / ${match.pair2.player2.first_name} ${match.pair2.player2.last_name}`}
                pair1Id={match.pair1.id}
                pair2Id={match.pair2.id}
                currentStatus={match.status}
                phase="playoffs"
                round={match.round}
                onSuccess={loadPlayoffMatches}
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando bracket...</div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">No hay playoffs generados aún</div>
      </div>
    )
  }

  const roundMatches = matches.filter(m => m.round === selectedRound)

  return (
    <div>
      {/* Round navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {availableRounds.map(round => (
          <button
            key={round}
            onClick={() => setSelectedRound(round)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedRound === round
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {ROUND_LABELS[round] || round}
          </button>
        ))}
      </div>

      {/* Matches for selected round */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{ROUND_LABELS[selectedRound]}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {roundMatches.map(match => renderMatch(match))}
        </div>
      </div>
    </div>
  )
}
