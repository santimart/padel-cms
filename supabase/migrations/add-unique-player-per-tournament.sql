-- Migration: Add constraint to prevent duplicate player registrations in tournaments
-- Run this in Supabase SQL Editor

-- Step 1: Drop the trigger and function if they exist (for clean re-run)
DROP TRIGGER IF EXISTS enforce_one_pair_per_player_per_tournament ON pairs;
DROP FUNCTION IF EXISTS check_player_already_in_tournament();

-- Step 2: Add unique constraint to prevent exact duplicate pairs
ALTER TABLE pairs 
ADD CONSTRAINT unique_pair_per_tournament 
UNIQUE (tournament_id, player1_id, player2_id);

-- Step 3: Create function to check if a player is already registered
CREATE OR REPLACE FUNCTION check_player_already_in_tournament()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if player1 is already in this tournament (as player1 or player2)
  IF EXISTS (
    SELECT 1 FROM pairs 
    WHERE tournament_id = NEW.tournament_id 
    AND (player1_id = NEW.player1_id OR player2_id = NEW.player1_id)
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'El jugador % ya está inscrito en este torneo', NEW.player1_id;
  END IF;

  -- Check if player2 is already in this tournament (as player1 or player2)
  IF EXISTS (
    SELECT 1 FROM pairs 
    WHERE tournament_id = NEW.tournament_id 
    AND (player1_id = NEW.player2_id OR player2_id = NEW.player2_id)
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'El jugador % ya está inscrito en este torneo', NEW.player2_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to enforce the check
CREATE TRIGGER enforce_one_pair_per_player_per_tournament
  BEFORE INSERT OR UPDATE ON pairs
  FOR EACH ROW
  EXECUTE FUNCTION check_player_already_in_tournament();

-- Step 5: Verify the constraint is working (optional test)
-- This should succeed:
-- INSERT INTO pairs (tournament_id, player1_id, player2_id) VALUES (...);

-- This should fail with error "El jugador ... ya está inscrito en este torneo":
-- INSERT INTO pairs (tournament_id, player1_id, player2_id) VALUES (same_tournament, same_player, different_partner);

SELECT 'Migration completed successfully!' as status;
