-- Script para cargar 12 parejas de prueba a un torneo
-- Usa DNIs únicos basados en timestamp para evitar duplicados
-- Reemplaza el tournament_id abajo con el ID real de tu torneo

-- Primero, crear 24 jugadores (12 parejas x 2 jugadores)
-- NOTA: Cambia el prefijo del DNI (ej: 99999) si necesitas ejecutar múltiples veces
INSERT INTO players (first_name, last_name, dni, current_category) VALUES
-- Pareja 1
('Juan', 'Pérez', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '01'), 5),
('Carlos', 'González', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '02'), 5),
-- Pareja 2
('Diego', 'Rodríguez', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '03'), 6),
('Martín', 'López', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '04'), 6),
-- Pareja 3
('Lucas', 'Martínez', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '05'), 5),
('Mateo', 'García', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '06'), 5),
-- Pareja 4
('Santiago', 'Fernández', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '07'), 7),
('Sebastián', 'Sánchez', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '08'), 7),
-- Pareja 5
('Nicolás', 'Romero', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '09'), 6),
('Joaquín', 'Torres', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '10'), 6),
-- Pareja 6
('Tomás', 'Díaz', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '11'), 5),
('Agustín', 'Ruiz', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '12'), 5),
-- Pareja 7
('Felipe', 'Morales', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '13'), 6),
('Ignacio', 'Castro', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '14'), 6),
-- Pareja 8
('Valentín', 'Ortiz', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '15'), 7),
('Benjamín', 'Silva', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '16'), 7),
-- Pareja 9
('Maximiliano', 'Vargas', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '17'), 5),
('Emiliano', 'Herrera', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '18'), 5),
-- Pareja 10
('Facundo', 'Medina', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '19'), 6),
('Thiago', 'Rojas', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '20'), 6),
-- Pareja 11
('Bruno', 'Navarro', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '21'), 7),
('Lautaro', 'Paz', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '22'), 7),
-- Pareja 12
('Iván', 'Gómez', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '23'), 6),
('Nahuel', 'Ledesma', CONCAT('TEST', EXTRACT(EPOCH FROM NOW())::bigint, '24'), 6);

-- Crear las 12 parejas usando los jugadores recién creados
-- IMPORTANTE: Reemplaza 'YOUR_TOURNAMENT_ID_HERE' con el ID de tu torneo
WITH new_players AS (
  SELECT id, first_name, last_name, 
         ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM players
  ORDER BY created_at DESC
  LIMIT 24
)
INSERT INTO pairs (tournament_id, player1_id, player2_id)
SELECT 
  'f59f574c-9640-4d65-8958-ecf3064b4bd4' as tournament_id,
  p1.id as player1_id,
  p2.id as player2_id
FROM (
  SELECT id, CEILING(rn::numeric / 2) as pair_num
  FROM new_players
  WHERE rn % 2 = 1
) p1
JOIN (
  SELECT id, CEILING(rn::numeric / 2) as pair_num
  FROM new_players
  WHERE rn % 2 = 0
) p2 ON p1.pair_num = p2.pair_num
ORDER BY p1.pair_num;

-- Verificar que se crearon correctamente
SELECT 
  p.id,
  pl1.first_name || ' ' || pl1.last_name as player1,
  pl2.first_name || ' ' || pl2.last_name as player2
FROM pairs p
JOIN players pl1 ON p.player1_id = pl1.id
JOIN players pl2 ON p.player2_id = pl2.id
WHERE p.tournament_id = 'f59f574c-9640-4d65-8958-ecf3064b4bd4'
ORDER BY p.created_at DESC
LIMIT 12;
