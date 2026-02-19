'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlayoffMatch } from '@/lib/types'
import { PlayoffMatchCard } from './playoff-match-card'


interface PlayoffBracketProps {
  tournamentId: string
  isEditable?: boolean
}

const ROUND_LABELS: Record<string, string> = {
  'R32': 'Round of 32',
  'R16': 'Round of 16',
  'QF': 'Cuartos de Final',
  'SF': 'Semifinales',
  'F': 'Final',
}

export function PlayoffBracket({ tournamentId, isEditable = true }: PlayoffBracketProps) {
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
        .returns<PlayoffMatch[]>()

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
      <div className="flex gap-2 mb-6 overflow-x-auto border-b-2 border-border">
        {availableRounds.map(round => (
          <button
            key={round}
            onClick={() => setSelectedRound(round)}
            className={`px-4 py-2 text-sm  whitespace-nowrap transition-colors uppercase tracking-wider font-semibold  ${
              selectedRound === round
                ? 'text-primary font-bold border-b-3 border-primary'
                : 'hover:bg-muted/80'
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
          {roundMatches.map(match => (
            <PlayoffMatchCard 
              key={match.id} 
              match={match} 
              onMatchUpdate={loadPlayoffMatches} 
              isEditable={isEditable}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
