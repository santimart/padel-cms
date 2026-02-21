'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES } from '@/lib/types'
import { getCategoryName } from '@/lib/tournament/ranking-calculator'
import { useGeoRef, type Province, type Locality } from '@/hooks/use-georef'
import { Autocomplete } from '@/components/ui/autocomplete'

// Kiosk Mode: No navigation, no links to dashboard
export default function PublicRegisterPlayerPage() {
  const [formData, setFormData] = useState({
    dni: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    category: '',
    gender: '',
    province: '',
    city: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captcha, setCaptcha] = useState<{ a: number; b: number; answer: string }>({ a: 0, b: 0, answer: '' })
  const [captchaInput, setCaptchaInput] = useState('')

  // GeoRef Hook
  const { provinces, loadingProvinces, getLocalities } = useGeoRef()
  const [localities, setLocalities] = useState<Locality[]>([])
  const [loadingLocalities, setLoadingLocalities] = useState(false)

  // Generate simple math captcha on load
  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1
    const b = Math.floor(Math.random() * 10) + 1
    setCaptcha({ a, b, answer: (a + b).toString() })
    setCaptchaInput('')
  }
  
  // UseEffect to easier handling on client only and prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    generateCaptcha()
  }, [])

  const handleProvinceChange = async (provinceId: string) => {
    // Find province name
    const province = provinces.find(p => p.id === provinceId)
    
    setFormData(prev => ({ 
      ...prev, 
      province: province?.nombre || '',
      city: '' // Reset city when province changes
    }))
    
    if (provinceId) {
      setLoadingLocalities(true)
      try {
        const locs = await getLocalities(provinceId)
        setLocalities(locs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingLocalities(false)
      }
    } else {
      setLocalities([])
    }
  }

  const handleCityChange = (cityId: string) => {
    const city = localities.find(l => l.id === cityId)
    setFormData(prev => ({ ...prev, city: city?.nombre || '' }))
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
    setSuccess(false)

    // Verify Captcha
    if (captchaInput !== captcha.answer) {
        setError('La respuesta de seguridad es incorrecta. Por favor intenta nuevamente.')
        generateCaptcha()
        setLoading(false)
        return
    }

    try {
      const supabase = createClient()

      // Check if player already exists by DNI
      const { data: existingPlayer } = await (supabase as any)
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
      const { error: insertError } = await (supabase as any).from('players').insert({
        dni: formData.dni,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        gender: formData.gender || null,
        current_category: formData.category ? parseInt(formData.category) : null,
        province: formData.province || null,
        city: formData.city || null,
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
        province: '',
        city: '',
      })
      generateCaptcha()

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (err: any) {
      console.error('Error registering player:', err)
      setError(err.message || 'Error al registrar jugador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className=" flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold text-primary">ReRank</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Registrate como Jugador</h1>
          <p className="text-muted-foreground">
            Completa tus datos para participar en los torneos
          </p>
        </div>

        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle>Tus Datos</CardTitle>
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
                <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <p className="font-semibold">¡Registro exitoso!</p>
                    <p>Tus datos han sido guardados correctamente.</p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Tu apellido"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni">DNI *</Label>
                <Input
                  id="dni"
                  name="dni"
                  type="text"
                  placeholder="Tu número de documento"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Tu número de celular"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Género *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Autocomplete
                    options={provinces.map(p => ({ id: p.id, label: p.nombre }))}
                    value={provinces.find(p => p.nombre === formData.province)?.id || ''}
                    onChange={handleProvinceChange}
                    placeholder="Selecciona provincia"
                    loading={loadingProvinces}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Localidad</Label>
                  <Autocomplete
                    options={localities.map(l => ({ id: l.id, label: l.nombre }))}
                    value={localities.find(l => l.nombre === formData.city)?.id || ''}
                    onChange={handleCityChange}
                    placeholder="Selecciona localidad"
                    emptyMessage={formData.province ? "No se encontraron localidades" : "Selecciona una provincia primero"}
                    loading={loadingLocalities}
                    disabled={loading || !formData.province}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría Sugerida</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona tu categoría" />
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

              {/* Bot Protection / Captcha */}
              <div className="p-4 bg-secondary/20 rounded-lg border border-border mt-4">
                  <Label htmlFor="captcha" className="block mb-2 font-medium">Pregunta de Seguridad *</Label>
                  <div className="flex items-center gap-3">
                      <div className="bg-secondary px-4 py-2 rounded font-mono font-bold text-lg select-none min-w-[100px] text-center">
                          {mounted ? `${captcha.a} + ${captcha.b} = ?` : '...'}
                      </div>
                      <Input
                          id="captcha"
                          name="captcha"
                          type="number"
                          placeholder="Respuesta"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          required
                          disabled={loading}
                          className="h-11 w-24 text-center font-bold"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={generateCaptcha} title="Nueva pregunta">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                      </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                      Por favor resuelve la suma para verificar que eres humano.
                  </p>
              </div>

              <Button type="submit" className="w-full h-12 text-lg mt-6" disabled={loading}>
                {loading ? 'Registrándome...' : 'Confirmar Registro'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            ReRank © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
