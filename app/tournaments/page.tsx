'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCategoryName } from '@/lib/tournament/ranking-calculator'
import type { Tournament } from '@/lib/types'

type TournamentWithComplex = Tournament & {
  complexes: {
    name: string
  }
  pairs: { id: string }[]
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentWithComplex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get user's complexes
      const { data: complexes } = await supabase
        .from('complexes')
        .select('id')
        .eq('owner_id', user.id)

      if (!complexes || complexes.length === 0) {
        setLoading(false)
        return
      }

      const complexIds = complexes.map((c) => c.id)

      // Get tournaments for those complexes
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          complexes (name),
          pairs (id)
        `)
        .in('complex_id', complexIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTournaments(data || [])
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      registration: { label: 'Inscripción', variant: 'default' },
      zones: { label: 'Zonas', variant: 'secondary' },
      playoffs: { label: 'Playoffs', variant: 'secondary' },
      finished: { label: 'Finalizado', variant: 'outline' },
    }
    const config = variants[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-xl font-bold">Padel Manager</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/players">Jugadores</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis Torneos</h1>
            <p className="text-muted-foreground">
              Gestiona todos tus torneos de pádel
            </p>
          </div>
          <Button asChild>
            <Link href="/tournaments/create">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Torneo
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando torneos...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay torneos todavía</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer torneo para comenzar a gestionar partidos y rankings
              </p>
              <Button asChild>
                <Link href="/tournaments/create">Crear Primer Torneo</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="line-clamp-2">{tournament.name}</CardTitle>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <CardDescription>
                      {tournament.complexes.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Categoría:</span>
                        <span className="font-medium">{getCategoryName(tournament.category)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Género:</span>
                        <span className="font-medium">{tournament.gender}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Parejas:</span>
                        <span className="font-medium">
                          {tournament.pairs.length}
                          {tournament.max_pairs && `/${tournament.max_pairs}`}
                        </span>
                      </div>
                      {tournament.start_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Inicio:</span>
                          <span className="font-medium">
                            {new Date(tournament.start_date).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
