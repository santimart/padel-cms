'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, CalendarIcon } from "lucide-react"
import { EditMatchTime } from "./edit-match-time"
import { MatchScorer } from "./match-scorer"
import { PlayoffMatch } from "@/lib/types"
import { formatMatchTime, formatName } from "@/lib/utils"

interface PlayoffMatchCardProps {
  match: PlayoffMatch
  onMatchUpdate: () => void
  isEditable?: boolean
}

export function PlayoffMatchCard({ match, onMatchUpdate, isEditable = true }: PlayoffMatchCardProps) {
  const isCompleted = match.status === 'completed'
  const pair1Won = match.winner_id === match.pair1_id && match.pair1_id !== null
  const pair2Won = match.winner_id === match.pair2_id && match.pair2_id !== null

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
  const setsCount = Math.max(p1Games.length, p2Games.length)

  return (
      <Card className="mb-3">
        <CardContent className="p-4">
            {/* Scheduled time */}
          {/* Scheduled time */}
          <div className="flex items-center gap-2 mb-3 text-xs">
            {match.scheduled_time ? (
               <div className="text-sm text-primary uppercase font-medium">
                <span className='flex items-center gap-2 tracking-wide'>
                  <CalendarIcon className='w-4 h-4' /> {formatMatchTime(match.scheduled_time)}
                  {match.court_number && ` • Cancha ${match.court_number}`}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">📅 Por definir</span>
            )}
            <EditMatchTime
              matchId={match.id}
              currentTime={match.scheduled_time}
              currentCourt={match.court_number}
              onSuccess={onMatchUpdate}
              isEditable={isEditable}
            />
          </div>

          {/* Pair 1 */}
          <div className={`flex items-center gap-3 p-2 rounded ${pair1Won ? 'bg-secondary/20' : ''}`}>
             <div className="flex-1">
                {match.pair1 ? (
                   <div className="flex flex-col">
                     <span className="text-lg font-medium">
                        {formatName(match.pair1.player1.first_name)} {formatName(match.pair1.player1.last_name)} / {formatName(match.pair1.player2.first_name)} {formatName(match.pair1.player2.last_name)}
                     </span>
                     {match.pair1.zone?.name && (
                       <Badge variant="outline" className="w-fit mt-1 text-[12px] h-5 px-1.5  bg-transparent border-foreground">
                         Zona {match.pair1.zone.name}
                       </Badge>
                     )}
                   </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Por definir</span>
                )}
             </div>
             
             {isCompleted && (
               <div className="flex items-center gap-1">
                 {Array.from({ length: setsCount }).map((_, i) => (
                    <span key={i} className={`font-medium text-foreground text-2xl px-2 py-0.5 rounded text-center w-[35px] ${
                      (p1Games[i] > p2Games[i]) ? 'font-bold' : ''
                    }`}>
                      {p1Games[i] ?? '-'}
                    </span>
                 ))}
               </div>
             )}
          </div>
          
          {/* Pair 2 */}
           <div className={`flex items-center gap-3 p-2 rounded mt-1 ${pair2Won ? 'bg-primary/5' : ''}`}>
             <div className="flex-1">
                 {match.pair2 ? (
                   <div className="flex flex-col">
                     <span className="text-lg font-medium">
                        {formatName(match.pair2.player1.first_name)} {formatName(match.pair2.player1.last_name)} / {formatName(match.pair2.player2.first_name)} {formatName(match.pair2.player2.last_name)}
                     </span>
                     {match.pair2.zone?.name && (
                       <Badge variant="outline" className="w-fit mt-1 text-[12px] h-5 px-1.5  bg-transparent border-foreground">
                         Zona {match.pair2.zone.name}
                       </Badge>
                     )}
                   </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Por definir</span>
                )}
             </div>

             {isCompleted && (
               <div className="flex items-center gap-1">
                 {Array.from({ length: setsCount }).map((_, i) => (
                    <span key={i} className={`font-medium text-foreground text-2xl px-2 py-0.5 rounded text-center min-w-[35px] ${
                      (p2Games[i] > p1Games[i]) ? 'font-bold' : ''
                    }`}>
                      {p2Games[i] ?? '-'}
                    </span>
                 ))}
               </div>
             )}
          </div>

           {/* Actions / Match Scorer */}
          {!isCompleted && match.pair1 && match.pair2 && (
            <div className="mt-3 pt-3 border-t">
              <MatchScorer
                matchId={match.id}
                pair1Name={`${formatName(match.pair1.player1.first_name)} ${formatName(match.pair1.player1.last_name)} / ${formatName(match.pair1.player2.first_name)} ${formatName(match.pair1.player2.last_name)}`}
                pair2Name={`${formatName(match.pair2.player1.first_name)} ${formatName(match.pair2.player1.last_name)} / ${formatName(match.pair2.player2.first_name)} ${formatName(match.pair2.player2.last_name)}`}
                pair1Id={match.pair1.id}
                pair2Id={match.pair2.id}
                currentStatus={match.status}
                phase="playoffs"
                round={match.round as any} // Cast strict round type if needed by MatchScorer
                onSuccess={onMatchUpdate}
                isEditable={isEditable}
              />
            </div>
          )}
        </CardContent>
      </Card>
  )
}
