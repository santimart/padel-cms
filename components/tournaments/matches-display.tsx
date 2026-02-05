'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Pair, Player } from '@/lib/types'

interface Zone {
  id: string
  name: string
}

interface Match {
  id: string
  tournament_id: string
  phase: string
  zone_id: string | null
  pair1_id: string
  pair2_id: string
  match_number: number | null
  pair1_sets: number
  pair2_sets: number
  winner_id: string | null
  status: string
  scheduled_time: string | null
  completed_at: string | null
  created_at: string
}

type PairWithPlayers = Pair & {
  player1: Player
  player2: Player
}

type MatchWithPairs = Match & {
  pair1: PairWithPlayers
  pair2: PairWithPlayers
  zone?: Zone
}

interface MatchesDisplayProps {
  tournamentId: string
}

export function MatchesDisplay({ tournamentId }: MatchesDisplayProps) {
  const [matches, setMatches] = useState<MatchWithPairs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMatches()
  }, [tournamentId])

  const loadMatches = async () => {
    try {
      const supabase = createClient()

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          pair1:pairs!matches_pair1_id_fkey (
            *,
            player1:players!pairs_player1_id_fkey (*),
            player2:players!pairs_player2_id_fkey (*)
          ),
          pair2:pairs!matches_pair2_id_fkey (
            *,
            player1:players!pairs_player1_id_fkey (*),
            player2:players!pairs_player2_id_fkey (*)
          ),
          zone:zones (
            id,
            name
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('zone_id', { ascending: true })
        .order('match_number', { ascending: true })

      if (matchesError) throw matchesError

      setMatches((matchesData || []) as MatchWithPairs[])
    } catch (err: any) {
      console.error('Error loading matches:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando partidos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Partidos</CardTitle>
          <CardDescription>Calendario y resultados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay partidos programados aún
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group matches by zone
  const matchesByZone: { [zoneName: string]: MatchWithPairs[] } = {}
  matches.forEach(match => {
    const zoneName = match.zone?.name || 'Sin zona'
    if (!matchesByZone[zoneName]) {
      matchesByZone[zoneName] = []
    }
    matchesByZone[zoneName].push(match)
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      scheduled: { label: 'Programado', variant: 'outline' },
      in_progress: { label: 'En juego', variant: 'default' },
      completed: { label: 'Finalizado', variant: 'secondary' },
      walkover: { label: 'W.O.', variant: 'outline' },
    }
    const config = variants[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {Object.entries(matchesByZone).map(([zoneName, zoneMatches]) => (
        <Card key={zoneName}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Zona {zoneName}</CardTitle>
              <Badge variant="secondary">{zoneMatches.length} partidos</Badge>
            </div>
            <CardDescription>Partidos de la fase de zonas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zoneMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {match.pair1.player1.first_name} {match.pair1.player1.last_name} / {match.pair1.player2.first_name} {match.pair1.player2.last_name}
                        </div>
                        <div className="font-medium text-sm mt-1">
                          {match.pair2.player1.first_name} {match.pair2.player1.last_name} / {match.pair2.player2.first_name} {match.pair2.player2.last_name}
                        </div>
                      </div>
                      <div className="text-center min-w-[60px]">
                        {match.status === 'completed' ? (
                          <div className="text-lg font-bold">
                            {match.pair1_sets} - {match.pair2_sets}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">vs</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(match.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
