import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateZoneStandings, getQualifiedPairs, generateFullBracket, BracketMatch } from '@/lib/tournament/playoff-generator'
import { scheduleMatches } from '@/lib/tournament/match-scheduler'
import { TournamentWithComplex, PairWithPlayers, Match } from '@/lib/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    // 1. Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get tournament and verify ownership
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
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
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Checking ownership
    // We cast to TournamentWithComplex to access the joined relation safely
    const tournamentWithComplex = tournament as unknown as TournamentWithComplex

    if (tournamentWithComplex.complex.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar este torneo' },
        { status: 403 }
      )
    }

    // 3. Check if playoffs already generated
    const { data: existingPlayoffs } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('phase', 'playoffs')
      .limit(1)

    if (existingPlayoffs && existingPlayoffs.length > 0) {
      return NextResponse.json(
        { error: 'Playoffs already generated for this tournament' },
        { status: 400 }
      )
    }

    // 4. Get all zones
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('name')

    if (zonesError || !zones || zones.length === 0) {
      return NextResponse.json(
        { error: 'No zones found' },
        { status: 400 }
      )
    }

    // 5. Get all zone matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('phase', 'zones')
      .returns<Match[]>()

    if (matchesError) throw matchesError

    // 6. Verify all zone matches are completed
    const incompleteMatches = matches?.filter(m => m.status !== 'completed' && m.status !== 'walkover') || []
    if (incompleteMatches.length > 0) {
      return NextResponse.json(
        {
          error: 'All zone matches must be completed before generating playoffs',
          incompleteCount: incompleteMatches.length
        },
        { status: 400 }
      )
    }

    // 7. Get all pairs
    const { data: pairs, error: pairsError } = await supabase
      .from('pairs')
      .select(`
        *,
        player1:players!pairs_player1_id_fkey(*),
        player2:players!pairs_player2_id_fkey(*)
      `)
      .eq('tournament_id', tournamentId)
      .returns<PairWithPlayers[]>()

    if (pairsError) throw pairsError

    // 8. Calculate zone standings
    // matches and pairs are strictly typed now from supabase
    const standingsByZone = calculateZoneStandings(matches || [], pairs || [], zones)

    // 9. Get qualified pairs (top 2 per zone)
    const qualified = getQualifiedPairs(standingsByZone, 2)

    if (qualified.length < 2) {
      return NextResponse.json(
        { error: 'Not enough qualified pairs to create playoffs' },
        { status: 400 }
      )
    }

    // 10. Create full bracket structure
    const bracketMatches = generateFullBracket(qualified)

    // 11. Schedule playoff matches
    const schedulingConfig = {
      startDate: new Date(tournamentWithComplex.start_date || new Date()), // Handle nulls with default/fallback
      endDate: new Date(tournamentWithComplex.end_date || new Date()),
      dailyStartTime: tournamentWithComplex.daily_start_time || '09:00',
      dailyEndTime: tournamentWithComplex.daily_end_time || '21:00',
      matchDurationMinutes: tournamentWithComplex.match_duration_minutes || 60,
      availableCourts: tournamentWithComplex.available_courts || 1,
    }

    // Create match objects for scheduling
    // Casting to any because scheduleMatches expects Match but we are passing partial data
    // Ideally scheduleMatches should accept a broader type
    const matchesToSchedule = bracketMatches.map((bm, index) => ({
      id: `temp-${index}`,
      pair1_id: bm.pair1Id || null,
      pair2_id: bm.pair2Id || null,
      round: bm.round,
      tournament_id: tournamentId,
      phase: 'playoffs',
      status: 'scheduled'
    }))

    const scheduledMatches = scheduleMatches(
      matchesToSchedule as any,
      pairs || [],
      schedulingConfig
    )

    // 12. Create matches in database
    // Iterate to insert (or bulk insert if logic allows, but need mapped bracket_position)
    // Actually we can map directly from bracketMatches since they map 1-to-1 to scheduledMatches if order verified

    // Better reconstruction of insert payload
    const finalMatchesToInsert = bracketMatches.map((bm, index) => {
        // Since we mapped bracketMatches -> matchesToSchedule 1-to-1 using index, we can just use index for scheduledMatches
        const scheduled = scheduledMatches[index]

        return {
            tournament_id: tournamentId,
            phase: 'playoffs',
            round: bm.round,
            bracket_position: bm.bracketPosition,
            pair1_id: bm.pair1Id || null,
            pair2_id: bm.pair2Id || null,
            scheduled_time: scheduled?.scheduledTime ? scheduled.scheduledTime.toISOString() : null,
            court_number: scheduled?.courtNumber || null,
            status: 'scheduled'
        }
    })

    const { data: createdMatches, error: insertError } = await supabase
      .from('matches')
      .insert(finalMatchesToInsert as any) // Cast one last time until insert type is perfectly aligned
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      playoffMatches: createdMatches,
      qualifiedPairs: qualified,
      message: `Playoffs generated successfully with ${createdMatches.length} matches`,
    })

  } catch (error: any) {
    console.error('Error generating playoffs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate playoffs' },
      { status: 500 }
    )
  }
}
