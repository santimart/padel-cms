-- Check matches for the tournament
SELECT id, phase, round, bracket_position, status, winner_id, pair1_id, pair2_id 
FROM matches 
WHERE tournament_id = '7c6021ef-4b4f-4e5c-b436-432544d03bbe' 
ORDER BY round, bracket_position;
