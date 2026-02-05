import { RANKING_POINTS } from '@/lib/types'

/**
 * Calculate points awarded based on final position in tournament
 */
export function calculatePointsForPosition(
  finalPosition: number,
  totalPairs: number
): number {
  // Determine tournament size category
  const isMajor = totalPairs >= 16

  switch (finalPosition) {
    case 1: // Champion
      return RANKING_POINTS.champion
    case 2: // Finalist
      return RANKING_POINTS.finalist
    case 3: // Semi-finalist (if lost in semis)
    case 4:
      return RANKING_POINTS.semifinalist
    case 5: // Quarter-finalist
    case 6:
    case 7:
    case 8:
      return RANKING_POINTS.quarterfinalist
    default:
      // Participated in zone phase only
      return RANKING_POINTS.zoneOnly
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
  totalPairs: number
): RankingUpdate[] {
  const updates: RankingUpdate[] = []
  const seasonYear = getCurrentSeason()

  tournamentResults.forEach((result) => {
    const points = calculatePointsForPosition(result.finalPosition, totalPairs)

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
