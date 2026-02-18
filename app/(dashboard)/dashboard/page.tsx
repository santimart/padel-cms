'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { DashboardCard } from '@/components/dashboard/dashboard-card'

import { useRouter } from 'next/navigation'
import { CirclePileIcon, ListOrderedIcon, UsersIcon } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="">
      {/* Main Content */}
      <div className="mb-8">
          <h1 className="text-4xl mb-2">Bienvenido al menu de dashboard</h1>
          {/* <p className="text-muted-foreground">
            Gestiona tus torneos, jugadores y rankings
          </p> */}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <DashboardCard 
             href="/tournaments/create"
             title="Crear Torneo"
             description="Configura un nuevo torneo por categoría"
             icon={(
             <CirclePileIcon />
             )}
             borderColor="border-primary/20"
          />

          <DashboardCard 
             href="/players"
             title="Ver Jugadores"
             description="Consulta la base de datos global de jugadores"
             icon={(
               <UsersIcon />
             )}
          />

          <DashboardCard 
             href="/rankings"
             title="Rankings"
             description="Consulta los rankings por categoría"
             icon={(
               <ListOrderedIcon />
             )}
          />
        </div>

        {/* Tournaments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium">Mis Torneos</h2>
            <Button asChild variant="outline">
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
    <div className="space-y-4  rounded-xl bg-card p-4">
      {tournaments.map((tournament: any) => (
        <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
          <Card className="hover:bg-secondary/20 transition-colors cursor-pointer border-3 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className='text-xl'>{tournament.name}</CardTitle>
                  <CardDescription className='text-md'>{tournament.complexes.name}</CardDescription>
                </div>
                <Badge variant={tournament.status === 'registration' ? 'default' : 'secondary'}>
                  {tournament.status === 'registration' ? 'Inscripción' : tournament.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm font-medium text-foreground/40 uppercase tracking-wider">
                <span>{tournament.pairs.length} parejas</span>
                <span>-</span>
                <span>Categoría {tournament.category}</span>
                <span>-</span>
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
