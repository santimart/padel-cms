import { RANKING_POINTS, RankingPointsDistribution } from '@/lib/types'

/**
 * Calculate points awarded based on final position in tournament
 */
export function calculatePointsForPosition(
  finalPosition: number,
  totalPairs: number,
  distribution: RankingPointsDistribution = RANKING_POINTS,
  tournamentPoints: number = 0
): number {
  const calculate = (percentage: number) => Math.round((percentage / 100) * tournamentPoints)

  switch (finalPosition) {
    case 1: // Champion
      return calculate(distribution.champion)
    case 2: // Finalist
      return calculate(distribution.finalist)
    case 3: // Semi-finalist (if lost in semis)
    case 4:
      return calculate(distribution.semifinalist)
    case 5: // Quarter-finalist
    case 6:
    case 7:
    case 8:
      return calculate(distribution.quarterfinalist)
    default:
      if (finalPosition <= 16) return calculate(distribution.round_of_16)
      if (finalPosition <= 32) return calculate(distribution.round_of_32)
      if (finalPosition <= 64) return calculate(distribution.round_of_64)
      return calculate(distribution.participation)
  }
}

/**
 * Get current season year
 */
export function getCurrentSeason(): number {
  return new Date().getFullYear()
}

/**
 * Update player ranking after tournament completion
 */
export interface RankingUpdate {
  playerId: string
  category: number
  pointsToAdd: number
  seasonYear: number
}

export function prepareRankingUpdates(
  tournamentResults: Array<{
    pairId: string
    player1Id: string
    player2Id: string
    finalPosition: number
  }>,
  category: number,
  totalPairs: number,
  tournamentPoints: number,
  distribution?: RankingPointsDistribution
): RankingUpdate[] {
  const updates: RankingUpdate[] = []
  const seasonYear = getCurrentSeason()

  tournamentResults.forEach((result) => {
    const points = calculatePointsForPosition(result.finalPosition, totalPairs, distribution, tournamentPoints)

    // Add update for both players in the pair
    updates.push({
      playerId: result.player1Id,
      category,
      pointsToAdd: points,
      seasonYear,
    })

    updates.push({
      playerId: result.player2Id,
      category,
      pointsToAdd: points,
      seasonYear,
    })
  })

  return updates
}

/**
 * Format ranking position with ordinal suffix
 */
export function formatRankingPosition(position: number): string {
  const suffixes = ['°', '°', '°', '°']
  const lastDigit = position % 10
  const lastTwoDigits = position % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${position}°`
  }

  return `${position}${suffixes[lastDigit] || '°'}`
}

/**
 * Get category name in Spanish
 */
export function getCategoryName(category: number): string {
  const names = [
    '1ra Categoría',
    '2da Categoría',
    '3ra Categoría',
    '4ta Categoría',
    '5ta Categoría',
    '6ta Categoría',
    '7ma Categoría',
  ]

  return names[category - 1] || `Categoría ${category}`
}
