'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatName } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ZoneStandings } from '@/components/tournaments/zone-standings'
import type { Pair, Player } from '@/lib/types'

interface Zone {
  id: string
  name: string
  tournament_id: string
  created_at: string
}

type PairWithPlayers = Pair & {
  player1: Player
  player2: Player
}

interface ZonesDisplayProps {
  tournamentId: string
}

export function ZonesDisplay({ tournamentId }: ZonesDisplayProps) {
  const [zones, setZones] = useState<Zone[]>([])
  const [pairsByZone, setPairsByZone] = useState<{ [zoneId: string]: PairWithPlayers[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadZones()
  }, [tournamentId])

  const loadZones = async () => {
    try {
      const supabase = createClient()

      // Load zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('zones')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('name', { ascending: true })

      if (zonesError) throw zonesError

      if (!zonesData || zonesData.length === 0) {
        setError('No se encontraron zonas para este torneo')
        setLoading(false)
        return
      }

      setZones(zonesData)

      // Load pairs for each zone
      const { data: pairsData, error: pairsError } = await supabase
        .from('pairs')
        .select(`
          *,
          player1:players!pairs_player1_id_fkey (*),
          player2:players!pairs_player2_id_fkey (*)
        `)
        .eq('tournament_id', tournamentId)
        .not('zone_id', 'is', null)
        .order('created_at', { ascending: true })

      if (pairsError) throw pairsError

      // Group pairs by zone
      const grouped: { [zoneId: string]: PairWithPlayers[] } = {}
      zonesData.forEach(zone => {
        grouped[zone.id] = []
      })

      pairsData?.forEach(pair => {
        if (pair.zone_id && grouped[pair.zone_id]) {
          grouped[pair.zone_id].push(pair as PairWithPlayers)
        }
      })

      setPairsByZone(grouped)
    } catch (err: any) {
      console.error('Error loading zones:', err)
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
            <p className="mt-4 text-muted-foreground">Cargando zonas...</p>
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {zones.map((zone) => {
        const zonePairs = pairsByZone[zone.id] || []
        return (
          <Card key={zone.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Zona {zone.name}</CardTitle>
                <Badge variant="secondary">{zonePairs.length} parejas</Badge>
              </div>
              <CardDescription>
                {zonePairs.length > 0 
                  ? `${(zonePairs.length * (zonePairs.length - 1)) / 2} partidos`
                  : 'Sin parejas asignadas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {zonePairs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay parejas en esta zona
                </p>
              ) : (
                <div className="space-y-2">
                  {zonePairs.map((pair, index) => (
                    <div
                      key={pair.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {formatName(pair.player1.first_name)} {formatName(pair.player1.last_name)}
                        </div>
                        <div className="font-medium text-sm">
                          {formatName(pair.player2.first_name)} {formatName(pair.player2.last_name)}
                        </div>
                        {pair.player1.current_category && pair.player2.current_category && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Cat. {pair.player1.current_category} / {pair.player2.current_category}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Standings Table */}
              {zonePairs.length > 0 && (
                <div className="mt-6">
                  <ZoneStandings
                    tournamentId={tournamentId}
                    zoneId={zone.id}
                    zoneName={zone.name}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
