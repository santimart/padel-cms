import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatName } from "@/lib/utils"
import { MatchDetailed } from "@/lib/types"
import { ClockIcon } from "lucide-react"

interface LiveMatchListProps {
  matches: MatchDetailed[]
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
        <h2 className="text-2xl font-bold flex items-center text-primary uppercase tracking-wider">
          {icon} {title}
        </h2>
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center text-primary uppercase tracking-wider">
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

  return (
    <Card className={`overflow-hidden ${isPlaying ? 'border-primary border-2 shadow-lg shadow-primary/10' : 'border-border'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
           <div className="flex flex-col gap-1">
             <div className="flex gap-2">
                <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {match.zone?.name ? `Zona ${match.zone.name}` : (match.round || 'Partido')}
                </div>
                {match.scheduled_time && (
                    <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {new Date(match.scheduled_time).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
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
            <div className={`text-lg font-bold truncate pr-4 ${match.winner_id === match.pair1_id ? 'text-green-500' : ''}`}>
                {formatName(match.pair1?.player1?.first_name)} {formatName(match.pair1?.player1?.last_name)}
                <br/>
                {formatName(match.pair1?.player2?.first_name)} {formatName(match.pair1?.player2?.last_name)}
            </div>
            {/* Score P1 */}
             <div className="flex gap-2">
                 {(match.status === 'completed' || match.status === 'in_progress') && (
                     <div className="flex gap-1 text-lg font-mono font-bold">
                        {/* Show games for each set */}
                        {Array.from({ length: setsCount }).map((_, i) => (
                           <span key={i} className={`px-3 py-1 rounded min-w-[30px] text-center ${
                             (pair1Games[i] > pair2Games[i]) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                           }`}>
                             {pair1Games[i] ?? '-'}
                           </span>
                        ))}
                     </div>
                 )}
             </div>
        </div>

        {/* Pair 2 */}
        <div className="flex justify-between items-center">
             <div className={`text-lg font-bold truncate pr-4 ${match.winner_id === match.pair2_id ? 'text-green-500' : ''}`}>
                {formatName(match.pair2?.player1?.first_name)} {formatName(match.pair2?.player1?.last_name)}
                <br/>
                {formatName(match.pair2?.player2?.first_name)} {formatName(match.pair2?.player2?.last_name)}
            </div>
             {/* Score P2 */}
             <div className="flex gap-2">
                 {(match.status === 'completed' || match.status === 'in_progress') && (
                     <div className="flex gap-1 text-lg font-mono font-bold">
                        {/* Show games for each set */}
                         {Array.from({ length: setsCount }).map((_, i) => (
                           <span key={i} className={`px-3 py-1 rounded min-w-[30px] text-center ${
                             (pair2Games[i] > pair1Games[i]) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                           }`}>
                             {pair2Games[i] ?? '-'}
                           </span>
                        ))}
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
