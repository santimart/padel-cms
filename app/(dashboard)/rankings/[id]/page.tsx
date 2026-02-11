import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getRankingDefinition, getRankingLeaderboard } from '@/lib/actions/rankings'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatName } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  tournaments_played: number
  total_points: number
  player: {
    first_name: string | null
    last_name: string | null
    photo_url: string | null
    gender: 'Masculino' | 'Femenino' | null
  }
}

async function LeaderboardTable({ rankingId }: { rankingId: string }) {
  const leaderboard = (await getRankingLeaderboard(rankingId)) as unknown as LeaderboardEntry[]

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay jugadores con puntos en este ranking todavía.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-16">#</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Jugador</th>
              <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Torneos</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Puntos</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {leaderboard.map((entry, index) => {
              const player = entry.player
              
              return (
                <tr key={entry.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-bold text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {player?.photo_url ? (
                          <AvatarImage src={player.photo_url} />
                        ) : null}
                        <AvatarFallback className={`text-xs font-semibold ${
                          player?.gender === 'Femenino' 
                            ? 'bg-pink-500/20 text-pink-700' 
                            : 'bg-blue-500/20 text-blue-700'
                        }`}>
                          {player?.first_name?.charAt(0)?.toUpperCase()}{player?.last_name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {formatName(player?.first_name)} {formatName(player?.last_name)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-center">
                    {entry.tournaments_played}
                  </td>
                  <td className="p-4 align-middle text-right font-bold text-primary">
                    {entry.total_points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function RankingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ranking = await getRankingDefinition(id)

  if (!ranking) notFound()

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <Button variant="ghost" asChild className="mb-2 -ml-2 text-muted-foreground">
            <Link href="/rankings">
              ← Volver a Rankings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{ranking.name}</h1>
          <p className="text-muted-foreground mt-1">
            Categoría {ranking.category} • Base: {ranking.base_points} pts
          </p>
        </div>
        {/* Future: Edit button */}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Posiciones</CardTitle>
            <CardDescription>Clasificación actual del ranking</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Cargando posiciones...</div>}>
              <LeaderboardTable rankingId={ranking.id} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Optional: Show distribution details in a collapsed card or dialog */}
      </div>
    </div>
  )
}
