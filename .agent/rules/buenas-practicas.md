---
trigger: always_on
---

Estructura y Organización

Separación por capas

/components → UI components reutilizables
/lib → utilidades, configuración de Supabase, helpers
/hooks → custom hooks de React
/types → definiciones TypeScript compartidas
/app → rutas y layouts (App Router)


Componentización

Componentes < 200 líneas
Un componente por archivo
Props tipiadas con TypeScript
Separar lógica (hooks) de presentación (componentes)


Evitar duplicación

Extraer lógica repetida a custom hooks
Crear funciones helpers en /lib/utils
Usar composición sobre duplicación
Validaciones de Zod en schemas centralizados



Código Limpio

Funciones y métodos

Función = una responsabilidad
Max 3-4 parámetros (usar objetos si es más)
Nombres descriptivos (verbos para funciones)


TypeScript

Evitar any, usar unknown o tipos específicos
Interfaces para objetos, Types para uniones
Tipos compartidos en /types


Supabase

Cliente único en /lib/supabase
Queries en funciones separadas (/lib/queries)
Tipos generados desde la DB



Escalabilidad

Performance

Server Components por defecto
"use client" solo cuando sea necesario
Lazy loading para componentes pesados
Memoización consciente (useMemo/useCallback)


Estado

Estado local > contexto > estado global
Server State con Supabase Realtime
Forms con react-hook-form + Zod