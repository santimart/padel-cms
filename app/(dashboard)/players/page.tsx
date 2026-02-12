'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getCategoryName } from '@/lib/tournament/ranking-calculator'
import type { Player } from '@/lib/types'
import { formatName } from '@/lib/utils'

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlayers(data || [])
    } catch (error) {
      console.error('Error loading players:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayers = players.filter((player) => {
    const search = searchTerm.toLowerCase()
    return (
      player.first_name.toLowerCase().includes(search) ||
      player.last_name.toLowerCase().includes(search) ||
      player.dni.toLowerCase().includes(search) ||
      player.email?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Base de Datos de Jugadores</h1>
          <p className="text-muted-foreground">
            Base de datos global compartida entre todos los clubes
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, DNI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/register-player">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Registrar Jugador
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register-player/qr">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Generar QR
              </Link>
            </Button>
          </div>
        </div>

        {/* Players Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredPlayers.length} {filteredPlayers.length === 1 ? 'Jugador' : 'Jugadores'}
            </CardTitle>
            <CardDescription>
              {searchTerm && `Filtrando por: "${searchTerm}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">Cargando jugadores...</p>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <svg className="h-12 w-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No se encontraron jugadores' : 'No hay jugadores registrados'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? 'Intenta con otro término de búsqueda'
                    : 'Comienza registrando jugadores para tus torneos'}
                </p>
                {!searchTerm && (
                  <Button asChild>
                    <Link href="/register-player">Registrar Primer Jugador</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Registrado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          {formatName(player.first_name)} {formatName(player.last_name)}
                        </TableCell>
                        <TableCell>{player.dni}</TableCell>
                        <TableCell>{player.email || '-'}</TableCell>
                        <TableCell>{player.phone || '-'}</TableCell>
                        <TableCell>
                          {player.current_category ? (
                            <Badge variant="outline">
                              {getCategoryName(player.current_category)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Sin categoría</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(player.created_at).toLocaleDateString('es-AR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
