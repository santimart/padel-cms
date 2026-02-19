'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { formatName } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface LeaderboardEntry {
  id: string
  total_points: number
  tournaments_played: number
  player: {
    id: string
    first_name: string | null
    last_name: string | null
    photo_url: string | null
    gender: 'Masculino' | 'Femenino' | null
  }
}

interface PublicRankingViewProps {
  ranking: {
    id: string
    name: string
    category: number
    complexes: {
      name: string
      logo_url: string | null
    } | null
  }
  leaderboard: LeaderboardEntry[]
}

export function PublicRankingView({ ranking, leaderboard }: PublicRankingViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getPositionIcon = (position: number) => {
    // if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    // if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />
    // if (position === 3) return <Award className="h-5 w-5 text-amber-600" />
    return null
  }

  const getPositionStyle = (position: number) => {
    
    if (position === 1) return 'border-3 border-primary'
    // if (position === 2) return 'bg-gray-300/10 border-gray-400/30'
    // if (position === 3) return 'bg-amber-600/10 border-amber-600/30'
    
    if (position % 2 === 0)
    return 'bg-primary/6'
  }

  const getAvatarColor = (gender: string | null) => {
    if (gender === 'Femenino') return 'bg-pink-500/20 text-pink-700'
    return 'bg-blue-500/20 text-blue-700'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {ranking.complexes?.logo_url ? (
              <img
                src={ranking.complexes.logo_url}
                alt={ranking.complexes.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">P</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">{ranking.name}</h1>
              <p className="text-xs text-muted-foreground">
                {ranking.complexes?.name} • Categoría {ranking.category}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Actualizado
            </p>
            <p className="font-mono text-sm">
              {currentTime.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium flex items-center gap-2">
            Tabla de Posiciones
          </h2>
          <span className="text-sm text-muted-foreground">
            {leaderboard.length} jugador{leaderboard.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Sin posiciones aún</p>
            <p className="text-sm">El ranking se actualizará a medida que se completen torneos.</p>
          </div>
        ) : (
          <div className="bg-card">
            {leaderboard.map((entry, index) => {
              const position = index + 1
              const player = entry.player
              const initials = `${player?.first_name?.charAt(0) || ''}${player?.last_name?.charAt(0) || ''}`.toUpperCase()

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-6 transition-all ${getPositionStyle(position)} `}
                >
                  {/* Position */}
                  <div className="w-10 flex items-center justify-center shrink-0">
                    {getPositionIcon(position) || (
                      <span className="text-2xl font-medium text-foreground">{position}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  {/* <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold ${getAvatarColor(player?.gender)}`}>
                    {player?.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div> */}

                  {/* Name */}
                  <div className="flex-1 min-w-0 flex " >
                    <p className="font-medium text-lg truncate">
                      {formatName(player?.first_name)} {formatName(player?.last_name)}
                    </p>
                  </div>

                  <Badge className="" variant='outline'>
                    {entry.tournaments_played} torneo{entry.tournaments_played !== 1 ? 's' : ''}
                  </Badge>

                  {/* Points */}
                  <div className="text-right shrink-0 w-[60px]">
                    <p className="font-medium text-xl">{entry.total_points}</p>
                    <p className="text-xs text-muted-foreground"></p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Padel Manager © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
