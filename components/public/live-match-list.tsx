import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatName } from "@/lib/utils"
import { MatchDetailed } from "@/lib/types"
import { ClockIcon } from "lucide-react"

interface LiveMatchListProps {
  matches: MatchDetailed[]
}

function ScoreBadge({ score, opponentScore }: { score: number | undefined, opponentScore: number | undefined }) {
  const isWinner = (score || 0) > (opponentScore || 0)
  
  return (
    <span className={`px-3 py-1 rounded w-[40px] text-center font-normal text-4xl  ${
      isWinner ? 'text-foreground' : 'text-foreground/50'
    }`}>
      {score ?? '-'}
    </span>
  )
}

function PairRow({ 
  pair, 
  isWinner, 
  scores, 
  opponentScores, 
  setsCount, 
  showScore,
  className 
}: { 
  pair: MatchDetailed['pair1'], 
  isWinner: boolean, 
  scores: number[], 
  opponentScores: number[], 
  setsCount: number, 
  showScore: boolean,
  className?: string
}) {
  return (
    <div className={`flex justify-between items-center ${className || ''}`}>
        <div className={`text-md truncate pr-4 text-foreground font-semibold ${isWinner ? '' : 'text-foreground/50'}`}>
            {formatName(pair?.player1?.first_name)} {formatName(pair?.player1?.last_name)}
            <br/>
            {formatName(pair?.player2?.first_name)} {formatName(pair?.player2?.last_name)}
        </div>
        {/* Score */}
         <div className="flex gap-2">
             {showScore && (
                 <div className="flex gap-1 text-lg font-mono font-bold">
                   
                    {/* Show games for each set */}
                    {Array.from({ length: setsCount }).map((_, i) => (
                       <React.Fragment key={i}>
                         <ScoreBadge 
                           score={scores[i]} 
                           opponentScore={opponentScores[i]} 
                         />
                        {/* separator line */}
                       </React.Fragment>
                    ))}
                 </div>
             )}
         </div>
    </div>
  )
}

interface CarouselSectionProps {
  title: string
  matches: MatchDetailed[]
  icon?: React.ReactNode
  emptyMessage: string
  status: 'playing' | 'scheduled' | 'finished'
}

function CarouselSection({ title, matches, icon, emptyMessage, status }: CarouselSectionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = React.useState(false)

  // Use a heuristic for duplication: if > 4, we likely need to scroll.
  const shouldAnimate = matches.length > 4
  const displayMatches = shouldAnimate ? [...matches, ...matches] : matches

  React.useEffect(() => {
    if (!shouldAnimate || !containerRef.current) return

    const container = containerRef.current
    let animationFrameId: number
    let startTime: number | null = null
    const speed = 0.5 // Pixels per frame (adjust for smoothness)

    const animate = (timestamp: number) => {
      if (isPaused) {
        startTime = null
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      if (!startTime) startTime = timestamp
      
      // Move scrollLeft
      if (container.scrollLeft >= (container.scrollWidth / 2)) {
         // Reset to 0 when we've scrolled past the first set (seamless loop)
         container.scrollLeft = 0
      } else {
         container.scrollLeft += speed
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [shouldAnimate, isPaused, matches.length]) // re-run if matches change

  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-4xl flex items-center text-foreground capitalize font-reckless">
          {icon} {title}
        </h2>
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-4xl  flex items-center text-foreground capitalize font-reckless">
        {icon} {title}
      </h2>
      
      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {displayMatches.map((match, index) => (
          /* Use index in key because of duplication */
          <div key={`${match.id}-${index}`} className="w-[380px] shrink-0">
            <LiveMatchCard match={match} status={status} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LiveMatchList({ matches }: LiveMatchListProps) {
  const inProgress = matches.filter(m => m.status === 'in_progress')
  const scheduled = matches.filter(m => m.status === 'scheduled')
  const completed = matches.filter(m => m.status === 'completed').reverse() // Show all finished or plenty?

  return (
    <div className="h-full flex flex-col gap-10 p-4 overflow-y-auto">
      {/* SECTION 1: EN JUEGO */}
      <CarouselSection 
        title="En Juego" 
        matches={inProgress} 
        icon={<span className="animate-pulse mr-2 text-red-500 text-3xl">●</span>}
        emptyMessage="No hay partidos en juego en este momento."
        status="playing"
      />

      {/* SECTION 2: PRÓXIMOS */}
      <CarouselSection 
        title="Próximos" 
        matches={scheduled}
        emptyMessage="No hay partidos programados próximamente."
        status="scheduled"
      />

      {/* SECTION 3: FINALIZADOS */}
      <CarouselSection 
        title="Finalizados" 
        matches={completed}
        emptyMessage="Aún no hay partidos finalizados."
        status="finished"
      />
    </div>
  )
}

function LiveMatchCard({ match, status }: { match: MatchDetailed, status: 'playing' | 'scheduled' | 'finished' }) {
  const isPlaying = status === 'playing'
  const isFinished = status === 'finished'

  // Helper to get games array safely
  const getGames = (gamesData: any): number[] => {
    try {
      if (!gamesData) return []
      return typeof gamesData === 'string' ? JSON.parse(gamesData) : gamesData
    } catch {
      return []
    }
  }

  const pair1Games = getGames(match.pair1_games)
  const pair2Games = getGames(match.pair2_games)
  
  // Determine how many sets to show (max of p1 or p2 length)
  const setsCount = Math.max(pair1Games.length, pair2Games.length)
  const showScore = match.status === 'completed' || match.status === 'in_progress'

  return (
    <Card className={`bg-white/80 border border-white overflow-hidden p-0 rounded-4xl ${isPlaying ? 'border-primary border-2 ' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
           <div className="flex flex-col gap-1 w-full">
             <div className="flex gap-3 items-center justify-start">

                <div className="text-sm font-semibold text-primary uppercase">
                    {match.zone?.name ? `Zona ${match.zone.name}` : (match.round || 'Partido')}
                </div>
                <span className='w-[10px] h-px bg-primary rounded-full' />
              
                {match.scheduled_time && (
                    <div className="text-sm font-semibold text-primary flex gap-1 items-center uppercase">
                        {/* <ClockIcon className="w-3 h-3" /> */}
                        {new Date(match.scheduled_time).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}hs
                    </div>
                )}
                <span className='w-[10px] h-px bg-primary rounded-full' />

              {match.court_number && (
             <div className="text-sm font-semibold text-primary uppercase">
               Cancha {match.court_number}
             </div>
           )}                
             </div>
             

           </div>

        </div>

        {/* Pair 1 */}
        <PairRow 
            pair={match.pair1}
            isWinner={match.winner_id === match.pair1_id}
            scores={pair1Games}
            opponentScores={pair2Games}
            setsCount={setsCount}
            showScore={showScore}
        />

        {/* Separator center line*/}
        <div className="w-full h-px bg-border/50 my-4" />
        

        {/* Pair 2 */}
        <PairRow 
            pair={match.pair2}
            isWinner={match.winner_id === match.pair2_id}
            scores={pair2Games}
            opponentScores={pair1Games}
            setsCount={setsCount}
            showScore={showScore}
        />
        
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
