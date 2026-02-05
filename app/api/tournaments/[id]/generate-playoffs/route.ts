import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { 
  calculateZoneStandings, 
  getQualifiedPairs, 
  createBracket 
} from '@/lib/tournament/playoff-generator'
import { scheduleMatches } from '@/lib/tournament/match-scheduler'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const supabase = await createClient()

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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

    if (tournament.complex.owner_id !== user.id) {
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

    if (matchesError) throw matchesError

    // 6. Verify all zone matches are completed
    const incompleteMatches = matches?.filter(m => m.status !== 'completed') || []
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

    if (pairsError) throw pairsError

    // 8. Calculate zone standings
    const standingsByZone = calculateZoneStandings(matches || [], pairs || [], zones)

    // 9. Get qualified pairs (top 2 per zone)
    const qualified = getQualifiedPairs(standingsByZone, 2)

    if (qualified.length < 2) {
      return NextResponse.json(
        { error: 'Not enough qualified pairs to create playoffs' },
        { status: 400 }
      )
    }

    // 10. Create bracket structure
    const bracketMatches = createBracket(qualified)

    // 11. Schedule playoff matches
    const schedulingConfig = {
      tournamentStartDate: new Date(tournament.start_date),
      tournamentEndDate: new Date(tournament.end_date),
      dailyStartTime: tournament.daily_start_time || '09:00',
      dailyEndTime: tournament.daily_end_time || '21:00',
      matchDurationMinutes: tournament.match_duration_minutes || 60,
      availableCourts: tournament.available_courts || 1,
    }

    // Create match objects for scheduling
    const matchesToSchedule = bracketMatches.map((bm, index) => ({
      id: `temp-${index}`,
      pair1_id: bm.pair1Id || '',
      pair2_id: bm.pair2Id || '',
    }))

    const scheduledMatches = scheduleMatches(
      matchesToSchedule as any,
      pairs || [],
      schedulingConfig
    )

    // 12. Insert playoff matches into database
    const playoffMatchesData = bracketMatches.map((bm, index) => {
      const scheduled = scheduledMatches.find(sm => sm.matchId === `temp-${index}`)
      
      return {
        tournament_id: tournamentId,
        phase: 'playoffs',
        round: bm.round,
        bracket_position: bm.bracketPosition,
        pair1_id: bm.pair1Id,
        pair2_id: bm.pair2Id,
        scheduled_time: scheduled?.scheduledTime?.toISOString() || null,
        court_number: scheduled?.courtNumber || null,
        status: 'scheduled',
      }
    })

    const { data: createdMatches, error: createError } = await supabase
      .from('matches')
      .insert(playoffMatchesData)
      .select()

    if (createError) throw createError

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
