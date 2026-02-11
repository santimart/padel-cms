'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createRankingDefinition } from '@/lib/actions/rankings'
import { RANKING_POINTS } from '@/lib/types'
import { toast } from 'sonner'
import { CATEGORIES } from '@/lib/types'

export default function CreateRankingPage({ searchParams }: { searchParams: { complexId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    base_points: 1000,
  })

  // Points distribution state initialized with defaults
  const [distribution, setDistribution] = useState(RANKING_POINTS)

  const handlePointChange = (key: keyof typeof RANKING_POINTS, value: string) => {
    const numValue = parseInt(value) || 0
    setDistribution(prev => ({ ...prev, [key]: numValue }))
    
    // Auto-update base_points if champion points change
    if (key === 'champion') {
      setFormData(prev => ({ ...prev, base_points: numValue }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // We assume complexId is available in context or fetched here. 
      // For simplicity let's fetch it via client or pass it down.
      // Since this is a client component, `searchParams` prop works if passed from server layout/page.
      // But typically we need to fetch user's complex ID.
      // Let's assume the user context or a hidden input strategy.
      // Actually, let's use a server action to get complex ID inside the submit handler?
      // No, let's fetch complex ID on page load.
      // Or better, let the server action `createRankingDefinition` handle fetching the complex ID from session?
      // The current implementation of `createRankingDefinition` expects comprehensive arguments.
      // We'll update `createRankingDefinition` to look up the complex ID if omitted? 
      // Or pass it here. Given previous pattern, let's fetch user's complex ID via a small server action or prop.
      // I'll make the page.tsx fetch it and pass it to a client component `RankingForm`.
      // For now, let's just use the form component pattern.
      
      // Temporary: fetching via client-side supabase or assuming server sends it.
      // I'll refactor this page to be server component wrapping a client form.
    } catch (error) {
       // ...
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Crear Nuevo Ranking</h1>
      <RankingForm />
    </div>
  )
}

function RankingForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        category: '',
    })

    const [distribution, setDistribution] = useState(RANKING_POINTS)

    const handlePointChange = (key: keyof typeof RANKING_POINTS, value: string) => {
        const numValue = parseInt(value) || 0
        setDistribution(prev => ({ ...prev, [key]: numValue }))
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Fetch complex_id first (hack for client comp)
            // Ideally should be passed as prop
            const { createClient } = await import('@/lib/supabase/client')
            const supabase: any = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('No usuario autenticado')

            const { data: complex } = await supabase.from('complexes').select('id').eq('owner_id', user.id).single()

            if (!complex) throw new Error('No complex found')

            await createRankingDefinition({
                complex_id: complex.id,
                name: formData.name,
                category: parseInt(formData.category),
                base_points: distribution.champion,
                points_distribution: distribution
            })

            toast.success('Ranking creado exitosamente')
            router.push('/rankings')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Error al crear ranking')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8">
             <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre del Ranking</Label>
                    <Input 
                        id="name" 
                        placeholder="Ej: Circuito 2024 - 1ra Categoría" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select onValueChange={val => setFormData({...formData, category: val})} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat.toString()}>{cat}ra Categoría</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
             </div>

             <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <h3 className="font-semibold text-lg">Distribución de Puntos (%)</h3>
                <p className="text-sm text-muted-foreground">Define el porcentaje de los puntos base que otorga cada instancia. Ej: si un torneo vale 1000 puntos y el campeón tiene 100%, recibe 1000.</p>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="champion">Campeón (%)</Label>
                        <Input 
                            id="champion" 
                            type="number" 
                            value={distribution.champion} 
                            onChange={e => handlePointChange('champion', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="finalist">Finalista (%)</Label>
                        <Input 
                            id="finalist" 
                            type="number" 
                            value={distribution.finalist} 
                            onChange={e => handlePointChange('finalist', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="semifinalist">Semifinalista (%)</Label>
                        <Input 
                            id="semifinalist" 
                            type="number" 
                            value={distribution.semifinalist} 
                            onChange={e => handlePointChange('semifinalist', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="quarterfinalist">Cuartofinalista (%)</Label>
                        <Input 
                            id="quarterfinalist" 
                            type="number" 
                            value={distribution.quarterfinalist} 
                            onChange={e => handlePointChange('quarterfinalist', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="round_of_16">Octavos R16 (%)</Label>
                        <Input 
                            id="round_of_16" 
                            type="number" 
                            value={distribution.round_of_16} 
                            onChange={e => handlePointChange('round_of_16', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="round_of_32">16avos R32 (%)</Label>
                        <Input 
                            id="round_of_32" 
                            type="number" 
                            value={distribution.round_of_32} 
                            onChange={e => handlePointChange('round_of_32', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="round_of_64">32avos R64 (%)</Label>
                        <Input 
                            id="round_of_64" 
                            type="number" 
                            value={distribution.round_of_64} 
                            onChange={e => handlePointChange('round_of_64', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="participation">Participación (%)</Label>
                        <Input 
                            id="participation" 
                            type="number" 
                            value={distribution.participation} 
                            onChange={e => handlePointChange('participation', e.target.value)}
                        />
                    </div>
                </div>
             </div>

             <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Ranking'}
                </Button>
             </div>
        </form>
    )
}
