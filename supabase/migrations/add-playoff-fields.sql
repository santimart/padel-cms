-- Add playoff-specific fields to matches table
ALTER TABLE matches ADD COLUMN round TEXT CHECK (round IN ('R32', 'R16', 'QF', 'SF', 'F'));
ALTER TABLE matches ADD COLUMN bracket_position INTEGER;

COMMENT ON COLUMN matches.round IS 'Playoff round: R32 (Round of 32), R16 (Round of 16), QF (Quarterfinals), SF (Semifinals), F (Final)';
COMMENT ON COLUMN matches.bracket_position IS 'Position in the bracket for visual ordering (1, 2, 3, etc.)';
