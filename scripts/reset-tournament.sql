-- Script completo para resetear un torneo y regenerarlo desde cero
-- Útil cuando quieres probar el flujo completo: parejas → zonas → partidos → playoffs
-- Reemplaza 'YOUR_TOURNAMENT_ID_HERE' con el ID real de tu torneo

-- PASO 1: Eliminar todos los partidos (zones y playoffs)
DELETE FROM matches WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE';

-- PASO 2: Eliminar todas las parejas del torneo
DELETE FROM pairs WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE';

-- PASO 3: Eliminar todas las zonas del torneo
DELETE FROM zones WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE';

-- PASO 4: Resetear el estado del torneo a 'registration'
UPDATE tournaments 
SET status = 'registration' 
WHERE id = 'YOUR_TOURNAMENT_ID_HERE';

-- Verificar que todo se limpió correctamente
SELECT 
  (SELECT COUNT(*) FROM matches WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE') as matches_count,
  (SELECT COUNT(*) FROM pairs WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE') as pairs_count,
  (SELECT COUNT(*) FROM zones WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE') as zones_count,
  (SELECT status FROM tournaments WHERE id = 'YOUR_TOURNAMENT_ID_HERE') as tournament_status;

-- NOTA: Los jugadores NO se eliminan porque pueden estar en otros torneos
-- Si quieres eliminar también los jugadores, ejecuta:
-- DELETE FROM players WHERE id IN (
--   SELECT DISTINCT player1_id FROM pairs WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE'
--   UNION
--   SELECT DISTINCT player2_id FROM pairs WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE'
-- );

-- Ahora puedes:
-- 1. Ejecutar add-12-pairs.sql para agregar parejas
-- 2. Generar zonas desde la UI
-- 3. Completar partidos de zona
-- 4. Generar playoffs (con la nueva lógica de avance automático)
