'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { EditMatchTime } from "./edit-match-time"
import { MatchScorer } from "./match-scorer"
import { PlayoffMatch } from "@/lib/types"
import { formatMatchTime, formatName } from "@/lib/utils"

interface PlayoffMatchCardProps {
  match: PlayoffMatch
  onMatchUpdate: () => void
}

export function PlayoffMatchCard({ match, onMatchUpdate }: PlayoffMatchCardProps) {
  const isCompleted = match.status === 'completed'
  const pair1Won = match.winner_id === match.pair1_id && match.pair1_id !== null
  const pair2Won = match.winner_id === match.pair2_id && match.pair2_id !== null

  const renderPairName = (pair: PlayoffMatch['pair1']) => {
    if (!pair) return <div className="text-sm text-muted-foreground">TBD</div>
    
    return (
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">
             {formatName(pair.player1.first_name)} {formatName(pair.player1.last_name)} / {formatName(pair.player2.first_name)} {formatName(pair.player2.last_name)}
          </div>
        </div>
        {pair.zone && (
          <Badge variant="outline" className="text-xs mt-1">
            {pair.zone.name}
          </Badge>
        )}
      </div>
    )
  }

  return (
      <Card className="mb-3">
        <CardContent className="p-4">
            {/* Scheduled time */}
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            {match.scheduled_time ? (
              <>
                <span>📅 {formatMatchTime(match.scheduled_time)}</span>
                {match.court_number && <span>• Cancha {match.court_number}</span>}
              </>
            ) : (
              <span>📅 Por definir</span>
            )}
            <EditMatchTime
              matchId={match.id}
              currentTime={match.scheduled_time}
              currentCourt={match.court_number}
              onSuccess={onMatchUpdate}
            />
          </div>

          {/* Pair 1 */}
          <div className={`flex items-center gap-3 p-2 rounded ${pair1Won ? 'bg-primary/5' : ''}`}>
             {renderPairName(match.pair1)}
             <div className="flex items-center gap-2">
              {isCompleted && match.pair1_sets !== undefined && (
                <span className="text-lg font-bold min-w-[20px] text-center">
                  {match.pair1_sets}
                </span>
              )}
              {pair1Won && <Check className="h-4 w-4 text-primary" />}
            </div>
          </div>
          
          {/* Pair 2 */}
           <div className={`flex items-center gap-3 p-2 rounded mt-1 ${pair2Won ? 'bg-primary/5' : ''}`}>
             {renderPairName(match.pair2)}
             <div className="flex items-center gap-2">
              {isCompleted && match.pair2_sets !== undefined && (
                 <span className="text-lg font-bold min-w-[20px] text-center">
                   {match.pair2_sets}
                 </span>
               )}
               {pair2Won && <Check className="h-4 w-4 text-primary" />}
             </div>
          </div>
          
           {/* Detailed scores */}
           {/* Note: In DB types Json, we need to handle parsing if string or array */}
           {isCompleted && match.pair1_games && match.pair2_games && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {(() => {
                try {
                  const p1Games = typeof match.pair1_games === 'string' 
                    ? JSON.parse(match.pair1_games as string) 
                    : match.pair1_games
                  const p2Games = typeof match.pair2_games === 'string'
                    ? JSON.parse(match.pair2_games as string)
                    : match.pair2_games
                  
                  if (Array.isArray(p1Games) && Array.isArray(p2Games)) {
                    return `(${p1Games.map((p1: any, idx: number) => 
                      `${p1}-${p2Games[idx]}`
                    ).join(', ')})`
                  }
                } catch (e) {
                  return null
                }
              })()}
            </div>
          )}

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
              />
            </div>
          )}
        </CardContent>
      </Card>
  )
}
