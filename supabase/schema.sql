-- ReRank Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Complexes (Padel Clubs)
CREATE TABLE complexes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players (Global database shared across all clubs)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  dni TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  gender TEXT CHECK (gender IN ('Masculino', 'Femenino')),
  current_category INTEGER CHECK (current_category BETWEEN 1 AND 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_dni ON players(dni);
CREATE INDEX idx_players_email ON players(email);

-- Player Category History
CREATE TABLE player_category_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  category INTEGER NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

-- Tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complex_id UUID REFERENCES complexes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category INTEGER CHECK (category BETWEEN 1 AND 7),
  gender TEXT CHECK (gender IN ('Masculino', 'Femenino', 'Mixto')),
  status TEXT CHECK (status IN ('registration', 'zones', 'playoffs', 'finished')) DEFAULT 'registration',
  max_pairs INTEGER,
  start_date DATE,
  end_date DATE,
  daily_start_time TIME DEFAULT '09:00',
  daily_end_time TIME DEFAULT '21:00',
  match_duration_minutes INTEGER DEFAULT 60,
  available_courts INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_complex ON tournaments(complex_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);

-- Zones (Groups for round-robin phase)
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pairs (Player pairs registered in tournaments)
CREATE TABLE pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player1_id UUID REFERENCES players(id),
  player2_id UUID REFERENCES players(id),
  zone_id UUID REFERENCES zones(id),
  has_bye BOOLEAN DEFAULT FALSE,
  seed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player1_id, player2_id)
);

CREATE INDEX idx_pairs_tournament ON pairs(tournament_id);
CREATE INDEX idx_pairs_zone ON pairs(zone_id);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  phase TEXT CHECK (phase IN ('zones', 'playoffs')) DEFAULT 'zones',
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  pair1_id UUID REFERENCES pairs(id) ON DELETE CASCADE,
  pair2_id UUID REFERENCES pairs(id) ON DELETE CASCADE,
  match_number INTEGER,
  pair1_sets INTEGER DEFAULT 0,
  pair2_sets INTEGER DEFAULT 0,
  pair1_games JSONB,
  pair2_games JSONB,
  winner_id UUID REFERENCES pairs(id),
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'walkover')) DEFAULT 'scheduled',
  scheduled_time TIMESTAMPTZ,
  court_number INTEGER,
  round TEXT CHECK (round IN ('R32', 'R16', 'QF', 'SF', 'F')),
  bracket_position INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_zone ON matches(zone_id);
CREATE INDEX idx_matches_match_number ON matches(match_number);

-- Rankings (Global annual ranking per category)
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  category INTEGER NOT NULL,
  season_year INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  tournaments_played INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, category, season_year)
);

CREATE INDEX idx_rankings_season ON rankings(season_year, category, total_points DESC);

-- Tournament Results
CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  pair_id UUID REFERENCES pairs(id),
  final_position INTEGER,
  points_awarded INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_category_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- Complexes: Owners can manage their own complexes
CREATE POLICY "Users can view all complexes" ON complexes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert complexes" ON complexes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own complex" ON complexes FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own complex" ON complexes FOR DELETE USING (auth.uid() = owner_id);

-- Players: Global read access, authenticated users can create/update
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create players" ON players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update players" ON players FOR UPDATE USING (auth.role() = 'authenticated');

-- Player Category History: Read-only for all, write for authenticated
CREATE POLICY "Anyone can view category history" ON player_category_history FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert category history" ON player_category_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Tournaments: Public read, complex owners can manage their own
CREATE POLICY "Anyone can view tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Complex owners can create tournaments" ON tournaments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM complexes WHERE id = complex_id AND owner_id = auth.uid()
  )
);
CREATE POLICY "Complex owners can update their tournaments" ON tournaments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM complexes WHERE id = complex_id AND owner_id = auth.uid()
  )
);
CREATE POLICY "Complex owners can delete their tournaments" ON tournaments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM complexes WHERE id = complex_id AND owner_id = auth.uid()
  )
);

-- Zones: Public read, complex owners can manage
CREATE POLICY "Anyone can view zones" ON zones FOR SELECT USING (true);
CREATE POLICY "Tournament owners can manage zones" ON zones FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN complexes c ON t.complex_id = c.id
    WHERE t.id = tournament_id AND c.owner_id = auth.uid()
  )
);

-- Pairs: Public read, authenticated users can register
CREATE POLICY "Anyone can view pairs" ON pairs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can register pairs" ON pairs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tournament owners can manage pairs" ON pairs FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN complexes c ON t.complex_id = c.id
    WHERE t.id = tournament_id AND c.owner_id = auth.uid()
  )
);

-- Matches: Public read, tournament owners can manage
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Tournament owners can manage matches" ON matches FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN complexes c ON t.complex_id = c.id
    WHERE t.id = tournament_id AND c.owner_id = auth.uid()
  )
);

-- Rankings: Public read, system updates
CREATE POLICY "Anyone can view rankings" ON rankings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update rankings" ON rankings FOR ALL USING (auth.role() = 'authenticated');

-- Tournament Results: Public read, tournament owners can manage
CREATE POLICY "Anyone can view tournament results" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "Tournament owners can manage results" ON tournament_results FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN complexes c ON t.complex_id = c.id
    WHERE t.id = tournament_id AND c.owner_id = auth.uid()
  )
);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_complexes_updated_at BEFORE UPDATE ON complexes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create complex for new user (called after signup)
CREATE OR REPLACE FUNCTION create_complex_for_user(
  user_id UUID,
  complex_name TEXT,
  complex_location TEXT
)
RETURNS UUID AS $$
DECLARE
  new_complex_id UUID;
BEGIN
  INSERT INTO complexes (name, location, owner_id)
  VALUES (complex_name, complex_location, user_id)
  RETURNING id INTO new_complex_id;
  
  RETURN new_complex_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_complex_for_user TO authenticated;
