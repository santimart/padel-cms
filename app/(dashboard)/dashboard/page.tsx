'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-xl font-bold">Padel Manager</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/">Inicio</Link>
            </Button>
            <Button variant="outline">Cerrar Sesión</Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Gestiona tus torneos, jugadores y rankings
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/tournaments/create">
            <Card className="border-primary/20 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <CardTitle>Crear Torneo</CardTitle>
                <CardDescription>
                  Configura un nuevo torneo con categoría y género
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/players">
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <CardTitle>Ver Jugadores</CardTitle>
                <CardDescription>
                  Consulta la base de datos global de jugadores
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/rankings">
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle>Rankings</CardTitle>
                <CardDescription>
                  Consulta los rankings por categoría
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Tournaments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mis Torneos</h2>
            <Button asChild>
              <Link href="/tournaments/create">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Torneo
              </Link>
            </Button>
          </div>

          <TournamentsSection />
        </div>
      </main>
    </div>
  )
}

function TournamentsSection() {
  const [tournaments, setTournaments] = useState<any[]>([])
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

      const complexIds = complexes.map((c: any) => c.id)

      // Get tournaments
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          complexes (name),
          pairs (id)
        `)
        .in('complex_id', complexIds)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setTournaments(data || [])
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando torneos...</p>
        </CardContent>
      </Card>
    )
  }

  if (tournaments.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-4">
      {tournaments.map((tournament: any) => (
        <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{tournament.name}</CardTitle>
                  <CardDescription>{tournament.complexes.name}</CardDescription>
                </div>
                <Badge variant={tournament.status === 'registration' ? 'default' : 'secondary'}>
                  {tournament.status === 'registration' ? 'Inscripción' : tournament.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>{tournament.pairs.length} parejas</span>
                <span>•</span>
                <span>Categoría {tournament.category}</span>
                <span>•</span>
                <span>{tournament.gender}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      {tournaments.length >= 3 && (
        <Button variant="outline" className="w-full" asChild>
          <Link href="/tournaments">Ver Todos los Torneos</Link>
        </Button>
      )}
    </div>
  )
}
