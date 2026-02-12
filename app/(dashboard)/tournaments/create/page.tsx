'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES } from '@/lib/types'
import { getCategoryName } from '@/lib/tournament/ranking-calculator'

export default function CreateTournamentPage() {
  const router = useRouter()
  const [complexes, setComplexes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    complexId: '',
    category: '',
    gender: '',
    maxPairs: '',
    startDate: '',
    endDate: '',
    dailyStartTime: '09:00',
    dailyEndTime: '21:00',
    matchDuration: '60',
    availableCourts: '2',
    registrationPrice: '0',
    rankingId: 'no_ranking',
    totalPoints: '0',
  })
  const [loading, setLoading] = useState(false)
  const [loadingComplexes, setLoadingComplexes] = useState(true)
  const [error, setError] = useState('')
  const [rankings, setRankings] = useState<any[]>([])

  useEffect(() => {
    loadUserComplexes()
  }, [])

  useEffect(() => {
    if (formData.complexId) {
      loadComplexRankings(formData.complexId)
    }
  }, [formData.complexId])

  const loadComplexRankings = async (complexId: string) => {
    const supabase: any = createClient()
    const { data } = await supabase
      .from('ranking_definitions')
      .select('*')
      .eq('complex_id', complexId)
    
    setRankings(data || [])
  }

  const loadUserComplexes = async () => {
    try {
      const supabase: any = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('complexes')
        .select('*')
        .eq('owner_id', user.id)

      if (error) throw error

      setComplexes(data || [])
      
      // Auto-select if only one complex
      if (data && data.length === 1) {
        setFormData(prev => ({ ...prev, complexId: data[0].id }))
      }
    } catch (error: any) {
      console.error('Error loading complexes:', error)
      setError('Error al cargar tus complejos')
    } finally {
      setLoadingComplexes(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase: any = createClient()

      // Validate dates
      if (formData.endDate && formData.startDate > formData.endDate) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio')
        setLoading(false)
        return
      }

      if (!formData.gender) {
        setError('Debes seleccionar un género')
        setLoading(false)
        return
      }

      if (formData.maxPairs && parseInt(formData.maxPairs) < 12) {
        setError('El máximo de parejas debe ser al menos 12')
        setLoading(false)
        return
      }

      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name: formData.name,
          complex_id: formData.complexId,
          category: parseInt(formData.category),
          gender: formData.gender,
          max_pairs: formData.maxPairs ? parseInt(formData.maxPairs) : null,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          daily_start_time: formData.dailyStartTime,
          daily_end_time: formData.dailyEndTime,
          match_duration_minutes: parseInt(formData.matchDuration),
          available_courts: parseInt(formData.availableCourts),
          registration_price: formData.registrationPrice ? parseInt(formData.registrationPrice) : 0,
          ranking_definition_id: formData.rankingId === 'no_ranking' ? null : formData.rankingId,
          total_points: formData.rankingId !== 'no_ranking' && formData.totalPoints ? parseInt(formData.totalPoints) : 0,
          status: 'registration',
        })
        .select()
        .single()

      if (tournamentError) throw tournamentError

      // Redirect to tournament detail
      router.push(`/tournaments/${tournament.id}`)
    } catch (err: any) {
      console.error('Error creating tournament:', err)
      setError(err.message || 'Error al crear el torneo')
    } finally {
      setLoading(false)
    }
  }

  if (loadingComplexes) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (complexes.length === 0) {
    return (
      <div className="container mx-auto">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">No tienes complejos registrados</h2>
            <p className="text-muted-foreground mb-6">
              Necesitas tener al menos un complejo registrado para crear torneos
            </p>
            <Button asChild>
              <Link href="/dashboard">Volver al Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Volver al dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2">Crear Torneo</h1>
        <p className="text-muted-foreground">
          Configura un nuevo torneo de pádel para tu complejo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Torneo</CardTitle>
          <CardDescription>
            Los campos marcados con * son obligatorios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Torneo *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Ej: Torneo Verano 2026"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexId">Complejo *</Label>
                  <Select
                    value={formData.complexId}
                    onValueChange={(value) => setFormData({ ...formData, complexId: value })}
                    disabled={loading || complexes.length === 1}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un complejo" />
                    </SelectTrigger>
                    <SelectContent>
                      {complexes.map((complex) => (
                        <SelectItem key={complex.id} value={complex.id}>
                          {complex.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      disabled={loading}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat.toString()}>
                            {getCategoryName(cat)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Género *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      disabled={loading}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Mixto">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rankingId">Ranking (Opcional)</Label>
                  <Select
                    value={formData.rankingId}
                    onValueChange={(value) => setFormData({ ...formData, rankingId: value })}
                    disabled={loading || !formData.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un ranking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_ranking">No suma puntos</SelectItem>
                      {rankings
                        .filter((r) => !formData.category || r.category === parseInt(formData.category))
                        .map((ranking) => (
                          <SelectItem key={ranking.id} value={ranking.id}>
                            {ranking.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {formData.category ? (
                    <p className="text-xs text-muted-foreground">
                      Mostrando rankings para {getCategoryName(parseInt(formData.category))}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Selecciona una categoría primero
                    </p>
                  )}
                </div>

                {formData.rankingId !== 'no_ranking' && (
                  <div className="space-y-2">
                    <Label htmlFor="totalPoints">Puntos del Torneo (Base)</Label>
                    <Input
                      id="totalPoints"
                      name="totalPoints"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="Ej: 1000"
                      value={formData.totalPoints}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Puntos base que se multiplicarán por el porcentaje del ranking (Ej: Master 1000)
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxPairs">Máximo de Parejas (Opcional)</Label>
                    <Input
                      id="maxPairs"
                      name="maxPairs"
                      type="number"
                      min="12"
                      placeholder="Ej: 16"
                      value={formData.maxPairs}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deja vacío para no limitar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationPrice">Costo Inscripción (por jugador)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="registrationPrice"
                        name="registrationPrice"
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0"
                        value={formData.registrationPrice}
                        onChange={handleChange}
                        disabled={loading}
                        className="pl-7"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de Fin</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Scheduling Configuration */}
                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-4">Configuración de Horarios</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dailyStartTime">Hora de Inicio Diaria</Label>
                      <Input
                        id="dailyStartTime"
                        name="dailyStartTime"
                        type="time"
                        value={formData.dailyStartTime}
                        onChange={handleChange}
                        disabled={loading}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        Hora de inicio de partidos cada día
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dailyEndTime">Hora de Fin Diaria</Label>
                      <Input
                        id="dailyEndTime"
                        name="dailyEndTime"
                        type="time"
                        value={formData.dailyEndTime}
                        onChange={handleChange}
                        disabled={loading}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        Hora de fin de partidos cada día
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matchDuration">Duración por Partido (min)</Label>
                      <Input
                        id="matchDuration"
                        name="matchDuration"
                        type="number"
                        min="30"
                        max="180"
                        step="15"
                        value={formData.matchDuration}
                        onChange={handleChange}
                        disabled={loading}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        Duración estimada (default: 60 min)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availableCourts">Canchas Disponibles</Label>
                      <Input
                        id="availableCourts"
                        name="availableCourts"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.availableCourts}
                        onChange={handleChange}
                        disabled={loading}
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        Número de canchas para partidos simultáneos
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Creando torneo...' : 'Crear Torneo'}
                  </Button>
                  <Button type="button" variant="outline" asChild disabled={loading}>
                    <Link href="/dashboard">Cancelar</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
  )
}
