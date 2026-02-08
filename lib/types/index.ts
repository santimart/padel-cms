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

// Points distribution for rankings
export const RANKING_POINTS = {
  champion: 1000,
  finalist: 800,
  semifinalist: 600,
  quarterfinalist: 400,
  zoneOnly: 200,
} as const
