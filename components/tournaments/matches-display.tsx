'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EditMatchTime } from '@/components/tournaments/edit-match-time'
import { MatchScorer } from '@/components/tournaments/match-scorer'
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
  pair1_games: any // JSONB field
  pair2_games: any // JSONB field
  winner_id: string | null
  status: string
  scheduled_time: string | null
  court_number: number | null
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

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString)
    const dayName = date.toLocaleDateString('es-AR', { weekday: 'short' })
    const dayNum = date.getDate()
    const month = date.toLocaleDateString('es-AR', { month: 'short' })
    const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    
    return `${dayName} ${dayNum} ${month} - ${time}hs`
  }

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
                    {/* Scheduled time */}
                    {match.scheduled_time && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs text-muted-foreground">
                          📅 {formatMatchTime(match.scheduled_time)}
                          {match.court_number && ` • Cancha ${match.court_number}`}
                        </div>
                        <EditMatchTime
                          matchId={match.id}
                          currentTime={match.scheduled_time}
                          currentCourt={match.court_number}
                          onSuccess={loadMatches}
                        />
                      </div>
                    )}
                    
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
                          <div>
                            <div className="text-lg font-bold">
                              {match.pair1_sets} - {match.pair2_sets}
                            </div>
                            {/* Detailed set scores */}
                            {match.pair1_games && match.pair2_games && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {(() => {
                                  try {
                                    const pair1Games = typeof match.pair1_games === 'string' 
                                      ? JSON.parse(match.pair1_games) 
                                      : match.pair1_games
                                    const pair2Games = typeof match.pair2_games === 'string'
                                      ? JSON.parse(match.pair2_games)
                                      : match.pair2_games
                                    
                                    if (Array.isArray(pair1Games) && Array.isArray(pair2Games)) {
                                      return `(${pair1Games.map((p1Score: number, idx: number) => 
                                        `${p1Score}-${pair2Games[idx]}`
                                      ).join(', ')})`
                                    }
                                  } catch (e) {
                                    return null
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">vs</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <MatchScorer
                      matchId={match.id}
                      pair1Name={`${match.pair1.player1.first_name} ${match.pair1.player1.last_name} / ${match.pair1.player2.first_name} ${match.pair1.player2.last_name}`}
                      pair2Name={`${match.pair2.player1.first_name} ${match.pair2.player1.last_name} / ${match.pair2.player2.first_name} ${match.pair2.player2.last_name}`}
                      pair1Id={match.pair1_id}
                      pair2Id={match.pair2_id}
                      currentStatus={match.status}
                      onSuccess={loadMatches}
                    />
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
