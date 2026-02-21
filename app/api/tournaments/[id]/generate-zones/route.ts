import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateZones, distributePairsIntoZones, getZoneName } from '@/lib/tournament/zone-generator'
import { scheduleMatches } from '@/lib/tournament/match-scheduler'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    // Read body if it exists
    let body: any = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      // Ignore parse error
    }

    const mode = body.mode || 'confirm'
    const finalDistribution = body.distribution

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get tournament and verify ownership
    const { data: tournament, error: tournamentError } = await (supabase as any).from('tournaments')
      .select(`
        *,
        complex:complexes (
          id,
          owner_id
        )
      `)
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    if (tournament.complex.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este torneo' },
        { status: 403 }
      )
    }

    // Check tournament is in registration phase
    if (tournament.status !== 'registration') {
      return NextResponse.json(
        { error: 'El torneo ya ha comenzado' },
        { status: 400 }
      )
    }

    // Check if zones already exist for this tournament
    const { data: existingZones, error: existingZonesError } = await (supabase as any).from('zones')
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

    // Get all pairs for this tournament with player data
    const { data: pairs, error: pairsError } = await (supabase as any).from('pairs')
      .select(`
        *,
        player1:players!pairs_player1_id_fkey(*),
        player2:players!pairs_player2_id_fkey(*)
      `)
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

    // Generate zone distribution (or use provided one)
    let distribution: Record<string | number, any[]> = {}
    let numZones = 0

    if (mode === 'preview') {
      const generated = generateZones(pairs.length)
      numZones = generated.numZones
      distribution = distributePairsIntoZones(pairs, generated.pairsPerZone)
      
      return NextResponse.json({
        success: true,
        proposal: distribution,
        numZones
      })
    } else if (mode === 'confirm' && finalDistribution) {
      distribution = finalDistribution
      // if finalDistribution is an array, we count its length, otherwise Object.keys
      numZones = Array.isArray(distribution) ? distribution.length : Object.keys(distribution).length
    } else {
      // Fallback if confirm is called without distribution
      const generated = generateZones(pairs.length)
      numZones = generated.numZones
      distribution = distributePairsIntoZones(pairs, generated.pairsPerZone)
    }

    // Create zones in database
    const zonesData = []
    for (let i = 0; i < numZones; i++) {
      zonesData.push({
        tournament_id: tournamentId,
        name: getZoneName(i),
      })
    }

    const { data: createdZones, error: zonesError } = await (supabase as any).from('zones')
      .insert(zonesData)
      .select()

    if (zonesError || !createdZones) {
      throw zonesError
    }

    // Assign pairs to zones
    for (let i = 0; i < createdZones.length; i++) {
      const zone = createdZones[i]
      const zonePairs = distribution[i]

      if (zonePairs && zonePairs.length > 0) {
        const pairUpdates = zonePairs.map((pair: any) => ({
          id: pair.id,
          zone_id: zone.id,
        }))

        for (const update of pairUpdates) {
          const { error: pairUpdateError } = await (supabase as any).from('pairs')
            .update({ zone_id: update.zone_id })
            .eq('id', update.id)

          if (pairUpdateError) {
            throw pairUpdateError
          }
        }
      }
    }

    // Generate round-robin matches for each zone
    const allMatches = []
    for (let i = 0; i < createdZones.length; i++) {
      const zone = createdZones[i]
      const zonePairs = distribution[i]

      if (!zonePairs || zonePairs.length === 0) continue

      const matches = []
      // Round-robin: each pair plays every other pair once
      for (let j = 0; j < zonePairs.length; j++) {
        for (let k = j + 1; k < zonePairs.length; k++) {
          matches.push({
            tournament_id: tournamentId,
            phase: 'zones',
            zone_id: zone.id,
            pair1_id: zonePairs[j].id,
            pair2_id: zonePairs[k].id,
            match_number: allMatches.length + matches.length + 1,
          })
        }
      }

      allMatches.push(...matches)
    }

    // Insert matches
    if (allMatches.length > 0) {
      const { data: createdMatches, error: matchesError } = await (supabase as any).from('matches')
        .insert(allMatches)
        .select()

      if (matchesError) {
        throw matchesError
      }

      // Schedule matches if tournament has dates configured
      if (tournament.start_date && tournament.end_date && createdMatches) {
        const scheduledMatches = scheduleMatches(
          createdMatches,
          pairs,
          {
            startDate: new Date(tournament.start_date),
            endDate: new Date(tournament.end_date),
            dailyStartTime: tournament.daily_start_time || '09:00',
            dailyEndTime: tournament.daily_end_time || '21:00',
            matchDurationMinutes: tournament.match_duration_minutes || 60,
            availableCourts: tournament.available_courts || 1,
          }
        )

        // Update matches with scheduled times and court numbers
        for (const scheduled of scheduledMatches) {
          const { error: scheduleError } = await (supabase as any).from('matches')
            .update({ 
              scheduled_time: scheduled.scheduledTime.toISOString(),
              court_number: scheduled.courtNumber
            })
            .eq('id', scheduled.matchId)

          if (scheduleError) {
            console.error('Error scheduling match:', scheduleError)
          }
        }
      }
    }

    // Update tournament status to 'zones'
    const { error: updateError } = await (supabase as any).from('tournaments')
      .update({ status: 'zones' })
      .eq('id', tournamentId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      zones: createdZones.length,
      matches: allMatches.length,
    })
  } catch (error: any) {
    console.error('Error generating zones:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar zonas' },
      { status: 500 }
    )
  }
}
