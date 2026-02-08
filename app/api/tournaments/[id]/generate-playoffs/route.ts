import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateZoneStandings, getQualifiedPairs, generateFullBracket, BracketMatch } from '@/lib/tournament/playoff-generator'
import { scheduleMatches } from '@/lib/tournament/match-scheduler'
import { TournamentWithComplex, PairWithPlayers, Match, PlayoffMatch } from '@/lib/types'

// Helper to validate and fetch tournament data for playoffs
async function validateAndFetchPlayoffData(tournamentId: string) {
  const supabase = await createClient()
  
  // 1. Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Get tournament and verify ownership
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select(`*, complex:complexes(id, owner_id)`)
    .eq('id', tournamentId)
    .single()

  if (tournamentError || !tournament) throw new Error('Tournament not found')

  const tournamentWithComplex = tournament as unknown as TournamentWithComplex
  if (tournamentWithComplex.complex.owner_id !== user.id) throw new Error('No tienes permiso para modificar este torneo')

  // 3. Check if playoffs already generated (only for POST usually, but good to know)
  const { data: existingPlayoffs } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('phase', 'playoffs')
    .limit(1)

  const playoffsExist = (existingPlayoffs?.length || 0) > 0

  // 4. Get all zones
  const { data: zones, error: zonesError } = await supabase
    .from('zones')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('name')

  if (zonesError || !zones || zones.length === 0) throw new Error('No zones found')

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
  if (incompleteMatches.length > 0) throw new Error('All zone matches must be completed before generating playoffs')

  // 7. Get all pairs
  const { data: pairs, error: pairsError } = await supabase
    .from('pairs')
    .select(`*, player1:players!pairs_player1_id_fkey(*), player2:players!pairs_player2_id_fkey(*)`)
    .eq('tournament_id', tournamentId)
    .returns<PairWithPlayers[]>()

  if (pairsError) throw pairsError

  return { supabase, tournament: tournamentWithComplex, zones, matches, pairs, playoffsExist, user }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const { tournament, zones, matches, pairs } = await validateAndFetchPlayoffData(tournamentId)

    // Calculate qualified pairs
    const standingsByZone = calculateZoneStandings(matches || [], pairs || [], zones)
    const qualified = getQualifiedPairs(standingsByZone, 2)

    if (qualified.length < 2) {
      return NextResponse.json({ error: 'Not enough qualified pairs' }, { status: 400 })
    }

    // Generate proposal
    const bracketMatches = generateFullBracket(qualified)

    return NextResponse.json({
      success: true,
      proposal: bracketMatches,
      qualifiedPairs: qualified
    })

  } catch (error: any) {
    console.error('Error getting playoff proposal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get proposal' },
      { status: error.message === 'Unauthorized' ? 401 : 403 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const { supabase, tournament, zones, matches, pairs, playoffsExist } = await validateAndFetchPlayoffData(tournamentId)

    if (playoffsExist) {
        return NextResponse.json({ error: 'Playoffs already generated' }, { status: 400 })
    }

    // Check for custom bracket in body
    let bracketMatches: BracketMatch[] = []
    
    // Parse body safely
    try {
        const body = await request.json()
        if (body.bracket) {
            bracketMatches = body.bracket
        }
    } catch (e) {
        // No body or invalid json, ignore
    }

    // If no custom bracket, generate default
    if (bracketMatches.length === 0) {
        const standingsByZone = calculateZoneStandings(matches || [], pairs || [], zones)
        const qualified = getQualifiedPairs(standingsByZone, 2)

        if (qualified.length < 2) {
             return NextResponse.json({ error: 'Not enough qualified pairs' }, { status: 400 })
        }
        bracketMatches = generateFullBracket(qualified)
    }

    // Schedule matches
    const schedulingConfig = {
      startDate: new Date(tournament.start_date || new Date()), 
      endDate: new Date(tournament.end_date || new Date()),
      dailyStartTime: tournament.daily_start_time || '09:00',
      dailyEndTime: tournament.daily_end_time || '21:00',
      matchDurationMinutes: tournament.match_duration_minutes || 60,
      availableCourts: tournament.available_courts || 1,
    }

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

    const finalMatchesToInsert = bracketMatches.map((bm, index) => {
        // Map back scheduled info to bracket matches. 
        // Note: If custom bracket is passed, ensure it is ordered or matched correctly. 
        // scheduleMatches preserves order, so index mapping is safe if input array is same.
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
      .insert(finalMatchesToInsert as any) 
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      playoffMatches: createdMatches,
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
