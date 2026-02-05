-- Script para resetear playoffs de un torneo
-- Esto permite regenerar los playoffs con la nueva lógica de avance automático
-- Reemplaza 'YOUR_TOURNAMENT_ID_HERE' con el ID real de tu torneo

-- Eliminar todos los partidos de playoffs del torneo
DELETE FROM matches 
WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE' 
  AND phase = 'playoffs';

-- Verificar que se eliminaron
SELECT COUNT(*) as playoff_matches_remaining
FROM matches 
WHERE tournament_id = 'YOUR_TOURNAMENT_ID_HERE' 
  AND phase = 'playoffs';

-- Ahora puedes volver a generar los playoffs desde la UI
-- presionando el botón "Generar Playoffs"
