'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCategoryName } from '@/lib/tournament/ranking-calculator'
import { GenerateZonesButton } from '@/components/tournaments/generate-zones-button'
import { GeneratePlayoffsButton } from '@/components/tournaments/generate-playoffs-button'
import { DeletePairButton } from '@/components/tournaments/delete-pair-button'
import { ZonesDisplay } from '@/components/tournaments/zones-display'
import { MatchesDisplay } from '@/components/tournaments/matches-display'
import { PlayoffBracket } from '@/components/tournaments/playoff-bracket'
import { TournamentQRDialog } from '@/components/tournament/tournament-qr-dialog'
import type { Tournament, Pair, Player } from '@/lib/types'

type TournamentWithComplex = Tournament & {
  complexes: {
    id: string
    name: string
    location: string | null
  }
}

type PairWithPlayers = Pair & {
  player1: Player
  player2: Player
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<TournamentWithComplex | null>(null)
  const [pairs, setPairs] = useState<PairWithPlayers[]>([])
  const [hasPlayoffs, setHasPlayoffs] = useState(false)
  const [allZoneMatchesCompleted, setAllZoneMatchesCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTournamentData()
  }, [tournamentId])

  const loadTournamentData = async () => {
    try {
      const supabase = createClient()

      // Load tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select(`
          *,
          complexes (
            id,
            name,
            location
          )
        `)
        .eq('id', tournamentId)
        .single()

      if (tournamentError) throw tournamentError
      setTournament(tournamentData)

      // Load pairs
      const { data: pairsData, error: pairsError } = await supabase
        .from('pairs')
        .select(`
          *,
          player1:players!pairs_player1_id_fkey (*),
          player2:players!pairs_player2_id_fkey (*)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: true })

      if (pairsError) throw pairsError
      setPairs(pairsData || [])

      // Check if playoffs exist
      const { data: playoffMatches } = await supabase
        .from('matches')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('phase', 'playoffs')
        .limit(1)

      setHasPlayoffs((playoffMatches?.length || 0) > 0)

      // Check if all zone matches are completed
      const { data: zoneMatches } = await supabase
        .from('matches')
        .select('id, status')
        .eq('tournament_id', tournamentId)
        .eq('phase', 'zones')
        .returns<{ id: string, status: string }[]>()
      
      const allCompleted = Boolean(zoneMatches && zoneMatches.length > 0 && 
        zoneMatches.every(match => match.status === 'completed' || match.status === 'walkover'))
      setAllZoneMatchesCompleted(allCompleted)
    } catch (err: any) {
      console.error('Error loading tournament:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      registration: { label: 'Inscripción Abierta', variant: 'default' },
      zones: { label: 'Fase de Zonas', variant: 'secondary' },
      playoffs: { label: 'Playoffs', variant: 'secondary' },
      finished: { label: 'Finalizado', variant: 'outline' },
    }
    const config = variants[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando torneo...</p>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-xl font-bold">Padel Manager</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Torneo no encontrado</h2>
              <p className="text-muted-foreground mb-6">{error || 'El torneo que buscas no existe'}</p>
              <Button asChild>
                <Link href="/dashboard">Volver al Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
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
              <Link href="/tournaments">Torneos</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tournament Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Volver al dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                <span>{tournament.complexes.name}</span>
                <span>•</span>
                <span>{tournament.category ? getCategoryName(tournament.category) : 'Sin categoría'}</span>
                <span>•</span>
                <span>{tournament.gender}</span>
                {tournament.start_date && (
                  <>
                    <span>•</span>
                    <span>{new Date(tournament.start_date).toLocaleDateString('es-AR')}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TournamentQRDialog 
                tournamentId={tournamentId} 
                tournamentName={tournament.name} 
              />
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link href={`/live/${tournamentId}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Modo TV (En Vivo)
                </Link>
              </Button>
              {getStatusBadge(tournament.status)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pairs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pairs">
              Parejas ({pairs.length}{tournament.max_pairs ? `/${tournament.max_pairs}` : ''})
            </TabsTrigger>
            <TabsTrigger value="zones" disabled={tournament.status === 'registration'}>
              Zonas
            </TabsTrigger>
            <TabsTrigger value="matches" disabled={tournament.status === 'registration'}>
              Partidos
            </TabsTrigger>
            {hasPlayoffs && (
              <TabsTrigger value="playoffs">
                Playoffs
              </TabsTrigger>
            )}
            <TabsTrigger value="settings">
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Pairs Tab */}
          <TabsContent value="pairs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Parejas Inscritas</CardTitle>
                    <CardDescription>
                      {tournament.status === 'registration'
                        ? 'Inscribe parejas para el torneo'
                        : 'Inscripción cerrada'}
                    </CardDescription>
                  </div>
                  {tournament.status === 'registration' && (
                    <Button asChild>
                      <Link href={`/tournaments/${tournamentId}/add-pair`}>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Inscribir Pareja
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pairs.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="h-12 w-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold mb-2">No hay parejas inscritas</h3>
                    <p className="text-muted-foreground mb-4">
                      Comienza inscribiendo la primera pareja para el torneo
                    </p>
                    {tournament.status === 'registration' && (
                      <Button asChild>
                        <Link href={`/tournaments/${tournamentId}/add-pair`}>Inscribir Primera Pareja</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pairs.map((pair, index) => (
                      <div
                        key={pair.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">
                              {formatName(pair.player1.first_name)} {formatName(pair.player1.last_name)} / {formatName(pair.player2.first_name)} {formatName(pair.player2.last_name)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {pair.player1.current_category && pair.player2.current_category && (
                                <span>
                                  Cat. {pair.player1.current_category} / {pair.player2.current_category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pair.zone_id && (
                            <Badge variant="outline">Zona asignada</Badge>
                          )}
                          {tournament.status === 'registration' && (
                            <DeletePairButton pairId={pair.id} onSuccess={loadTournamentData} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tournament.status === 'registration' && pairs.length >= 4 && (
                  <div className="mt-6 pt-6 border-t">
                    <GenerateZonesButton 
                    tournamentId={tournamentId} 
                    pairsCount={pairs.length}
                    onSuccess={loadTournamentData} 
                  />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones">
            <ZonesDisplay tournamentId={tournamentId} />
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <div className="space-y-6">
              <MatchesDisplay 
                tournamentId={tournamentId} 
                onMatchUpdate={loadTournamentData}
              />
              
              {/* Generate Playoffs Button */}
              {tournament.status !== 'registration' && !hasPlayoffs && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold">¿Listo para los Playoffs?</h3>
                      <p className="text-muted-foreground">
                        Completa todos los partidos de zona para generar el bracket de playoffs
                      </p>
                      <GeneratePlayoffsButton 
                        tournamentId={tournamentId} 
                        onSuccess={loadTournamentData}
                        allMatchesCompleted={allZoneMatchesCompleted}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Playoffs Tab */}
          {hasPlayoffs && (
            <TabsContent value="playoffs">
              <Card>
                <CardHeader>
                  <CardTitle>Bracket de Playoffs</CardTitle>
                  <CardDescription>
                    Fase eliminatoria con los mejores equipos de cada zona
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PlayoffBracket tournamentId={tournamentId} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Torneo</CardTitle>
                <CardDescription>Ajustes y opciones avanzadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Estado</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getStatusBadge(tournament.status)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Máximo de Parejas</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tournament.max_pairs || 'Sin límite'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Fecha de Inicio</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tournament.start_date
                        ? new Date(tournament.start_date).toLocaleDateString('es-AR')
                        : 'No definida'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Fecha de Fin</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tournament.end_date
                        ? new Date(tournament.end_date).toLocaleDateString('es-AR')
                        : 'No definida'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
