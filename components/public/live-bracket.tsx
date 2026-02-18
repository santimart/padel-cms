'use client'

import { Card, CardContent } from "@/components/ui/card"
import { formatName } from "@/lib/utils"
import { MatchDetailed } from "@/lib/types"

interface LiveBracketProps {
  matches: MatchDetailed[]
}

const ROUND_LABELS: Record<string, string> = {
  'R32': '32avos',
  'R16': 'Octavos',
  'QF': 'Cuartos',
  'SF': 'Semis',
  'F': 'Final',
}

const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'F']

export function LiveBracket({ matches }: LiveBracketProps) {
  // Identify rounds present
  const playoffMatches = matches.filter(m => m.phase === 'playoffs')
  const presentRounds = Array.from(new Set(playoffMatches.map(m => m.round))).filter(Boolean) as string[]
  
  const sortedRounds = presentRounds.sort((a, b) => {
    return ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b)
  })

  // We need to render columns for each round
  // This is a simplified bracket view. For a true tree we need canvas or complex CSS grid.
  // For now, let's use flex columns which is readable enough on TV.

  return (
    <div className="flex gap-8 p-4 overflow-x-auto min-w-full min-h-full justify-center">
      {sortedRounds.map(round => {
        // Sort matches by bracket_position
        const roundMatches = playoffMatches
          .filter(m => m.round === round)
          .sort((a, b) => (a.bracket_position || 0) - (b.bracket_position || 0))
        
        return (
          <div key={round} className="min-w-[300px] flex flex-col gap-4">
             <div className="text-center py-2 rounded  text-xl uppercase tracking-widest text-primary sticky top-0 z-10 ">
               {ROUND_LABELS[round] || round}
             </div>
             
             <div className="flex flex-col justify-around flex-1 py-4 gap-8">
               {roundMatches.map(match => (
                 <LiveBracketMatch key={match.id} match={match} />
               ))}
             </div>
          </div>
        )
      })}
      
      {sortedRounds.length === 0 && (
          <div className="w-full flex items-center justify-center text-muted-foreground text-xl">
              El cuadro de playoffs aún no se ha generado.
          </div>
      )}
    </div>
  )
}

function LiveBracketMatch({ match }: { match: MatchDetailed }) {
  const winnerId = match.winner_id
  const p1Lost = winnerId && winnerId !== match.pair1_id
  const p2Lost = winnerId && winnerId !== match.pair2_id
  
  // Helper to get games array safely
  const getGames = (gamesData: any): number[] => {
    try {
      if (!gamesData) return []
      return typeof gamesData === 'string' ? JSON.parse(gamesData) : gamesData
    } catch {
      return []
    }
  }

  const p1Games = getGames(match.pair1_games)
  const p2Games = getGames(match.pair2_games)

  return (
    <Card className="border-border min-w-[280px] shadow-none rounded-3xl py-1">
      <CardContent className="p-3">
        {/* Pair 1 */}
        <div className={`flex justify-between items-center p-2 rounded ${winnerId === match.pair1_id ? '' : ''} ${p1Lost ? 'opacity-50' : ''}`}>
           <div className={`text-md truncate flex-1 pr-2 ${winnerId === match.pair1_id ? '' : ''}`}>
               {match.pair1 ? (
                   <span className="flex flex-col">
                    <span>{formatName(match.pair1.player1.first_name)} {formatName(match.pair1.player1.last_name)}</span>
                    <span>{formatName(match.pair1.player2.first_name)} {formatName(match.pair1.player2.last_name)}</span>
                   </span>
               ) : (
                  <span className="text-muted-foreground italic">A definir</span>
               )}
           </div>
           
           <div className="flex items-center gap-3">
             <div className="flex gap-2 text-foreground font-mono font-bold">
                {p1Games.map((g, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-center min-w-[24px] min-h-[24px ${
                      (p1Games[i] > p2Games[i]) ? 'border-primary border-2 text-primary' : 'bg-secondary'
                  }`}>
                      {g}
                  </span>
                ))}
             </div>
           </div>
        </div>

        <div className="h-px bg-border my-1"></div>

        {/* Pair 2 */}
        <div className={`flex justify-between items-center p-2 rounded ${winnerId === match.pair2_id ? 'bg-green-500/10' : ''} ${p2Lost ? 'opacity-50' : ''}`}>
           <div className={`text-md truncate flex-1 pr-2 ${winnerId === match.pair2_id ? 'text-green-500' : ''}`}>
                {match.pair2 ? (
                   <span className="flex flex-col">
                    <span>{formatName(match.pair2.player1.first_name)} {formatName(match.pair2.player1.last_name)}</span>
                    <span>{formatName(match.pair2.player2.first_name)} {formatName(match.pair2.player2.last_name)}</span>
                   </span>
               ) : (
                  <span className="text-muted-foreground italic">A definir</span>
               )}
           </div>
           
           <div className="flex items-center gap-3">
             <div className="flex gap-2 text-foreground font-mono font-bold">
                {p2Games.map((g, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded text-center min-w-[24px] min-h-[24px] ${
                      (p2Games[i] > p1Games[i]) ? 'border-primary border-2 text-primary' : ''
                  }`}>
                      {g}
                  </span>
                ))}
             </div>
           </div>
        </div>
        
        <div className="text-xs text-center mt-1 text-muted-foreground">
             {match.zone?.name ? `Zona ${match.zone.name}` : ''}
              {match.scheduled_time && !match.winner_id && (
                  <span className="ml-1">
                      • {new Date(match.scheduled_time).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}
                  </span>
              )}
        </div>
      </CardContent>
    </Card>
  )
}
