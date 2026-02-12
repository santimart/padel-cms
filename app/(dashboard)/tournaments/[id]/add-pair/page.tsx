'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Player } from '@/lib/types'
import { formatName } from '@/lib/utils'

export default function AddPairPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string

  const [searchTerm1, setSearchTerm1] = useState('')
  const [searchTerm2, setSearchTerm2] = useState('')
  const [searchResults1, setSearchResults1] = useState<Player[]>([])
  const [searchResults2, setSearchResults2] = useState<Player[]>([])
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null)
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchTerm1.length >= 2) {
      searchPlayers(searchTerm1, 1)
    } else {
      setSearchResults1([])
    }
  }, [searchTerm1])

  useEffect(() => {
    if (searchTerm2.length >= 2) {
      searchPlayers(searchTerm2, 2)
    } else {
      setSearchResults2([])
    }
  }, [searchTerm2])

  const searchPlayers = async (term: string, playerNumber: 1 | 2) => {
    try {
      const supabase = createClient()
      
      // Use PostgreSQL unaccent function for scalable accent-insensitive search
      const { data, error } = await (supabase as any)
        .rpc('search_players_unaccent', { search_term: term })

      if (error) {
        // Fallback to regular search if RPC fails (e.g., function not yet created)
        console.warn('Unaccent search failed, falling back to regular search:', error)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('players')
          .select('*')
          .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,dni.ilike.%${term}%`)
          .limit(5)
        
        if (fallbackError) throw fallbackError
        
        if (playerNumber === 1) {
          setSearchResults1(fallbackData || [])
        } else {
          setSearchResults2(fallbackData || [])
        }
        return
      }

      if (playerNumber === 1) {
        setSearchResults1(data || [])
      } else {
        setSearchResults2(data || [])
      }
    } catch (err) {
      console.error('Error searching players:', err)
    }
  }

  const selectPlayer = (player: Player, playerNumber: 1 | 2) => {
    if (playerNumber === 1) {
      setSelectedPlayer1(player)
      setSearchTerm1(`${formatName(player.first_name)} ${formatName(player.last_name)}`)
      setSearchResults1([])
    } else {
      setSelectedPlayer2(player)
      setSearchTerm2(`${formatName(player.first_name)} ${formatName(player.last_name)}`)
      setSearchResults2([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!selectedPlayer1 || !selectedPlayer2) {
      setError('Debes seleccionar ambos jugadores')
      setLoading(false)
      return
    }

    if (selectedPlayer1.id === selectedPlayer2.id) {
      setError('No puedes inscribir al mismo jugador dos veces')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Check if either player is already registered in this tournament
      const { data: existingPairs, error: checkError } = await (supabase
        .from('pairs')
        .select('id, player1:players!pairs_player1_id_fkey(first_name, last_name), player2:players!pairs_player2_id_fkey(first_name, last_name)')
        .eq('tournament_id', tournamentId)
        .or(`player1_id.eq.${selectedPlayer1.id},player2_id.eq.${selectedPlayer1.id},player1_id.eq.${selectedPlayer2.id},player2_id.eq.${selectedPlayer2.id}`) as any)

      if (checkError) {
        console.error('Error checking existing pairs:', checkError)
      }

      if (existingPairs && existingPairs.length > 0) {
        const existingPair = existingPairs[0]
        const player1Name = `${existingPair.player1.first_name} ${existingPair.player1.last_name}`
        const player2Name = `${existingPair.player2.first_name} ${existingPair.player2.last_name}`
        
        setError(`Uno de los jugadores ya está inscrito en este torneo (pareja: ${player1Name} / ${player2Name})`)
        setLoading(false)
        return
      }

      // Insert pair
      const { error: insertError } = await (supabase.from('pairs') as any).insert({
        tournament_id: tournamentId,
        player1_id: selectedPlayer1.id,
        player2_id: selectedPlayer2.id,
      })

      if (insertError) {
        // Handle database constraint errors with user-friendly messages
        if (insertError.message.includes('ya está inscrito')) {
          setError(insertError.message)
        } else {
          throw insertError
        }
        setLoading(false)
        return
      }

      // Redirect back to tournament
      router.push(`/tournaments/${tournamentId}`)
    } catch (err: any) {
      console.error('Error adding pair:', err)
      setError(err.message || 'Error al inscribir la pareja')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link
              href={`/tournaments/${tournamentId}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
            >
              ← Volver al torneo
            </Link>
            <h1 className="text-3xl font-bold mb-2">Inscribir Pareja</h1>
            <p className="text-muted-foreground">
              Busca y selecciona los dos jugadores que formarán la pareja
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Jugadores</CardTitle>
              <CardDescription>
                Busca por nombre, apellido o DNI. Los jugadores deben estar registrados previamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                {/* Player 1 */}
                <div className="space-y-2">
                  <Label htmlFor="player1">Jugador 1 *</Label>
                  <div className="relative">
                    <Input
                      id="player1"
                      type="text"
                      placeholder="Buscar jugador..."
                      value={searchTerm1}
                      onChange={(e) => {
                        setSearchTerm1(e.target.value)
                        setSelectedPlayer1(null)
                      }}
                      disabled={loading}
                      autoComplete="off"
                    />
                    {searchResults1.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchResults1.map((player) => (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => selectPlayer(player, 1)}
                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                          >
                            <div className="font-medium">
                              {formatName(player.first_name)} {formatName(player.last_name)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              DNI: {player.dni}
                              {player.current_category && ` • Cat. ${player.current_category}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPlayer1 && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {formatName(selectedPlayer1.first_name)} {formatName(selectedPlayer1.last_name)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            DNI: {selectedPlayer1.dni}
                            {selectedPlayer1.current_category && ` • Cat. ${selectedPlayer1.current_category}`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPlayer1(null)
                            setSearchTerm1('')
                          }}
                        >
                          Cambiar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Player 2 */}
                <div className="space-y-2">
                  <Label htmlFor="player2">Jugador 2 *</Label>
                  <div className="relative">
                    <Input
                      id="player2"
                      type="text"
                      placeholder="Buscar jugador..."
                      value={searchTerm2}
                      onChange={(e) => {
                        setSearchTerm2(e.target.value)
                        setSelectedPlayer2(null)
                      }}
                      disabled={loading}
                      autoComplete="off"
                    />
                    {searchResults2.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchResults2.map((player) => (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => selectPlayer(player, 2)}
                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                          >
                            <div className="font-medium">
                              {formatName(player.first_name)} {formatName(player.last_name)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              DNI: {player.dni}
                              {player.current_category && ` • Cat. ${player.current_category}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPlayer2 && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {formatName(selectedPlayer2.first_name)} {formatName(selectedPlayer2.last_name)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            DNI: {selectedPlayer2.dni}
                            {selectedPlayer2.current_category && ` • Cat. ${selectedPlayer2.current_category}`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPlayer2(null)
                            setSearchTerm2('')
                          }}
                        >
                          Cambiar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || !selectedPlayer1 || !selectedPlayer2}
                  >
                    {loading ? 'Inscribiendo...' : 'Inscribir Pareja'}
                  </Button>
                  <Button type="button" variant="outline" asChild disabled={loading}>
                    <Link href={`/tournaments/${tournamentId}`}>Cancelar</Link>
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Si un jugador no aparece en la búsqueda, primero debes{' '}
                  <Link href="/register-player" className="text-primary hover:underline">
                    registrarlo en la base de datos
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  )
}
