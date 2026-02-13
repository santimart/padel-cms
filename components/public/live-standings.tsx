'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { calculateZoneStandings, formatStandingsRecord } from '@/lib/tournament/standings-calculator'
import { formatName } from '@/lib/utils'
import { MatchDetailed, PairDetailed } from '@/lib/types'

interface LiveStandingsProps {
  pairs: PairDetailed[]
  matches: MatchDetailed[]
}

export function LiveStandings({ pairs, matches }: LiveStandingsProps) {
  // Group pairs by zone
  const zoneIds = Array.from(new Set(pairs.map(p => p.zone_id).filter(Boolean))) as string[]
  
  // Calculate standings for each zone
  const zonesData = zoneIds.map(zoneId => {
    const zoneName = pairs.find(p => p.zone_id === zoneId)?.zone?.name || 'Zona'
    const zonePairs = pairs.filter(p => p.zone_id === zoneId)
    // Need to convert Pair type to PairWithPlayers for calculator?
    // The current Pair type from supabase includes relation if joined.
    // We casts as any for simplicity or correct type if available.
    
    // Filter matches for this zone
    const zoneMatches = matches.filter(m => m.zone_id === zoneId)
    
    const standings = calculateZoneStandings(zonePairs as any, zoneMatches as any)
    return { name: zoneName, standings }
  }).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 p-3 max-w-[1400px] mx-auto  bg-card rounded-xl">
      {zonesData.map(zone => (
        <Card 
          key={zone.name} 
          className="rounded-none shadow-none border-0 border-b border-border last:border-b-0 md:odd:border-r md:odd:border-border md:[&:nth-last-child(-n+2)]:border-b-0 gap-0"
        >
          <CardHeader className=" pt-4 gap-0">
            <CardTitle className="text-xl text-primary uppercase tracking-wider text-center">ZONA {zone.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent uppercase">
                  <TableHead className="w-10 text-center  text-foreground">#</TableHead>
                  <TableHead className="text-foreground">Pareja</TableHead>
                  <TableHead className="text-center text-foreground">PJ</TableHead>
                  <TableHead className="text-center text-foreground">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zone.standings.map((standing, index) => (
                  <TableRow key={standing.pairId} className={`border-none ${index < 2 ? '' : ''}`}>
                    <TableCell className={`text-center font-bold text-lg ${index >= 2 ? 'opacity-50' : ''}`}>
                      {standing.position}
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium text-base truncate max-w-[150px] ${index >= 2 ? 'opacity-50' : ''}`}>
                        {formatName(standing.pair.player1.first_name)} {formatName(standing.pair.player1.last_name)}
                      </div>
                      <div className={`font-medium text-base truncate max-w-[150px] ${index >= 2 ? 'opacity-50' : ''}`}>
                        {formatName(standing.pair.player2.first_name)} {formatName(standing.pair.player2.last_name)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-lg">{standing.matchesPlayed}</TableCell>
                    <TableCell className="text-center font-bold text-xl text-primary">{standing.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
