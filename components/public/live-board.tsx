'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRealtimeTournament } from '@/hooks/use-realtime-tournament'
import { LiveMatchList } from './live-match-list'
import { LiveStandings } from './live-standings'
import { LiveBracket } from './live-bracket'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface LiveBoardProps {
  tournamentId: string
}

export function LiveBoard({ tournamentId }: LiveBoardProps) {
  const { matches, pairs, loading, error } = useRealtimeTournament({ tournamentId })
  const [activeTab, setActiveTab] = useState('matches')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-4 text-xl">Cargando datos del torneo...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-destructive">
        <span className="text-xl">Error al cargar datos: {error}</span>
      </div>
    )
  }

  // Inject current time into the header (using a portal or just knowing this component is inside the main area)
  // Actually, we can just display the clock here or let the parent handle it. The parent has a placeholder.
  // For now, let's focus on the content.

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-[600px] grid-cols-3 overflow-hidden pb-10">
            <TabsTrigger value="matches" className="text-lg">Partidos</TabsTrigger>
            <TabsTrigger value="standings" className="text-lg">Posiciones</TabsTrigger>
            <TabsTrigger value="bracket" className="text-lg">Cuadro</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <TabsContent value="matches" className="h-full m-0 data-[state=active]:flex flex-col">
            <LiveMatchList matches={matches} />
          </TabsContent>
          
          <TabsContent value="standings" className="h-full m-0 overflow-y-auto">
            <LiveStandings pairs={pairs} matches={matches} />
          </TabsContent>

          <TabsContent value="bracket" className="h-full m-0 overflow-y-auto">
            <LiveBracket matches={matches} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
