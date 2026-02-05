## Puntos Clave del Sistema: Padel Manager Web

Crear una web app que permite generar torneos de padel amateur, por categoria, los jugadores pueden cargar su propio perfil de usuario escaneando un qr, se genera una base de datos general, cada club puede tener acceso al sistema.

La bd de jugadores puede ser accesible por todos los clubes, ya que muchas veces los jugadores juegan torneos en diferentes clubes.

Cada jugador tiene asignado una categoria, la cual puede cambiar, tambien se guarda un historial de resultados de cada jugador en cada categoria.

El club puede generar una “liga” o torneo determinado donde los jugadores van sumando puntos para ese torneo puntual, lo cual nos permite acceder a un ranking.

### 1. Gestión de Usuarios y Perfiles

- **Panel del Administrador:** Registro y gestión para dueños de complejos.
- **Ficha del Jugador:** Registro simplificado mediante **código QR**.
- **Base de Datos de Jugadores:** Datos personales, historial de partidos, resultados y **sistema de puntos (ranking)** por categoría.

### 2. Organización de Torneos

- **Configuración:** Selección de categoría, género (Masculino/Femenino/Mixto) y cantidad de parejas.
- **Automatización:** Generación automática de grupos y fases.
- **Flexibilidad:** Sistema **Drag & Drop** para reordenar parejas en los grupos antes de confirmar el inicio.

### 3. Ejecución y Resultados

- **Carga de Resultados:** Registro en tiempo real de los marcadores.
- **Lógica de Clasificación:** Determinación automática de quiénes avanzan al cuadro principal (Draw).
- **Visualización Dinámica:** Generación del cuadro de eliminatorias (Draw) con un diseño atractivo para ser proyectado en pantallas en el club.

### 4. Accesibilidad y Seguimiento

- **Landing de Torneo:** Link público para que jugadores y espectadores sigan horarios, estados de partidos y llaves desde sus móviles.

**Instrucciones de Desarrollo: Sistema de Gestión de Torneos de Pádel "PadelPro Manager"**

**Objetivo:** Crear una plataforma SaaS para dueños de complejos de pádel que automatice la creación de torneos, rankings y seguimiento en tiempo real.

**Stack Tecnológico:**

- **Frontend:** Next.js (App Router) con TypeScript.
- **Estilos:** Tailwind CSS.
- **Componentes:** Shadcn/UI (específicamente usar Data Tables, Dialogs, Cards y Forms).
- **Base de Datos y Auth:** Supabase (PostgreSQL) por su escalabilidad, capa gratuita generosa y manejo integrado de autenticación.
- **Funcionalidades Especiales:** Drag & Drop para las zonas (usar `@hello-pangea/dnd` o `dnd-kit`).
- interfaz limpia y moderna.

**1. Arquitectura de Base de Datos sugerida (puedes adaptarla segun requerimientos):**

- `complexes`: ID, nombre, dueño_id, ubicación.
- `players`: ID, datos personales, historial de torneos (JSONB), categoría actual (1ra-7ma), puntos totales por categoría.
- `tournaments`: ID, complex_id, categoría, género (Masculino/Femenino/Mixto), estado (Inscripción/Zonas/Playoffs/Finalizado).
- `registrations`: ID, tournament_id, pair_id (jugador1_id, jugador2_id).
- `matches`: ID, tournament_id, fase (zona/playoff), resultado (sets/games), ganador_id.

**2. Lógica de Torneo (Reglamento APA/FAP):**

- **Fase de Zonas:** Generar automáticamente grupos de 3 (preferente) o 4 parejas. Clasifican las 2 mejores de cada zona.
- **Criterios de Desempate (Jerarquía):** 1) Diferencia de sets, 2) Diferencia de games, 3) Game a favor, 4) Enfrentamiento directo.
- **Puntuación:** 2 puntos por partido ganado, 1 por jugado/perdido, 0 por W.O.
- **Ranking:** Actualización automática de puntos tras finalizar el torneo (Campeón: 1000, Finalista: 800, etc.).

**3. Vistas Principales:**

- **Dashboard Dueño:** Lista de torneos activos y base de datos de jugadores del club.
- **Creador de Torneo:** Formulario para setear reglas, categoría y añadir parejas por búsqueda inteligente en la DB.
- **Editor de Zonas:** Interfaz de Drag & Drop para mover parejas entre grupos antes de confirmar el inicio ("Confirmar Cuadro").
- **Visualizador de Draw (Modo Proyección):** Una vista de alta fidelidad, con fondo oscuro y tipografía legible, diseñada para mostrar el cuadro (bracket) de eliminación directa en pantallas gigantes del complejo.
- **Public Live Page:** Ruta `/public/torneo/[id]` accesible sin login para que jugadores vean horarios, resultados y estado del draw en vivo.

**4. Registro vía QR:**

- Generar un QR que apunte a `/register-player`. Un formulario simple donde el jugador carga su DNI, foto, categoría y firma un deslinde de responsabilidad digital.

**Entregables sugeridos:**

1. Esquema de Prisma o SQL para Supabase.
2. Estructura de carpetas en Next.js.
3. Lógica del algoritmo de clasificación de zonas.