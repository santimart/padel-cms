import { Database } from './database.types'

export type Player = Database['public']['Tables']['players']['Row']
export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']

export type Tournament = Database['public']['Tables']['tournaments']['Row']
export type TournamentInsert = Database['public']['Tables']['tournaments']['Insert']
export type TournamentUpdate = Database['public']['Tables']['tournaments']['Update']

export type Pair = Database['public']['Tables']['pairs']['Row']
export type PairInsert = Database['public']['Tables']['pairs']['Insert']

export type Match = Database['public']['Tables']['matches']['Row']
export type MatchInsert = Database['public']['Tables']['matches']['Insert']
export type MatchUpdate = Database['public']['Tables']['matches']['Update']

export type Zone = Database['public']['Tables']['zones']['Row']
export type ZoneInsert = Database['public']['Tables']['zones']['Insert']

export type Ranking = Database['public']['Tables']['rankings']['Row']
export type RankingUpdate = Database['public']['Tables']['rankings']['Update']

export type Complex = Database['public']['Tables']['complexes']['Row']
export type ComplexInsert = Database['public']['Tables']['complexes']['Insert']

// Extended types with relations
export interface PairWithPlayers extends Pair {
  player1: Player
  player2: Player
}

export interface MatchWithPairs extends Match {
  pair1: PairWithPlayers
  pair2: PairWithPlayers
}

export interface TournamentWithComplex extends Tournament {
  complex: Complex
}

export interface ZoneWithPairs extends Zone {
  pairs: PairWithPlayers[]
}

export interface PlayoffMatch extends Match {
  pair1: (PairWithPlayers & { zone?: { name: string } }) | null
  pair2: (PairWithPlayers & { zone?: { name: string } }) | null
}

// Zone standings calculation
export interface ZoneStanding {
  pair: PairWithPlayers
  played: number
  won: number
  lost: number
  points: number
  setDifference: number
  gameDifference: number
  gamesFor: number
  gamesAgainst: number
}

// Detailed types for Public View (deeply nested relations)
export interface PairDetailed extends Pair {
  player1: Player
  player2: Player
  zone?: Zone | null
}

export interface MatchDetailed extends Match {
  pair1: PairDetailed | null
  pair2: PairDetailed | null
  zone?: Zone | null
}

// Tournament categories
export const CATEGORIES = [1, 2, 3, 4, 5, 6, 7] as const
export type Category = typeof CATEGORIES[number]

// Gender options
export const GENDERS = ['Masculino', 'Femenino', 'Mixto'] as const
export type Gender = typeof GENDERS[number]

// Tournament status
export const TOURNAMENT_STATUSES = ['registration', 'zones', 'playoffs', 'finished'] as const
export type TournamentStatus = typeof TOURNAMENT_STATUSES[number]

// Match status
export const MATCH_STATUSES = ['scheduled', 'in_progress', 'completed', 'walkover'] as const
export type MatchStatus = typeof MATCH_STATUSES[number]

// Points distribution for rankings (percentages - champion = 100% of tournament base points)
export const RANKING_POINTS = {
  champion: 100,
  finalist: 60,
  semifinalist: 36,
  quarterfinalist: 18,
  round_of_16: 9,
  round_of_32: 5,
  round_of_64: 3,
  participation: 1,
} as const

export type RankingPointsDistribution = {
  champion: number
  finalist: number
  semifinalist: number
  quarterfinalist: number
  round_of_16: number
  round_of_32: number
  round_of_64: number
  participation: number
}

export type RankingDefinition = Database['public']['Tables']['ranking_definitions']['Row'] & {
  points_distribution: RankingPointsDistribution
}
