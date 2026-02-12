import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getNextRoundMatch } from '@/lib/tournament/playoff-generator'
import { Match, MatchUpdate, Tournament } from '@/lib/types'

interface MatchWithTournament extends Match {
  tournament: Tournament
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const supabase = await createClient()

    // Get the completed match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, tournament:tournaments(*)')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Checking phase and status safely with typed object (Supabase inference might still return loose types for joins)
    // We cast to our extended interface
    const matchData = match as unknown as MatchWithTournament

    // Only process playoff matches
    if (matchData.phase !== 'playoffs') {
      return NextResponse.json(
        { error: 'Only playoff matches can advance winners' },
        { status: 400 }
      )
    }

    // Ensure match is completed and has a winner
    if (matchData.status !== 'completed' || !matchData.winner_id) {
      return NextResponse.json(
        { error: 'Match must be completed with a winner' },
        { status: 400 }
      )
    }

    // Get next round information
    // Need to cast round because DB type allows null but logic implies it exists for playoff match
    if (!matchData.round || matchData.bracket_position === null) {
         // Should not happen for valid playoff match
         return NextResponse.json({ error: 'Invalid playoff match data' }, { status: 400 })
    }

    const nextRoundInfo = getNextRoundMatch(matchData.round, matchData.bracket_position)
    
    if (!nextRoundInfo) {
      // This was the final - tournament is complete!
      return NextResponse.json({
        success: true,
        message: 'Tournament complete! Winner determined.',
        isFinal: true,
        winnerId: matchData.winner_id,
      })
    }

    const { nextRound, nextBracketPosition, isTopSlot } = nextRoundInfo

    // Check if next round match already exists
    const { data: existingNextMatch } = await (supabase as any).from('matches')
      .select('*')
      .eq('tournament_id', matchData.tournament_id)
      .eq('phase', 'playoffs')
      .eq('round', nextRound as string)
      .eq('bracket_position', nextBracketPosition)
      .single()

    if (existingNextMatch) {
      // Update existing match with the winner
      const updatePayload: MatchUpdate = {}
      if (isTopSlot) {
        updatePayload.pair1_id = matchData.winner_id
      } else {
        updatePayload.pair2_id = matchData.winner_id
      }
      
      const { error: updateError } = await (supabase as any).from('matches')
        .update(updatePayload)
        .eq('id', existingNextMatch.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: `Winner advanced to ${nextRound}`,
        nextMatchId: existingNextMatch.id,
        nextRound,
      })
    } else {
      // Should not happen if full bracket is generated
       console.warn('Next round match not found, but should exist in full bracket mode')
       return NextResponse.json(
        { error: 'Next round match not found' },
        { status: 404 }
      )
    }

  } catch (error: any) {
    console.error('Error advancing winner:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to advance winner' },
      { status: 500 }
    )
  }
}
