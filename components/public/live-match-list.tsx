'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatName } from "@/lib/utils"
import { MatchDetailed } from "@/lib/types"

interface LiveMatchListProps {
  matches: MatchDetailed[]
}

export function LiveMatchList({ matches }: LiveMatchListProps) {
  // Filter matches: show active, then upcoming, then recently finished?
  // Strategy:
  // 1. In Progress (Playing)
  // 2. Scheduled (Upcoming)
  // 3. Completed (Finished) - maybe limit to last 5?

  const inProgress = matches.filter(m => m.status === 'in_progress')
  const scheduled = matches.filter(m => m.status === 'scheduled')
  const completed = matches.filter(m => m.status === 'completed').reverse().slice(0, 5) // Show most recent finished

  // If plenty of active matches, maybe hide completed?
  // Let's simple list them in columns or sections.

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 overflow-y-auto">
      {/* Column 1: Active Matches (Priority) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center text-primary">
          <span className="animate-pulse mr-2 text-red-500">●</span> EN JUEGO
        </h2>
        
        {inProgress.length === 0 && (
          <p className="text-muted-foreground text-lg">No hay partidos en juego en este momento.</p>
        )}

        {inProgress.map(match => (
          <LiveMatchCard key={match.id} match={match} status="playing" />
        ))}

        {/* If few active matches, show upcoming here to fill space */}
        {inProgress.length < 3 && (
            <div className="mt-8 space-y-6">
                <h2 className="text-2xl font-bold text-muted-foreground">PRÓXIMOS</h2>
                {scheduled.slice(0, 3).map(match => (
                    <LiveMatchCard key={match.id} match={match} status="scheduled" />
                ))}
            </div>
        )}
      </div>

      {/* Column 2: Results / More Upcoming */}
      <div className="space-y-6">
        {/* If we didn't show upcoming in Col 1, show them here */}
        {inProgress.length >= 3 && (
             <div className="space-y-6">
                <h2 className="text-2xl font-bold text-muted-foreground">PRÓXIMOS</h2>
                {scheduled.slice(0, 3).map(match => (
                    <LiveMatchCard key={match.id} match={match} status="scheduled" />
                ))}
             </div>
        )}

        <h2 className="text-2xl font-bold text-muted-foreground">FINALIZADOS</h2>
        {completed.length === 0 && (
          <p className="text-muted-foreground text-lg">Aún no hay partidos finalizados.</p>
        )}
         {completed.map(match => (
          <LiveMatchCard key={match.id} match={match} status="finished" />
        ))}
      </div>
    </div>
  )
}

function LiveMatchCard({ match, status }: { match: MatchDetailed, status: 'playing' | 'scheduled' | 'finished' }) {
  const isPlaying = status === 'playing'
  const isFinished = status === 'finished'

  return (
    <Card className={`overflow-hidden ${isPlaying ? 'border-primary border-2 shadow-lg shadow-primary/10' : 'border-border'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
           <div className="flex flex-col gap-1">
             <div className="flex gap-2">
                <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {match.zone?.name || match.round || 'Partido'}
                </div>
                {match.scheduled_time && (
                    <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {new Date(match.scheduled_time).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
             </div>
           </div>
           {match.court_number && (
             <div className="text-base font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
               Cancha {match.court_number}
             </div>
           )}
        </div>

        {/* Pair 1 */}
        <div className="flex justify-between items-center mb-3">
            <div className={`text-xl font-bold truncate pr-4 ${match.winner_id === match.pair1_id ? 'text-green-500' : ''}`}>
                {formatName(match.pair1?.player1?.first_name)} {formatName(match.pair1?.player1?.last_name)} / 
                <br/>
                {formatName(match.pair1?.player2?.first_name)} {formatName(match.pair1?.player2?.last_name)}
            </div>
            {/* Score P1 */}
             <div className="flex gap-2">
                 {(match.status === 'completed' || match.status === 'in_progress') && (
                     <div className="flex gap-1 text-2xl font-mono font-bold">
                        {/* Logic to display sets/games. Simple sets for now */}
                        {match.pair1_sets !== null && (
                            <span className="bg-secondary px-3 py-1 rounded min-w-[40px] text-center">{match.pair1_sets}</span>
                        )}
                     </div>
                 )}
             </div>
        </div>

        {/* Pair 2 */}
        <div className="flex justify-between items-center">
             <div className={`text-xl font-bold truncate pr-4 ${match.winner_id === match.pair2_id ? 'text-green-500' : ''}`}>
                {formatName(match.pair2?.player1?.first_name)} {formatName(match.pair2?.player1?.last_name)} /
                <br/>
                {formatName(match.pair2?.player2?.first_name)} {formatName(match.pair2?.player2?.last_name)}
            </div>
             {/* Score P2 */}
             <div className="flex gap-2">
                 {(match.status === 'completed' || match.status === 'in_progress') && (
                     <div className="flex gap-1 text-2xl font-mono font-bold">
                        {match.pair2_sets !== null && (
                            <span className="bg-secondary px-3 py-1 rounded min-w-[40px] text-center">{match.pair2_sets}</span>
                        )}
                     </div>
                 )}
             </div>
        </div>
        
        {/* Live indicator details */}
        {isPlaying && (
            <div className="mt-4 pt-4 border-t border-border/50 text-center">
                <span className="text-sm font-medium text-primary uppercase tracking-widest animate-pulse">Jugando ahora</span>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
