'use client'

import { useState } from 'react'
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

export default function RegisterPlayerPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    dni: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    category: '',
    gender: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    setSuccess(false)

    try {
      const supabase = createClient()

      // Check if player already exists by DNI
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('dni', formData.dni)
        .single()

      if (existingPlayer) {
        setError('Ya existe un jugador con este DNI')
        setLoading(false)
        return
      }

      // Create new player
      const { error: insertError } = await supabase.from('players').insert({
        dni: formData.dni,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        gender: formData.gender || null,
        current_category: formData.category ? parseInt(formData.category) : null,
      })

      if (insertError) throw insertError

      setSuccess(true)
      
      // Reset form
      setFormData({
        dni: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        category: '',
        gender: '',
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/players')
      }, 2000)
    } catch (err: any) {
      console.error('Error registering player:', err)
      setError(err.message || 'Error al registrar jugador')
    } finally {
      setLoading(false)
    }
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/players" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
              ← Volver a jugadores
            </Link>
            <h1 className="text-3xl font-bold mb-2">Registrar Jugador</h1>
            <p className="text-muted-foreground">
              Agrega un nuevo jugador a la base de datos global
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Datos del Jugador</CardTitle>
              <CardDescription>
                Los campos marcados con * son obligatorios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 text-sm text-primary bg-primary/10 border border-primary/20 rounded-md">
                    ✓ Jugador registrado exitosamente. Redirigiendo...
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Pérez"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    name="dni"
                    type="text"
                    placeholder="12345678"
                    value={formData.dni}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    El DNI debe ser único en el sistema
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jugador@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat.toString()}>
                          {getCategoryName(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    La categoría puede actualizarse más adelante
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrar Jugador'}
                  </Button>
                  <Button type="button" variant="outline" asChild disabled={loading}>
                    <Link href="/players">Cancelar</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
