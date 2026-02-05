-- Script para cargar 40 jugadores de prueba
-- Ejecuta este script en el SQL Editor de Supabase

INSERT INTO players (dni, first_name, last_name, email, phone, current_category) VALUES
-- Categoría 1 (Principiantes)
('30123456', 'Juan', 'Pérez', 'juan.perez@email.com', '+54 9 11 1234-5601', 1),
('30234567', 'María', 'González', 'maria.gonzalez@email.com', '+54 9 11 1234-5602', 1),
('30345678', 'Carlos', 'Rodríguez', 'carlos.rodriguez@email.com', '+54 9 11 1234-5603', 1),
('30456789', 'Ana', 'Martínez', 'ana.martinez@email.com', '+54 9 11 1234-5604', 1),
('30567890', 'Luis', 'García', 'luis.garcia@email.com', '+54 9 11 1234-5605', 1),

-- Categoría 2
('31123456', 'Pedro', 'López', 'pedro.lopez@email.com', '+54 9 11 1234-5606', 2),
('31234567', 'Laura', 'Fernández', 'laura.fernandez@email.com', '+54 9 11 1234-5607', 2),
('31345678', 'Diego', 'Sánchez', 'diego.sanchez@email.com', '+54 9 11 1234-5608', 2),
('31456789', 'Sofía', 'Romero', 'sofia.romero@email.com', '+54 9 11 1234-5609', 2),
('31567890', 'Martín', 'Torres', 'martin.torres@email.com', '+54 9 11 1234-5610', 2),
('31678901', 'Valentina', 'Díaz', 'valentina.diaz@email.com', '+54 9 11 1234-5611', 2),

-- Categoría 3
('32123456', 'Javier', 'Ruiz', 'javier.ruiz@email.com', '+54 9 11 1234-5612', 3),
('32234567', 'Camila', 'Moreno', 'camila.moreno@email.com', '+54 9 11 1234-5613', 3),
('32345678', 'Facundo', 'Álvarez', 'facundo.alvarez@email.com', '+54 9 11 1234-5614', 3),
('32456789', 'Lucía', 'Giménez', 'lucia.gimenez@email.com', '+54 9 11 1234-5615', 3),
('32567890', 'Nicolás', 'Castro', 'nicolas.castro@email.com', '+54 9 11 1234-5616', 3),
('32678901', 'Florencia', 'Vargas', 'florencia.vargas@email.com', '+54 9 11 1234-5617', 3),
('32789012', 'Tomás', 'Herrera', 'tomas.herrera@email.com', '+54 9 11 1234-5618', 3),

-- Categoría 4
('33123456', 'Santiago', 'Silva', 'santiago.silva@email.com', '+54 9 11 1234-5619', 4),
('33234567', 'Agustina', 'Medina', 'agustina.medina@email.com', '+54 9 11 1234-5620', 4),
('33345678', 'Matías', 'Ortiz', 'matias.ortiz@email.com', '+54 9 11 1234-5621', 4),
('33456789', 'Micaela', 'Suárez', 'micaela.suarez@email.com', '+54 9 11 1234-5622', 4),
('33567890', 'Ignacio', 'Vega', 'ignacio.vega@email.com', '+54 9 11 1234-5623', 4),
('33678901', 'Catalina', 'Molina', 'catalina.molina@email.com', '+54 9 11 1234-5624', 4),
('33789012', 'Benjamín', 'Ramos', 'benjamin.ramos@email.com', '+54 9 11 1234-5625', 4),
('33890123', 'Julieta', 'Navarro', 'julieta.navarro@email.com', '+54 9 11 1234-5626', 4),

-- Categoría 5
('34123456', 'Ezequiel', 'Cabrera', 'ezequiel.cabrera@email.com', '+54 9 11 1234-5627', 5),
('34234567', 'Antonella', 'Pereyra', 'antonella.pereyra@email.com', '+54 9 11 1234-5628', 5),
('34345678', 'Gonzalo', 'Acosta', 'gonzalo.acosta@email.com', '+54 9 11 1234-5629', 5),
('34456789', 'Milagros', 'Benítez', 'milagros.benitez@email.com', '+54 9 11 1234-5630', 5),
('34567890', 'Franco', 'Ríos', 'franco.rios@email.com', '+54 9 11 1234-5631', 5),
('34678901', 'Delfina', 'Mendoza', 'delfina.mendoza@email.com', '+54 9 11 1234-5632', 5),

-- Categoría 6
('35123456', 'Maximiliano', 'Gutiérrez', 'maximiliano.gutierrez@email.com', '+54 9 11 1234-5633', 6),
('35234567', 'Emilia', 'Domínguez', 'emilia.dominguez@email.com', '+54 9 11 1234-5634', 6),
('35345678', 'Joaquín', 'Núñez', 'joaquin.nunez@email.com', '+54 9 11 1234-5635', 6),
('35456789', 'Martina', 'Sosa', 'martina.sosa@email.com', '+54 9 11 1234-5636', 6),
('35567890', 'Bautista', 'Ponce', 'bautista.ponce@email.com', '+54 9 11 1234-5637', 6),

-- Categoría 7 (Avanzados)
('36123456', 'Rodrigo', 'Ibarra', 'rodrigo.ibarra@email.com', '+54 9 11 1234-5638', 7),
('36234567', 'Renata', 'Campos', 'renata.campos@email.com', '+54 9 11 1234-5639', 7),
('36345678', 'Thiago', 'Rojas', 'thiago.rojas@email.com', '+54 9 11 1234-5640', 7);

-- Verificar la inserción
SELECT 
  current_category,
  COUNT(*) as cantidad
FROM players
WHERE dni LIKE '3%'
GROUP BY current_category
ORDER BY current_category;

-- Mostrar todos los jugadores insertados
SELECT 
  first_name,
  last_name,
  dni,
  current_category
FROM players
WHERE dni LIKE '3%'
ORDER BY current_category, last_name;
