import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MatchDetailed, PairDetailed } from '@/lib/types'

interface UseRealtimeTournamentProps {
  tournamentId: string
}

export function useRealtimeTournament({ tournamentId }: UseRealtimeTournamentProps) {
  const [matches, setMatches] = useState<MatchDetailed[]>([])
  const [pairs, setPairs] = useState<PairDetailed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      try {
        setLoading(true)
        // Load pairs (needed for names)
        const { data: pairsData, error: pairsError } = await supabase
          .from('pairs')
          .select(`
            *,
            player1:players!pairs_player1_id_fkey(*),
            player2:players!pairs_player2_id_fkey(*),
            zone:zones(*)
          `)
          .eq('tournament_id', tournamentId)

        if (pairsError) throw pairsError

        // Load matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            *,
            zone:zones(*),
            pair1:pairs!matches_pair1_id_fkey(
              *,
              player1:players!pairs_player1_id_fkey(*),
              player2:players!pairs_player2_id_fkey(*),
              zone:zones(*)
            ),
            pair2:pairs!matches_pair2_id_fkey(
              *,
              player1:players!pairs_player1_id_fkey(*),
              player2:players!pairs_player2_id_fkey(*),
              zone:zones(*)
            )
          `)
          .eq('tournament_id', tournamentId)
          .order('scheduled_time', { ascending: true })

        if (matchesError) throw matchesError

        if (isMounted) {
          // Cast the data to ensure it fits our detailed types, Supabase types might be inferred loosely
          setPairs(pairsData as unknown as PairDetailed[] || [])
          setMatches(matchesData as unknown as MatchDetailed[] || [])
        }
      } catch (err: any) {
        console.error('Error loading tournament data:', err)
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadInitialData()

    // Realtime subscription
    const channel = supabase
      .channel(`tournament-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          // On any match change, reload data to ensure consistency implies reloading pairs too if scores affect standings?
          // For now, reloading matches is critical. Pairs might not change often.
          // Optimization: could just update the specific match in state, but reloading is safer for now.
          loadInitialData()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [tournamentId, supabase])

  return { matches, pairs, loading, error }
}
