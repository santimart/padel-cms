import type { Pair, Match, PairWithPlayers } from '@/lib/types'

interface PairStats {
  pairId: string
  points: number
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  setsWon: number
  setsLost: number
  gamesWon: number
  gamesLost: number
  setDifference: number
  gameDifference: number
}

interface Standing extends PairStats {
  position: number
  pair: PairWithPlayers
}

/**
 * Calculate standings for a zone following APA/FAP rules
 * 
 * REGLAS APA/FAP:
 * - Ganado: 2 puntos
 * - Perdido (jugado): 1 punto
 * - W.O. (walkover): 0 puntos
 * 
 * Desempate:
 * 1. Resultado directo (para empates de 2)
 * 2. Diferencia de sets
 * 3. Diferencia de games
 * 4. Games a favor
 * 5. Sorteo
 */
export function calculateZoneStandings(
  pairs: PairWithPlayers[],
  matches: Match[]
): Standing[] {
  // Calculate stats for each pair
  const statsMap = new Map<string, PairStats>()
  
  pairs.forEach(pair => {
    statsMap.set(pair.id, {
      pairId: pair.id,
      points: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      setDifference: 0,
      gameDifference: 0,
    })
  })

  // Process each match
  matches.forEach(match => {
    if (match.status !== 'completed' && match.status !== 'walkover') return
    if (!match.pair1_id || !match.pair2_id) return

    const pair1Stats = statsMap.get(match.pair1_id)
    const pair2Stats = statsMap.get(match.pair2_id)
    
    if (!pair1Stats || !pair2Stats) return

    // Update matches played
    pair1Stats.matchesPlayed++
    pair2Stats.matchesPlayed++

    // Update sets
    pair1Stats.setsWon += match.pair1_sets
    pair1Stats.setsLost += match.pair2_sets
    pair2Stats.setsWon += match.pair2_sets
    pair2Stats.setsLost += match.pair1_sets

    // Update games
    if (match.pair1_games && match.pair2_games) {
      // Cast Json to number[]
      const p1Games = match.pair1_games as number[]
      const p2Games = match.pair2_games as number[]
      
      const pair1TotalGames = p1Games.reduce((sum, g) => sum + g, 0)
      const pair2TotalGames = p2Games.reduce((sum, g) => sum + g, 0)
      
      pair1Stats.gamesWon += pair1TotalGames
      pair1Stats.gamesLost += pair2TotalGames
      pair2Stats.gamesWon += pair2TotalGames
      pair2Stats.gamesLost += pair1TotalGames
    }

    // Update points based on result
    if (match.status === 'walkover') {
      // W.O.: winner gets 2 points, loser gets 0
      if (match.winner_id === match.pair1_id) {
        pair1Stats.points += 2
        pair1Stats.matchesWon++
        pair2Stats.matchesLost++
        // Loser gets 0 points (no point for W.O. loss)
      } else if (match.winner_id === match.pair2_id) {
        pair2Stats.points += 2
        pair2Stats.matchesWon++
        pair1Stats.matchesLost++
        // Loser gets 0 points (no point for W.O. loss)
      }
    } else {
      // Normal match: winner gets 2, loser gets 1
      if (match.winner_id === match.pair1_id) {
        pair1Stats.points += 2
        pair2Stats.points += 1
        pair1Stats.matchesWon++
        pair2Stats.matchesLost++
      } else if (match.winner_id === match.pair2_id) {
        pair2Stats.points += 2
        pair1Stats.points += 1
        pair2Stats.matchesWon++
        pair1Stats.matchesLost++
      }
    }

    // Calculate differences
    pair1Stats.setDifference = pair1Stats.setsWon - pair1Stats.setsLost
    pair1Stats.gameDifference = pair1Stats.gamesWon - pair1Stats.gamesLost
    pair2Stats.setDifference = pair2Stats.setsWon - pair2Stats.setsLost
    pair2Stats.gameDifference = pair2Stats.gamesWon - pair2Stats.gamesLost
  })

  // Convert to standings array
  const standings: Standing[] = pairs.map(pair => ({
    ...statsMap.get(pair.id)!,
    position: 0,
    pair,
  }))

  // Sort and apply tie-breaking
  const sorted = applyTieBreaking(standings, matches)

  // Assign positions
  sorted.forEach((standing, index) => {
    standing.position = index + 1
  })

  return sorted
}

/**
 * Apply tie-breaking rules to sort standings
 */
function applyTieBreaking(standings: Standing[], matches: Match[]): Standing[] {
  return standings.sort((a, b) => {
    // 1. Points (descending)
    if (a.points !== b.points) {
      return b.points - a.points
    }

    // If tied on points, check if it's a 2-way tie for head-to-head
    const headToHead = getHeadToHeadResult(a.pairId, b.pairId, matches)
    if (headToHead !== null) {
      return headToHead // -1 if a won, 1 if b won
    }

    // 2. Set difference (descending)
    if (a.setDifference !== b.setDifference) {
      return b.setDifference - a.setDifference
    }

    // 3. Game difference (descending)
    if (a.gameDifference !== b.gameDifference) {
      return b.gameDifference - a.gameDifference
    }

    // 4. Games in favor (descending)
    if (a.gamesWon !== b.gamesWon) {
      return b.gamesWon - a.gamesWon
    }

    // 5. If still tied, maintain current order (random/draw)
    return 0
  })
}

/**
 * Get head-to-head result between two pairs
 * Returns: -1 if pair1 won, 1 if pair2 won, null if no match or not applicable
 */
function getHeadToHeadResult(
  pair1Id: string,
  pair2Id: string,
  matches: Match[]
): number | null {
  const match = matches.find(
    m =>
      (m.pair1_id === pair1Id && m.pair2_id === pair2Id) ||
      (m.pair1_id === pair2Id && m.pair2_id === pair1Id)
  )

  if (!match || (match.status !== 'completed' && match.status !== 'walkover')) {
    return null
  }

  if (match.winner_id === pair1Id) return -1
  if (match.winner_id === pair2Id) return 1
  return null
}

/**
 * Format standings for display
 */
export function formatStandingsRecord(stats: PairStats): string {
  return `${stats.matchesWon}-${stats.matchesLost}`
}

/**
 * Check if a pair qualifies for playoffs (top 2 in zone)
 */
export function isQualified(position: number, numZones: number): boolean {
  // Normally top 2 qualify
  // Exception: if only 1 zone, top 4 qualify
  if (numZones === 1) {
    return position <= 4
  }
  return position <= 2
}
