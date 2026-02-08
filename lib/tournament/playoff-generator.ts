// Playoff generation utilities

export interface ZoneStanding {
  pairId: string
  zoneId: string
  zoneName: string
  wins: number
  losses: number
  setsWon: number
  setsLost: number
  gamesWon: number
  gamesLost: number
  setsDiff: number
  gamesDiff: number
}

export interface QualifiedPair {
  pairId: string
  zoneId: string
  zoneName: string
  position: number // 1 = winner, 2 = runner-up
}

export interface BracketMatch {
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'F'
  bracketPosition: number
  pair1Id: string | null
  pair2Id: string | null
  pair1Zone?: string
  pair2Zone?: string
}

/**
 * Calculate standings for all zones
 */
export function calculateZoneStandings(
  matches: any[],
  pairs: any[],
  zones: any[]
): Map<string, ZoneStanding[]> {
  const standingsByZone = new Map<string, ZoneStanding[]>()

  // Initialize standings for each zone
  zones.forEach(zone => {
    const zonePairs = pairs.filter(p => p.zone_id === zone.id)
    const standings: ZoneStanding[] = zonePairs.map(pair => ({
      pairId: pair.id,
      zoneId: zone.id,
      zoneName: zone.name,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      setsDiff: 0,
      gamesDiff: 0,
    }))

    // Calculate stats from matches
    const zoneMatches = matches.filter(m => m.zone_id === zone.id && m.status === 'completed')
    
    zoneMatches.forEach(match => {
      const pair1Standing = standings.find(s => s.pairId === match.pair1_id)
      const pair2Standing = standings.find(s => s.pairId === match.pair2_id)

      if (!pair1Standing || !pair2Standing) return

      // Update sets
      pair1Standing.setsWon += match.pair1_sets
      pair1Standing.setsLost += match.pair2_sets
      pair2Standing.setsWon += match.pair2_sets
      pair2Standing.setsLost += match.pair1_sets

      // Update games
      if (match.pair1_games && match.pair2_games) {
        const p1Games = Array.isArray(match.pair1_games) ? match.pair1_games : JSON.parse(match.pair1_games)
        const p2Games = Array.isArray(match.pair2_games) ? match.pair2_games : JSON.parse(match.pair2_games)
        
        const p1Total = p1Games.reduce((sum: number, g: number) => sum + g, 0)
        const p2Total = p2Games.reduce((sum: number, g: number) => sum + g, 0)
        
        pair1Standing.gamesWon += p1Total
        pair1Standing.gamesLost += p2Total
        pair2Standing.gamesWon += p2Total
        pair2Standing.gamesLost += p1Total
      }

      // Update wins/losses
      if (match.winner_id === match.pair1_id) {
        pair1Standing.wins++
        pair2Standing.losses++
      } else if (match.winner_id === match.pair2_id) {
        pair2Standing.wins++
        pair1Standing.losses++
      }
    })

    // Calculate differentials
    standings.forEach(s => {
      s.setsDiff = s.setsWon - s.setsLost
      s.gamesDiff = s.gamesWon - s.gamesLost
    })

    // Sort by: wins desc, sets diff desc, games diff desc
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff
      return b.gamesDiff - a.gamesDiff
    })

    standingsByZone.set(zone.id, standings)
  })

  return standingsByZone
}

/**
 * Get qualified pairs (top N from each zone)
 */
export function getQualifiedPairs(
  standingsByZone: Map<string, ZoneStanding[]>,
  pairsPerZone: number = 2
): QualifiedPair[] {
  const qualified: QualifiedPair[] = []

  standingsByZone.forEach((standings, zoneId) => {
    standings.slice(0, pairsPerZone).forEach((standing, index) => {
      qualified.push({
        pairId: standing.pairId,
        zoneId: standing.zoneId,
        zoneName: standing.zoneName,
        position: index + 1,
      })
    })
  })

  return qualified
}

/**
 * Determine playoff rounds based on number of qualified pairs
 */
export function determineRounds(totalPairs: number): ('R32' | 'R16' | 'QF' | 'SF' | 'F')[] {
  if (totalPairs <= 2) return ['F']
  if (totalPairs <= 4) return ['SF', 'F']
  if (totalPairs <= 8) return ['QF', 'SF', 'F']
  if (totalPairs <= 16) return ['R16', 'QF', 'SF', 'F']
  return ['R32', 'R16', 'QF', 'SF', 'F']
}

