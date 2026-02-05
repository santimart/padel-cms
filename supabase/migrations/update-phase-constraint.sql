-- Update phase constraint to allow 'playoffs' value
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_phase_check;
ALTER TABLE matches ADD CONSTRAINT matches_phase_check CHECK (phase IN ('zones', 'playoffs'));
