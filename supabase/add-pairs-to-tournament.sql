-- Script to add 12 pairs to a tournament
-- Usage: Replace 'YOUR_TOURNAMENT_ID_HERE' with the actual tournament ID
-- Example: WHERE id = '33c6be12-c45c-4eda-aac7-2ad542846588'

-- First, let's get the tournament info to verify
DO $$
DECLARE
  v_tournament_id UUID := 'YOUR_TOURNAMENT_ID_HERE'; -- REPLACE THIS
  v_complex_id UUID;
  v_category INTEGER;
  v_gender TEXT;
  v_player_ids UUID[];
  v_pair_count INTEGER := 0;
BEGIN
  -- Get tournament details
  SELECT complex_id, category, gender 
  INTO v_complex_id, v_category, v_gender
  FROM tournaments 
  WHERE id = v_tournament_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found: %', v_tournament_id;
  END IF;

  RAISE NOTICE 'Tournament found - Category: %, Gender: %', v_category, v_gender;

  -- Get available players from global database
  -- Players are global (shared across all complexes)
  -- Filter by gender and category (±1)
  SELECT ARRAY_AGG(id ORDER BY RANDOM())
  INTO v_player_ids
  FROM players
  WHERE current_category BETWEEN (v_category - 1) AND (v_category + 1)
    AND (v_gender = 'Mixto' OR gender = v_gender)
  LIMIT 24; -- Need 24 players for 12 pairs

  IF ARRAY_LENGTH(v_player_ids, 1) < 24 THEN
    RAISE EXCEPTION 'Not enough players found. Need 24, found %', COALESCE(ARRAY_LENGTH(v_player_ids, 1), 0);
  END IF;

  RAISE NOTICE 'Found % eligible players', ARRAY_LENGTH(v_player_ids, 1);

  -- Create 12 pairs
  FOR i IN 1..12 LOOP
    INSERT INTO pairs (
      tournament_id,
      player1_id,
      player2_id
    ) VALUES (
      v_tournament_id,
      v_player_ids[i * 2 - 1],
      v_player_ids[i * 2]
    );
    v_pair_count := v_pair_count + 1;
  END LOOP;

  RAISE NOTICE 'Successfully created % pairs for tournament %', v_pair_count, v_tournament_id;
END $$;

-- Verify the pairs were created
SELECT 
  p.id,
  p1.first_name || ' ' || p1.last_name AS player1,
  p1.current_category AS cat1,
  p2.first_name || ' ' || p2.last_name AS player2,
  p2.current_category AS cat2
FROM pairs p
JOIN players p1 ON p.player1_id = p1.id
JOIN players p2 ON p.player2_id = p2.id
WHERE p.tournament_id = 'YOUR_TOURNAMENT_ID_HERE' -- REPLACE THIS
ORDER BY p.created_at DESC
LIMIT 12;
