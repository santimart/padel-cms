-- Script rápido para resetear el torneo específico
-- ID del torneo: f59f574c-9640-4d65-8958-ecf3064b4bd4

-- PASO 1: Eliminar todos los partidos
DELETE FROM matches WHERE tournament_id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4';

-- PASO 2: Eliminar todas las parejas del torneo
DELETE FROM pairs WHERE tournament_id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4';

-- PASO 3: Eliminar todas las zonas del torneo
DELETE FROM zones WHERE tournament_id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4';

-- PASO 4: Resetear el estado del torneo a 'registration'
UPDATE tournaments 
SET status = 'registration' 
WHERE id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4';

-- Verificar que todo se limpió correctamente
SELECT 
  (SELECT COUNT(*) FROM matches WHERE tournament_id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4') as matches_count,
  (SELECT COUNT(*) FROM pairs WHERE tournament_id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4') as pairs_count,
  (SELECT COUNT(*) FROM zones WHERE tournament_id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4') as zones_count,
  (SELECT status FROM tournaments WHERE id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4') as tournament_status;