/**
 * Create bracket structure with seeding
 * Seeds zone winners higher than runners-up
 * Avoids same-zone matchups in first round when possible
 */
export function createBracket(qualified: QualifiedPair[]): BracketMatch[] {
  const totalPairs = qualified.length
  const rounds = determineRounds(totalPairs)
  const firstRound = rounds[0]
  
  // Separate winners and runners-up
  const winners = qualified.filter(q => q.position === 1)
  const runnersUp = qualified.filter(q => q.position === 2)
  
  // Shuffle to avoid predictable matchups
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
  
  const shuffledWinners = shuffleArray(winners)
  const shuffledRunners = shuffleArray(runnersUp)
  
  // Create first round matches
  const matches: BracketMatch[] = []
  const matchesNeeded = totalPairs / 2
  
  for (let i = 0; i < matchesNeeded; i++) {
    const pair1 = shuffledWinners[i] || shuffledRunners[i - winners.length]
    const pair2 = shuffledRunners[i] || shuffledWinners[i - runnersUp.length]
    
    matches.push({
      round: firstRound,
      bracketPosition: i + 1,
      pair1Id: pair1?.pairId || null,
      pair2Id: pair2?.pairId || null,
      pair1Zone: pair1?.zoneName,
      pair2Zone: pair2?.zoneName,
    })
  }
  
  return matches
}

/**
 * Advance winner to next playoff round
 * Creates or updates the next round match with the winner
 */
export function getNextRoundMatch(
  currentRound: 'R32' | 'R16' | 'QF' | 'SF' | 'F',
  currentBracketPosition: number
): { nextRound: 'R16' | 'QF' | 'SF' | 'F' | null; nextBracketPosition: number; isTopSlot: boolean } | null {
  // Determine next round
  const roundProgression: Record<string, 'R16' | 'QF' | 'SF' | 'F' | null> = {
    'R32': 'R16',
    'R16': 'QF',
    'QF': 'SF',
    'SF': 'F',
    'F': null, // Final has no next round
  }

  const nextRound = roundProgression[currentRound]
  if (!nextRound) return null // Already at final

  // Calculate next bracket position
  // Two matches feed into one match in the next round
  // Positions 1,2 → 1; Positions 3,4 → 2; etc.
  const nextBracketPosition = Math.ceil(currentBracketPosition / 2)
  
  // Determine if winner goes to top or bottom slot
  // Odd positions (1,3,5...) go to top slot (pair1)
  // Even positions (2,4,6...) go to bottom slot (pair2)
  const isTopSlot = currentBracketPosition % 2 === 1

  return {
    nextRound,
    nextBracketPosition,
    isTopSlot,
  }
}


/**
 * Generate the full bracket tree (all matches from R32/R16... to Final)
 * Returns all matches that need to be created
 */
export function generateFullBracket(qualified: QualifiedPair[]): BracketMatch[] {
  // 1. Create first round matches
  const firstRoundMatches = createBracket(qualified)
  const allMatches: BracketMatch[] = [...firstRoundMatches]
  
  // 2. We need to simulate the progression to generate future matches
  // We can do this by grouping matches by round and creating the next round
  
  let currentRoundMatches = firstRoundMatches
  
  while (currentRoundMatches.length > 0) {
    const nextRoundMatches: BracketMatch[] = []
    const nextRoundMap = new Map<number, BracketMatch>()
    
    // Process each match in the current round to find where its winner goes
    for (const match of currentRoundMatches) {
      const nextRoundInfo = getNextRoundMatch(match.round, match.bracketPosition)
      
      if (!nextRoundInfo) continue // Final match, no next round
      
      const { nextRound, nextBracketPosition } = nextRoundInfo
      
      if (!nextRound) continue // Should not happen given check above, but for types

      // Check if we already created this next round match (since 2 matches feed into 1)
      if (!nextRoundMap.has(nextBracketPosition)) {
        const newMatch: BracketMatch = {
          round: nextRound,
          bracketPosition: nextBracketPosition,
          pair1Id: null, // TBD
          pair2Id: null, // TBD
        }
        nextRoundMap.set(nextBracketPosition, newMatch)
        nextRoundMatches.push(newMatch)
      }
    }
    
    if (nextRoundMatches.length > 0) {
      allMatches.push(...nextRoundMatches)
      currentRoundMatches = nextRoundMatches
    } else {
      break // No more rounds to generate
    }
  }
  
  return allMatches
}
