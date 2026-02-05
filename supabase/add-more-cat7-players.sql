-- Script para agregar más jugadores masculinos de categoría 6-7
-- Ejecuta este script en el SQL Editor de Supabase para tener suficientes jugadores

INSERT INTO players (dni, first_name, last_name, email, phone, gender, current_category) VALUES
-- Más jugadores categoría 6
('37123456', 'Alexis', 'Peralta', 'alexis.peralta@email.com', '+54 9 11 1234-5644', 'Masculino', 6),
('37234567', 'Bruno', 'Cáceres', 'bruno.caceres@email.com', '+54 9 11 1234-5645', 'Masculino', 6),
('37345678', 'Cristian', 'Arias', 'cristian.arias@email.com', '+54 9 11 1234-5646', 'Masculino', 6),
('37456789', 'Damián', 'Blanco', 'damian.blanco@email.com', '+54 9 11 1234-5647', 'Masculino', 6),
('37567890', 'Emanuel', 'Cortés', 'emanuel.cortes@email.com', '+54 9 11 1234-5648', 'Masculino', 6),
('37678901', 'Fernando', 'Delgado', 'fernando.delgado@email.com', '+54 9 11 1234-5649', 'Masculino', 6),

-- Más jugadores categoría 7
('38123456', 'Gastón', 'Escobar', 'gaston.escobar@email.com', '+54 9 11 1234-5650', 'Masculino', 7),
('38234567', 'Hernán', 'Figueroa', 'hernan.figueroa@email.com', '+54 9 11 1234-5651', 'Masculino', 7),
('38345678', 'Iván', 'Gómez', 'ivan.gomez@email.com', '+54 9 11 1234-5652', 'Masculino', 7),
('38456789', 'Jorge', 'Heredia', 'jorge.heredia@email.com', '+54 9 11 1234-5653', 'Masculino', 7),
('38567890', 'Kevin', 'Iglesias', 'kevin.iglesias@email.com', '+54 9 11 1234-5654', 'Masculino', 7),
('38678901', 'Leonardo', 'Juárez', 'leonardo.juarez@email.com', '+54 9 11 1234-5655', 'Masculino', 7),
('38789012', 'Marcos', 'Kramer', 'marcos.kramer@email.com', '+54 9 11 1234-5656', 'Masculino', 7),
('38890123', 'Nahuel', 'Ledesma', 'nahuel.ledesma@email.com', '+54 9 11 1234-5657', 'Masculino', 7),
('38901234', 'Oscar', 'Maldonado', 'oscar.maldonado@email.com', '+54 9 11 1234-5658', 'Masculino', 7),
('39012345', 'Pablo', 'Navarro', 'pablo.navarro2@email.com', '+54 9 11 1234-5659', 'Masculino', 7),
('39123456', 'Ramiro', 'Olivera', 'ramiro.olivera@email.com', '+54 9 11 1234-5660', 'Masculino', 7),
('39234567', 'Sergio', 'Parra', 'sergio.parra@email.com', '+54 9 11 1234-5661', 'Masculino', 7),
('39345678', 'Ulises', 'Quiroga', 'ulises.quiroga@email.com', '+54 9 11 1234-5662', 'Masculino', 7),
('39456789', 'Víctor', 'Rivas', 'victor.rivas@email.com', '+54 9 11 1234-5663', 'Masculino', 7);

-- Verificar jugadores masculinos categoría 6-7
SELECT 
  current_category,
  COUNT(*) as cantidad
FROM players
WHERE gender = 'Masculino' 
  AND current_category IN (6, 7)
GROUP BY current_category
ORDER BY current_category;
