import { Match, PairWithPlayers, ZoneStanding } from '@/lib/types'

/**
 * Calculate zone standings based on APA/FAP rules
 * 
 * Scoring:
 * - 2 points per match won
 * - 1 point per match lost
 * - 0 points for walkover (W.O.)
 * 
 * Tie-breaking criteria (in order):
 * 1. Total points
 * 2. Set difference
 * 3. Game difference
 * 4. Games in favor
 * 5. Head-to-head result
 */
export function calculateZoneStandings(
  pairs: PairWithPlayers[],
  matches: Match[]
): ZoneStanding[] {
  const standings: Map<string, ZoneStanding> = new Map()

  // Initialize standings for each pair
  pairs.forEach((pair) => {
    standings.set(pair.id, {
      pair,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      setDifference: 0,
      gameDifference: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    })
  })

  // Process each completed match
  matches
    .filter((match) => match.status === 'completed')
    .forEach((match) => {
      if (!match.pair1_id || !match.pair2_id) return
      
      const pair1Standing = standings.get(match.pair1_id)
      const pair2Standing = standings.get(match.pair2_id)

      if (!pair1Standing || !pair2Standing) return

      // Calculate games for each set
      const pair1Games = (match.pair1_games as number[]) || []
      const pair2Games = (match.pair2_games as number[]) || []

      const totalPair1Games = pair1Games.reduce((sum, g) => sum + g, 0)
      const totalPair2Games = pair2Games.reduce((sum, g) => sum + g, 0)

      // Update played count
      pair1Standing.played++
      pair2Standing.played++

      // Update wins/losses and points
      if (match.winner_id === match.pair1_id) {
        pair1Standing.won++
        pair1Standing.points += 2
        pair2Standing.lost++
        pair2Standing.points += 1
      } else if (match.winner_id === match.pair2_id) {
        pair2Standing.won++
        pair2Standing.points += 2
        pair1Standing.lost++
        pair1Standing.points += 1
      }

      // Update set differences
      pair1Standing.setDifference += match.pair1_sets - match.pair2_sets
      pair2Standing.setDifference += match.pair2_sets - match.pair1_sets

      // Update game statistics
      pair1Standing.gamesFor += totalPair1Games
      pair1Standing.gamesAgainst += totalPair2Games
      pair1Standing.gameDifference += totalPair1Games - totalPair2Games

      pair2Standing.gamesFor += totalPair2Games
      pair2Standing.gamesAgainst += totalPair1Games
      pair2Standing.gameDifference += totalPair2Games - totalPair1Games
    })

  // Convert to array and sort by criteria
  const standingsArray = Array.from(standings.values())

  return standingsArray.sort((a, b) => {
    // 1. Total points
    if (b.points !== a.points) return b.points - a.points

    // 2. Set difference
    if (b.setDifference !== a.setDifference) {
      return b.setDifference - a.setDifference
    }

    // 3. Game difference
    if (b.gameDifference !== a.gameDifference) {
      return b.gameDifference - a.gameDifference
    }

    // 4. Games in favor
    if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor

    // 5. Head-to-head (would need additional logic to check specific match)
    return 0
  })
}

/**
 * Get qualified pairs from zone standings
 * Typically top 2 pairs from each zone
 */
export function getQualifiedPairs(
  standings: ZoneStanding[],
  qualifyCount: number = 2
): PairWithPlayers[] {
  return standings.slice(0, qualifyCount).map((s) => s.pair)
}

/**
 * Generate automatic zones (groups) for a tournament
 * Prefers groups of 3, uses groups of 4 when necessary
 */
export function generateZones(
  totalPairs: number,
  preferredZoneSize: number = 3
): { zoneCount: number; zoneSizes: number[] } {
  const zoneSizes: number[] = []

  if (totalPairs < preferredZoneSize) {
    return { zoneCount: 1, zoneSizes: [totalPairs] }
  }

  // Calculate optimal distribution
  let remaining = totalPairs
  let zoneCount = Math.floor(totalPairs / preferredZoneSize)

  // Adjust if remainder is 1 (can't have a zone with 1 pair)
  const remainder = totalPairs % preferredZoneSize
  if (remainder === 1) {
    zoneCount--
  }

  // Distribute pairs across zones
  for (let i = 0; i < zoneCount; i++) {
    zoneSizes.push(preferredZoneSize)
    remaining -= preferredZoneSize
  }

  // Distribute remaining pairs
  if (remaining > 0) {
    if (remaining === 1) {
      // Add to last zone to make it 4
      zoneSizes[zoneSizes.length - 1]++
    } else {
      // Create new zone with remaining pairs
      zoneSizes.push(remaining)
    }
  }

  return { zoneCount: zoneSizes.length, zoneSizes }
}

/**
 * Calculate number of byes needed for playoff bracket
 * Playoff bracket must be power of 2 (4, 8, 16, 32)
 */
export function calculatePlayoffByes(qualifiedPairs: number): {
  totalSlots: number
  byes: number
} {
  // Find next power of 2
  const powers = [4, 8, 16, 32, 64]
  const totalSlots = powers.find((p) => p >= qualifiedPairs) || 4

  return {
    totalSlots,
    byes: totalSlots - qualifiedPairs,
  }
}

/**
 * Generate playoff bracket structure
 * Returns array of match pairings with bye indicators
 */
export interface PlayoffMatch {
  round: number
  matchNumber: number
  pair1Index: number | null // null indicates bye
  pair2Index: number | null
}

export function generatePlayoffBracket(
  qualifiedPairs: number
): PlayoffMatch[] {
  const { totalSlots, byes } = calculatePlayoffByes(qualifiedPairs)
  const matches: PlayoffMatch[] = []

  // First round
  const firstRoundMatches = totalSlots / 2
  let pairIndex = 0

  for (let i = 0; i < firstRoundMatches; i++) {
    const match: PlayoffMatch = {
      round: 1,
      matchNumber: i + 1,
      pair1Index: null,
      pair2Index: null,
    }

    // Assign pairs, leaving byes at the top
    if (i < byes) {
      // This match has a bye
      match.pair1Index = pairIndex++
      match.pair2Index = null // Bye
    } else {
      match.pair1Index = pairIndex++
      match.pair2Index = pairIndex++
    }

    matches.push(match)
  }

  return matches
}
