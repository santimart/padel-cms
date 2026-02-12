import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getComplexRankingDefinitions } from '@/lib/actions/rankings'
import { createClient } from '@/lib/supabase/server'

async function RankingList({ complexId }: { complexId: string }) {
  const rankings = await getComplexRankingDefinitions(complexId)

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No tienes rankings creados</h3>
        <p className="text-muted-foreground mb-4">
          Crea tu primer ranking para asignar puntos a tus torneos
        </p>
        <Button asChild>
          <Link href="/rankings/create">Crear Ranking</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rankings.map((ranking) => {        

        return (
          <Link key={ranking.id} href={`/rankings/${ranking.id}`}>
            <Card className="hover:bg-muted/50 transition-colors h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{ranking.name}</CardTitle>
                    <CardDescription>Categoría {ranking.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sistema de puntuación personalizado
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

export default async function RankingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Acceso denegado</div>

  // Fetch complex ID for the user
  const { data: complex } = await (supabase
    .from('complexes')
    .select('id')
    .eq('owner_id', user.id)
    .single() as any)

  if (!complex) return <div>No se encontró el complejo</div>

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los sistemas de puntuación para tus torneos
          </p>
        </div>
        <Button asChild>
          <Link href="/rankings/create">Crear Ranking</Link>
        </Button>
      </div>

      <Suspense fallback={<div>Cargando rankings...</div>}>
        <RankingList complexId={complex.id} />
      </Suspense>
    </div>
  )
}
