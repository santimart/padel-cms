-- Add court_number field to matches table
ALTER TABLE matches ADD COLUMN court_number INTEGER;

-- Add comment
COMMENT ON COLUMN matches.court_number IS 'Court number assigned for this match (1, 2, 3, etc.)';
