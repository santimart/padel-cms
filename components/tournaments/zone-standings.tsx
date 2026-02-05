'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { calculateZoneStandings, formatStandingsRecord, isQualified } from '@/lib/tournament/standings-calculator'
import type { Pair, Player } from '@/lib/types'

interface Match {
  id: string
  pair1_id: string
  pair2_id: string
  pair1_sets: number
  pair2_sets: number
  pair1_games: number[] | null
  pair2_games: number[] | null
  winner_id: string | null
  status: string
}

type PairWithPlayers = Pair & {
  player1: Player
  player2: Player
}

interface ZoneStandingsProps {
  tournamentId: string
  zoneId: string
  zoneName: string
}

export function ZoneStandings({ tournamentId, zoneId, zoneName }: ZoneStandingsProps) {
  const [standings, setStandings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStandings()
    
    // Subscribe to match updates for real-time standings
    const supabase = createClient()
    const channel = supabase
      .channel(`zone-${zoneId}-standings`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `zone_id=eq.${zoneId}`,
        },
        () => {
          loadStandings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tournamentId, zoneId])

  const loadStandings = async () => {
    try {
      const supabase = createClient()

      // Get pairs in this zone
      const { data: pairs, error: pairsError } = await supabase
        .from('pairs')
        .select(`
          *,
          player1:players!pairs_player1_id_fkey (*),
          player2:players!pairs_player2_id_fkey (*)
        `)
        .eq('zone_id', zoneId)

      if (pairsError) throw pairsError

      // Get matches in this zone
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('zone_id', zoneId)

      if (matchesError) throw matchesError

      // Calculate standings
      const calculated = calculateZoneStandings(
        pairs as PairWithPlayers[],
        matches as Match[]
      )

      setStandings(calculated)
    } catch (err: any) {
      console.error('Error loading standings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando tabla...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground py-4">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (standings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabla de Posiciones - Zona {zoneName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-4">
            No hay datos de posiciones aún
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tabla de Posiciones - Zona {zoneName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pos</TableHead>
              <TableHead>Pareja</TableHead>
              <TableHead className="text-center">PJ</TableHead>
              <TableHead className="text-center">Pts</TableHead>
              <TableHead className="text-center">G-P</TableHead>
              <TableHead className="text-center">Sets</TableHead>
              <TableHead className="text-center">Games</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((standing) => {
              const qualified = isQualified(standing.position, 1) // Assuming we'll get numZones from parent
              
              return (
                <TableRow key={standing.pairId} className={qualified ? 'bg-primary/5' : ''}>
                  <TableCell className="font-medium">
                    {standing.position}
                    {qualified && (
                      <Badge variant="default" className="ml-1 text-xs">Q</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {standing.pair.player1.first_name} {standing.pair.player1.last_name}
                    </div>
                    <div className="text-sm">
                      {standing.pair.player2.first_name} {standing.pair.player2.last_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{standing.matchesPlayed}</TableCell>
                  <TableCell className="text-center font-bold">{standing.points}</TableCell>
                  <TableCell className="text-center">
                    {formatStandingsRecord(standing)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      {standing.setsWon}-{standing.setsLost}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ({standing.setDifference > 0 ? '+' : ''}{standing.setDifference})
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      {standing.gamesWon}-{standing.gamesLost}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ({standing.gameDifference > 0 ? '+' : ''}{standing.gameDifference})
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p><strong>PJ:</strong> Partidos Jugados | <strong>Pts:</strong> Puntos | <strong>G-P:</strong> Ganados-Perdidos</p>
          <p><strong>Q:</strong> Clasificado a Playoffs</p>
        </div>
      </CardContent>
    </Card>
  )
}
