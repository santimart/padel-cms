export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      complexes: {
        Row: {
          id: string
          name: string
          owner_id: string
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          email: string | null
          dni: string
          first_name: string
          last_name: string
          phone: string | null
          photo_url: string | null
          current_category: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          dni: string
          first_name: string
          last_name: string
          phone?: string | null
          photo_url?: string | null
          current_category?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          dni?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          current_category?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      player_category_history: {
        Row: {
          id: string
          player_id: string
          category: number
          changed_at: string
          reason: string | null
        }
        Insert: {
          id?: string
          player_id: string
          category: number
          changed_at?: string
          reason?: string | null
        }
        Update: {
          id?: string
          player_id?: string
          category?: number
          changed_at?: string
          reason?: string | null
        }
      }
      tournaments: {
        Row: {
          id: string
          complex_id: string
          name: string
          category: number | null
          gender: 'Masculino' | 'Femenino' | 'Mixto' | null
          status: 'registration' | 'zones' | 'playoffs' | 'finished'
          max_pairs: number | null
          start_date: string | null
          end_date: string | null
          daily_start_time: string | null
          daily_end_time: string | null
          match_duration_minutes: number | null
          available_courts: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          complex_id: string
          name: string
          category?: number | null
          gender?: 'Masculino' | 'Femenino' | 'Mixto' | null
          status?: 'registration' | 'zones' | 'playoffs' | 'finished'
          max_pairs?: number | null
          start_date?: string | null
          end_date?: string | null
          daily_start_time?: string | null
          daily_end_time?: string | null
          match_duration_minutes?: number | null
          available_courts?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          complex_id?: string
          name?: string
          category?: number | null
          gender?: 'Masculino' | 'Femenino' | 'Mixto' | null
          status?: 'registration' | 'zones' | 'playoffs' | 'finished'
          max_pairs?: number | null
          start_date?: string | null
          end_date?: string | null
          daily_start_time?: string | null
          daily_end_time?: string | null
          match_duration_minutes?: number | null
          available_courts?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      pairs: {
        Row: {
          id: string
          tournament_id: string
          player1_id: string
          player2_id: string
          zone_id: string | null
          has_bye: boolean
          seed: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          player1_id: string
          player2_id: string
          zone_id?: string | null
          has_bye?: boolean
          seed?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          player1_id?: string
          player2_id?: string
          zone_id?: string | null
          has_bye?: boolean
          seed?: number | null
          created_at?: string
        }
      }
      zones: {
        Row: {
          id: string
          tournament_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          name?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          tournament_id: string
          phase: 'zones' | 'playoffs'
          zone_id: string | null
          pair1_id: string | null
          pair2_id: string | null
          pair1_sets: number
          pair2_sets: number
          pair1_games: Json
          pair2_games: Json
          winner_id: string | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'walkover'
          scheduled_time: string | null
          court_number: number | null
          round: 'R32' | 'R16' | 'QF' | 'SF' | 'F' | null
          bracket_position: number | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          phase: 'zones' | 'playoffs'
          zone_id?: string | null
          pair1_id: string | null
          pair2_id: string | null
          pair1_sets?: number
          pair2_sets?: number
          pair1_games?: Json
          pair2_games?: Json
          winner_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'walkover'
          scheduled_time?: string | null
          court_number?: number | null
          round?: 'R32' | 'R16' | 'QF' | 'SF' | 'F' | null
          bracket_position?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          phase?: 'zone' | 'playoff'
          zone_id?: string | null
          pair1_id?: string | null
          pair2_id?: string | null
          pair1_sets?: number
          pair2_sets?: number
          pair1_games?: Json
          pair2_games?: Json
          winner_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'walkover'
          scheduled_time?: string | null
          court_number?: number | null
          round?: 'R32' | 'R16' | 'QF' | 'SF' | 'F' | null
          bracket_position?: number | null
          completed_at?: string | null
          created_at?: string
        }
      }
      rankings: {
        Row: {
          id: string
          player_id: string
          category: number
          season_year: number
          total_points: number
          tournaments_played: number
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          category: number
          season_year: number
          total_points?: number
          tournaments_played?: number
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          category?: number
          season_year?: number
          total_points?: number
          tournaments_played?: number
          updated_at?: string
        }
      }
      tournament_results: {
        Row: {
          id: string
          tournament_id: string
          pair_id: string
          final_position: number | null
          points_awarded: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          pair_id: string
          final_position?: number | null
          points_awarded?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          pair_id?: string
          final_position?: number | null
          points_awarded?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_complex_for_user: {
        Args: {
          user_id: string
          complex_name: string
          complex_location: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
