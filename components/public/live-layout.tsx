'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LiveLayoutProps {
  tournament: {
    name: string
  }
  children: React.ReactNode
}

export function LiveLayout({ tournament, children }: LiveLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Handle fullscreen change events (e.g. user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      {!isFullscreen && (
        <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border/40 shadow-sm z-10 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-3xl font-bold text-primary-foreground">P</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{tournament.name}</h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Tournament Live View</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-bold tabular-nums tracking-tight">
                {format(currentTime, 'HH:mm')}
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {format(currentTime, 'EEEE d MMMM', { locale: es })}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={toggleFullscreen} title="Pantalla Completa">
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}

      {/* Fullscreen Header (Minimal) */}
      {isFullscreen && (
         <div className="absolute top-4 right-4 z-50 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="icon" onClick={toggleFullscreen} title="Salir Pantalla Completa" className="shadow-lg">
              <Minimize2 className="h-5 w-5" />
            </Button>
         </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Footer / Ticker */}
      {!isFullscreen && (
        <footer className="bg-card border-t border-border/40 py-3 px-6 text-center text-sm text-muted-foreground">
          <p>Actualizaciones en tiempo real • Padel Manager Live</p>
        </footer>
      )}
    </div>
  )
}
