-- Add gender field to players table
ALTER TABLE players ADD COLUMN gender TEXT CHECK (gender IN ('Masculino', 'Femenino'));

-- Update existing players (you may want to set this manually based on your data)
-- For now, leaving NULL to be filled manually
COMMENT ON COLUMN players.gender IS 'Gender of the player: Masculino or Femenino';
