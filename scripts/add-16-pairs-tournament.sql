-- Script to add 16 pairs to tournament 4d69f000-fd7d-4e7a-8a38-a115fcd52f5f
-- This script selects 32 existing players from the database and creates 16 pairs

-- First, let's get 32 random players that are not already in this tournament
WITH available_players AS (
  SELECT p.id, p.first_name, p.last_name
  FROM players p
  WHERE p.id NOT IN (
    -- Exclude players already in this tournament
    SELECT DISTINCT player1_id FROM pairs WHERE tournament_id = '4d69f000-fd7d-4e7a-8a38-a115fcd52f5f'
    UNION
    SELECT DISTINCT player2_id FROM pairs WHERE tournament_id = '4d69f000-fd7d-4e7a-8a38-a115fcd52f5f'
  )
  ORDER BY RANDOM()
  LIMIT 32
),
numbered_players AS (
  SELECT 
    id,
    first_name,
    last_name,
    ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM available_players
)
-- Create 16 pairs from the 32 players
INSERT INTO pairs (tournament_id, player1_id, player2_id)
SELECT 
  '4d69f000-fd7d-4e7a-8a38-a115fcd52f5f'::uuid as tournament_id,
  p1.id as player1_id,
  p2.id as player2_id
FROM numbered_players p1
JOIN numbered_players p2 ON p2.rn = p1.rn + 1
WHERE p1.rn % 2 = 1  -- Only odd numbers (1, 3, 5, etc.)
ORDER BY p1.rn;

-- Verify the pairs were created
SELECT 
  p.id as pair_id,
  p1.first_name || ' ' || p1.last_name as player1,
  p2.first_name || ' ' || p2.last_name as player2
FROM pairs p
JOIN players p1 ON p.player1_id = p1.id
JOIN players p2 ON p.player2_id = p2.id
WHERE p.tournament_id = '4d69f000-fd7d-4e7a-8a38-a115fcd52f5f'
ORDER BY p.created_at DESC
LIMIT 16;
