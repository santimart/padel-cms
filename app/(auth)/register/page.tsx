'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { UploadCloud } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    complexName: '',
    location: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Formato de imagen no válido. Use JPG, PNG o WEBP.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setError('El tamaño de la imagen no debe superar los 2MB.')
      return
    }

    setError('')
    setLogoFile(file)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario')
      }

      // 2. Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 500))

      // 3. Create complex for this user using the database function
      const { data: complexId, error: complexError } = await (supabase as any)
        .rpc('create_complex_for_user', {
          user_id: authData.user.id,
          complex_name: formData.complexName,
          complex_location: formData.location,
        })

      if (complexError) {
        console.error('Error creating complex:', complexError)
        // If complex creation fails, we can still proceed? No, that's critical.
        // But maybe user created, complex failed. 
        throw new Error('Error al crear el complejo: ' + complexError.message)
      }

      // 4. Upload Logo if exists
      if (logoFile && complexId) {
        try {
          const fileExt = logoFile.name.split('.').pop()
          const fileName = `${complexId}/logo-${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('complex-logos')
            .upload(fileName, logoFile)

          if (uploadError) {
             console.error('Error uploading logo:', uploadError)
             // Don't block registration if logo upload fails, just log it
          } else {
             // Get public URL
             const { data: { publicUrl } } = supabase.storage
               .from('complex-logos')
               .getPublicUrl(fileName)

             // Update complex with logo_url
             await (supabase as any)
               .from('complexes')
               .update({ logo_url: publicUrl })
               .eq('id', complexId)
          }
        } catch (uploadErr) {
           console.error('Logo upload exception:', uploadErr)
        }
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-2xl font-bold">Padel Manager</span>
          </Link>
          <p className="text-muted-foreground mt-2">
            Crea tu cuenta y comienza a gestionar torneos
          </p>
        </div>

        {/* Register Form */}
        <Card>
          <CardHeader>
            <CardTitle>Crear Cuenta</CardTitle>
            <CardDescription>
              Regístrate como dueño de complejo para gestionar tus torneos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="complexName">Nombre del Complejo</Label>
                <Input
                  id="complexName"
                  name="complexName"
                  type="text"
                  placeholder="Ej: Club Padel Central"
                  value={formData.complexName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

               <div className="space-y-2">
                <Label htmlFor="logo">Logo (Opcional)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleLogoChange}
                        disabled={loading}
                        className="cursor-pointer file:cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:rounded-full file:border-0 file:mr-4 file:px-4 file:py-1 hover:file:bg-primary/20"
                      />
                      <UploadCloud className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 2MB. Formatos: PNG, JPG, WEBP
                    </p>
                  </div>
                   {logoFile && (
                    <div className="h-10 w-10 relative bg-muted rounded border overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={URL.createObjectURL(logoFile)} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                    </div>
                   )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Ej: Buenos Aires, Argentina"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
