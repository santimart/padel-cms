import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getNextRoundMatch } from '@/lib/tournament/playoff-generator'

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

    // Only process playoff matches
    if (match.phase !== 'playoffs') {
      return NextResponse.json(
        { error: 'Only playoff matches can advance winners' },
        { status: 400 }
      )
    }

    // Ensure match is completed and has a winner
    if (match.status !== 'completed' || !match.winner_id) {
      return NextResponse.json(
        { error: 'Match must be completed with a winner' },
        { status: 400 }
      )
    }

    // Get next round information
    const nextRoundInfo = getNextRoundMatch(match.round, match.bracket_position)
    
    if (!nextRoundInfo) {
      // This was the final - tournament is complete!
      return NextResponse.json({
        success: true,
        message: 'Tournament complete! Winner determined.',
        isFinal: true,
        winnerId: match.winner_id,
      })
    }

    const { nextRound, nextBracketPosition, isTopSlot } = nextRoundInfo

    // Check if next round match already exists
    const { data: existingNextMatch } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', match.tournament_id)
      .eq('phase', 'playoffs')
      .eq('round', nextRound)
      .eq('bracket_position', nextBracketPosition)
      .single()

    if (existingNextMatch) {
      // Update existing match with the winner
      const updateField = isTopSlot ? 'pair1_id' : 'pair2_id'
      
      const { error: updateError } = await supabase
        .from('matches')
        .update({ [updateField]: match.winner_id })
        .eq('id', existingNextMatch.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: `Winner advanced to ${nextRound}`,
        nextMatchId: existingNextMatch.id,
        nextRound,
      })
    } else {
      // Create new next round match
      const newMatch = {
        tournament_id: match.tournament_id,
        phase: 'playoffs',
        round: nextRound,
        bracket_position: nextBracketPosition,
        pair1_id: isTopSlot ? match.winner_id : null,
        pair2_id: isTopSlot ? null : match.winner_id,
        status: 'scheduled',
      }

      const { data: createdMatch, error: createError } = await supabase
        .from('matches')
        .insert(newMatch)
        .select()
        .single()

      if (createError) throw createError

      return NextResponse.json({
        success: true,
        message: `Winner advanced to ${nextRound}`,
        nextMatchId: createdMatch.id,
        nextRound,
        created: true,
      })
    }

  } catch (error: any) {
    console.error('Error advancing winner:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to advance winner' },
      { status: 500 }
    )
  }
}
