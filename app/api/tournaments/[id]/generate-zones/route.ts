import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateZones, distributePairsIntoZones, getZoneName } from '@/lib/tournament/zone-generator'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get tournament and verify ownership
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, complexes!inner(owner_id)')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    if (tournament.complexes.owner_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Check tournament is in registration phase
    if (tournament.status !== 'registration') {
      return NextResponse.json(
        { error: 'El torneo ya ha comenzado' },
        { status: 400 }
      )
    }

    // Check if zones already exist for this tournament
    const { data: existingZones, error: existingZonesError } = await supabase
      .from('zones')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1)

    if (existingZonesError) {
      throw existingZonesError
    }

    if (existingZones && existingZones.length > 0) {
      return NextResponse.json(
        { error: 'Las zonas ya han sido generadas para este torneo' },
        { status: 400 }
      )
    }

    // Get all pairs for this tournament
    const { data: pairs, error: pairsError } = await supabase
      .from('pairs')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true })

    if (pairsError) {
      throw pairsError
    }

    if (!pairs || pairs.length < 4) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 4 parejas para generar zonas' },
        { status: 400 }
      )
    }

    // Generate zone distribution
    const { numZones, pairsPerZone } = generateZones(pairs.length)
    const distribution = distributePairsIntoZones(pairs, pairsPerZone)

    // Create zones in database
    const zonesData = []
    for (let i = 0; i < numZones; i++) {
      const { data: zone, error: zoneError } = await supabase
        .from('zones')
        .insert({
          tournament_id: tournamentId,
          name: getZoneName(i),
        })
        .select()
        .single()

      if (zoneError) {
        throw zoneError
      }

      zonesData.push(zone)

      // Assign pairs to this zone
      const zonePairs = distribution[i]
      if (zonePairs && zonePairs.length > 0) {
        const updates = zonePairs.map(pair => ({
          id: pair.id,
          zone_id: zone.id,
        }))

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('pairs')
            .update({ zone_id: update.zone_id })
            .eq('id', update.id)

          if (updateError) {
            throw updateError
          }
        }
      }
    }

    // Generate matches for each zone (round-robin)
    for (let i = 0; i < numZones; i++) {
      const zone = zonesData[i]
      const zonePairs = distribution[i]

      if (!zonePairs || zonePairs.length < 2) continue

      // Generate all possible matches (round-robin)
      const matches = []
      for (let j = 0; j < zonePairs.length; j++) {
        for (let k = j + 1; k < zonePairs.length; k++) {
          matches.push({
            tournament_id: tournamentId,
            phase: 'zone',
            zone_id: zone.id,
            pair1_id: zonePairs[j].id,
            pair2_id: zonePairs[k].id,
            match_number: matches.length + 1,
          })
        }
      }

      // Insert matches
      if (matches.length > 0) {
        const { error: matchesError } = await supabase
          .from('matches')
          .insert(matches)

        if (matchesError) {
          throw matchesError
        }
      }
    }

    // Update tournament status to 'zones'
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ status: 'zones' })
      .eq('id', tournamentId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      numZones,
      pairsPerZone,
      message: `Se generaron ${numZones} zonas con ${pairs.length} parejas`,
    })
  } catch (error: any) {
    console.error('Error generating zones:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar zonas' },
      { status: 500 }
    )
  }
}
