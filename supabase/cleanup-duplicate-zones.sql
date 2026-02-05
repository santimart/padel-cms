-- Script para limpiar zonas y resetear torneo
-- Ejecuta esto en Supabase SQL Editor
-- IMPORTANTE: Reemplaza el ID del torneo si es necesario

-- ID del torneo a limpiar
-- Actual: caa08ada-f0ae-427c-9eb0-25383b1e0b75

-- 1. Limpiar las asignaciones de zona en las parejas (PRIMERO)
UPDATE pairs 
SET zone_id = NULL 
WHERE tournament_id = 'caa08ada-f0ae-427c-9eb0-25383b1e0b75';

-- 2. Eliminar los partidos (SEGUNDO)
DELETE FROM matches 
WHERE tournament_id = 'caa08ada-f0ae-427c-9eb0-25383b1e0b75';

-- 3. Eliminar las zonas (TERCERO)
DELETE FROM zones 
WHERE tournament_id = 'caa08ada-f0ae-427c-9eb0-25383b1e0b75';

-- 4. Resetear el estado del torneo a 'registration' (CUARTO)
UPDATE tournaments 
SET status = 'registration' 
WHERE id = 'caa08ada-f0ae-427c-9eb0-25383b1e0b75';

-- Verificar que todo se limpió correctamente
SELECT 
  'Torneo limpiado!' as mensaje,
  (SELECT COUNT(*) FROM zones WHERE tournament_id = 'caa08ada-f0ae-427c-9eb0-25383b1e0b75') as zonas_restantes,
  (SELECT COUNT(*) FROM matches WHERE tournament_id = 'caa08ada-f0ae-427c-9eb0-25383b1e0b75') as partidos_restantes,
  (SELECT status FROM tournaments WHERE id = 'caa08ada-f0ae-427c-9eb0-25383b1e0b75') as estado_torneo;
