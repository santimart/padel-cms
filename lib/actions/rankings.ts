'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'
import { calculatePointsForPosition } from '@/lib/tournament/ranking-calculator'
import { RankingPointsDistribution } from '@/lib/types'

type RankingDefinition = Database['public']['Tables']['ranking_definitions']['Row']

export async function createRankingDefinition(data: Database['public']['Tables']['ranking_definitions']['Insert']) {
  const supabase: any = await createClient()
  
  const { error } = await supabase
    .from('ranking_definitions')
    .insert(data)

  if (error) throw new Error(error.message)
  
  revalidatePath('/rankings')
}

export async function getComplexRankingDefinitions(complexId: string) {
  const supabase: any = await createClient()
  
  const { data, error } = await supabase
    .from('ranking_definitions')
    .select('*')
    .eq('complex_id', complexId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as RankingDefinition[]
}

export async function getRankingDefinition(id: string) {
  const supabase: any = await createClient()
  
  const { data, error } = await supabase
    .from('ranking_definitions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as RankingDefinition
}

export async function getRankingLeaderboard(rankingDefinitionId: string) {
  const supabase: any = await createClient()
  
  const { data, error } = await supabase
    .from('rankings')
    .select(`
      *,
      player:players(
        id,
        first_name,
        last_name,
        photo_url,
        gender
      )
    `)
    .eq('ranking_definition_id', rankingDefinitionId)
    .order('total_points', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function updatePlayerRankings(tournamentId: string) {
  const supabase: any = await createClient()

  // 1. Fetch tournament details
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*, ranking_definition_id, total_points, pairs(*)')
    .eq('id', tournamentId)
    .single()

  if (tournamentError || !tournament) throw new Error('Tournament not found')
  if (!tournament.ranking_definition_id) return // No ranking configured

  // 2. Fetch ranking definition for points distribution
  const { data: rankingDef, error: rankError } = await supabase
    .from('ranking_definitions')
    .select('points_distribution')
    .eq('id', tournament.ranking_definition_id)
    .single()
    
  if (rankError || !rankingDef) throw new Error('Ranking definition not found')
  
  const distribution = rankingDef.points_distribution as RankingPointsDistribution

  // 3. Fetch all matches to determine progress
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .not('round', 'is', null) // Only consider playoff matches for placement logic
    .order('created_at', { ascending: false })

  if (matchesError) throw new Error('Error fetching matches')

  // Calculate results for each pair
  const pairResults = new Map<string, number>() // pairId -> finalPosition
  const pairs = tournament.pairs || []

  // Default everyone to participation (unless they have better result)
  const totalPairs = pairs.length
  // Use a high number for participation tier (e.g. 1000) so any specific round is lower (better)
  pairs.forEach((pair: any) => pairResults.set(pair.id, 1000))

  // Analyze matches to find better results
  matches.forEach((match: any) => {
    if (!match.winner_id || !match.pair1_id || !match.pair2_id) return

    const loserId = match.winner_id === match.pair1_id ? match.pair2_id : match.pair1_id
    const winnerId = match.winner_id

    // If match is Final (F), winner gets 1st, loser 2nd
    if (match.round === 'F') {
      pairResults.set(winnerId, 1)
      pairResults.set(loserId, 2)
    } 
    // SF -> Losers get 3rd/4th (assign 3)
    else if (match.round === 'SF') {
      if (pairResults.get(loserId)! > 3) pairResults.set(loserId, 3)
    }
    // QF -> Losers get 5th-8th (assign 5)
    else if (match.round === 'QF') {
      if (pairResults.get(loserId)! > 5) pairResults.set(loserId, 5)
    }
    // R16 -> Losers get 9th-16th (assign 9)
    else if (match.round === 'R16') {
      if (pairResults.get(loserId)! > 9) pairResults.set(loserId, 9)
    }
    // R32 -> Losers get 17th-32nd (assign 17)
    else if (match.round === 'R32') {
      if (pairResults.get(loserId)! > 17) pairResults.set(loserId, 17)
    }
    // R64 -> Losers get 33rd-64th (assign 33)
    else if (match.round === 'R64') {
      if (pairResults.get(loserId)! > 33) pairResults.set(loserId, 33)
    }
  })

  // 4. Check if this tournament was already processed (idempotency)
  const { data: existingResults } = await supabase
    .from('tournament_results')
    .select('id')
    .eq('tournament_id', tournamentId)
    .limit(1)

  if (existingResults && existingResults.length > 0) {
    // Tournament already processed, skip to avoid double-counting
    console.log('Tournament already processed, skipping ranking update')
    return
  }

  // 5. Update Database
  for (const pair of pairs) {
    const finalPosition = pairResults.get(pair.id)!
    const points = calculatePointsForPosition(finalPosition, totalPairs, distribution, tournament.total_points || 0)

    // Store historical result
    const { error: resultError } = await supabase.from('tournament_results').insert({
      tournament_id: tournamentId,
      pair_id: pair.id,
      final_position: finalPosition === 1000 ? null : finalPosition,
      points_awarded: points
    })

    if (resultError) throw new Error('Error saving tournament results: ' + resultError.message)

    // Update player rankings
    const players = [pair.player1_id, pair.player2_id]
    for (const playerId of players) {
      if (!playerId) continue

      const { data: existingRanking } = await supabase
        .from('rankings')
        .select('*')
        .eq('player_id', playerId)
        .eq('ranking_definition_id', tournament.ranking_definition_id)
        .single()

      if (existingRanking) {
        const { error: updateError } = await supabase
          .from('rankings')
          .update({
            total_points: (existingRanking.total_points || 0) + points,
            tournaments_played: (existingRanking.tournaments_played || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRanking.id)

        if (updateError) throw new Error('Error updating rankings: ' + updateError.message)
      } else {
        const { error: insertError } = await supabase
          .from('rankings')
          .insert({
            player_id: playerId,
            category: tournament.category,
            ranking_definition_id: tournament.ranking_definition_id,
            total_points: points,
            tournaments_played: 1,
            updated_at: new Date().toISOString()
          })
        
        if (insertError) throw new Error('Error inserting rankings: ' + insertError.message)
      }
    }
  }

  revalidatePath(`/rankings/${tournament.ranking_definition_id}`)
}
