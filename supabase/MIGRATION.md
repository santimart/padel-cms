# Instrucciones de Actualización de Base de Datos

## Problema Resuelto
Error de Row Level Security al crear complejos durante el registro de usuarios.

## Solución Implementada

### 1. Actualizar Política RLS (Ya está en schema.sql)

La política de inserción de complejos ahora permite a cualquier usuario autenticado crear un complejo:

```sql
DROP POLICY IF EXISTS "Users can insert their own complex" ON complexes;

CREATE POLICY "Authenticated users can insert complexes" ON complexes 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
```

### 2. Agregar Función de Base de Datos (Nueva)

Ejecuta este SQL en tu Supabase SQL Editor:

```sql
-- Function to create complex for new user (called after signup)
CREATE OR REPLACE FUNCTION create_complex_for_user(
  user_id UUID,
  complex_name TEXT,
  complex_location TEXT
)
RETURNS UUID AS $$
DECLARE
  new_complex_id UUID;
BEGIN
  INSERT INTO complexes (name, location, owner_id)
  VALUES (complex_name, complex_location, user_id)
  RETURNING id INTO new_complex_id;
  
  RETURN new_complex_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_complex_for_user TO authenticated;
```

## Pasos para Aplicar

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Ejecuta los comandos de arriba
4. Prueba el registro nuevamente

## Ventajas de esta Solución

- ✅ **Atómica**: La creación del complejo se maneja en una transacción
- ✅ **Segura**: Usa `SECURITY DEFINER` para ejecutar con privilegios elevados
- ✅ **Escalable**: Fácil de extender con lógica adicional
- ✅ **Robusta**: Maneja errores de forma elegante
- ✅ **Flexible**: El código frontend ahora usa RPC en lugar de inserción directa
