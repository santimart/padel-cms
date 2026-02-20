# ReRank - Sistema de Gestión de Torneos de Pádel

Sistema profesional para gestionar torneos de pádel amateur con ranking automático, generación de cuadros, y seguimiento en tiempo real.

## 🎯 Características Principales

- **Base de Datos Global de Jugadores**: Los jugadores se registran una vez y pueden competir en cualquier club
- **Registro QR Frictionless**: Escanea un código QR para registrarse en segundos
- **Gestión Automática de Torneos**: Generación automática de zonas y cuadros de playoffs
- **Sistema de Ranking Anual**: Puntos estilo ATP que motivan a competir en todo el circuito
- **Visualización en Tiempo Real**: Cuadros de eliminatorias optimizados para proyección
- **Páginas Públicas**: Los jugadores pueden seguir torneos sin necesidad de login

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 15 (App Router) con TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes**: Shadcn/UI
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Drag & Drop**: @hello-pangea/dnd
- **QR Codes**: react-qr-code

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratuita)

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ve a Project Settings > API para obtener tus credenciales
3. Copia `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

4. Completa las variables de entorno en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Crear la base de datos

1. Ve a tu proyecto de Supabase
2. Abre el SQL Editor
3. Copia y ejecuta el contenido de `supabase/schema.sql`

Esto creará:
- Todas las tablas necesarias
- Índices para optimizar consultas
- Políticas de Row Level Security (RLS)
- Triggers para timestamps automáticos

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
padel-cms/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas de autenticación
│   ├── (dashboard)/              # Dashboard de administración
│   ├── (public)/                 # Páginas públicas de torneos
│   ├── register-player/          # Registro vía QR
│   └── api/                      # API routes
├── components/
│   ├── ui/                       # Componentes Shadcn/UI
│   ├── tournament/               # Componentes de torneos
│   ├── player/                   # Componentes de jugadores
│   └── shared/                   # Componentes compartidos
├── lib/
│   ├── supabase/                 # Cliente de Supabase
│   ├── types/                    # Tipos TypeScript
│   ├── tournament/               # Lógica de torneos
│   │   ├── classification-logic.ts  # Algoritmo APA/FAP
│   │   └── ranking-calculator.ts    # Sistema de puntos
│   └── utils/                    # Utilidades
└── supabase/
    └── schema.sql                # Schema de base de datos
```

## 🎮 Uso

### Para Dueños de Clubes

1. **Registrarse**: Crea una cuenta como dueño de complejo
2. **Crear Complejo**: Configura la información de tu club
3. **Crear Torneo**: Define categoría, género, y fechas
4. **Generar Zonas**: El sistema crea automáticamente grupos de 3-4 parejas
5. **Ajustar Cuadro**: Usa drag & drop para reorganizar parejas si es necesario
6. **Confirmar Inicio**: Bloquea el cuadro y comienza el torneo
7. **Cargar Resultados**: Ingresa marcadores de cada partido
8. **Playoffs**: El sistema genera automáticamente el cuadro de eliminación
9. **Finalizar**: Los puntos se actualizan automáticamente en el ranking

### Para Jugadores

1. **Escanear QR**: En el club, escanea el código QR del torneo
2. **Registrarse**: Completa tu perfil (DNI, nombre, categoría)
3. **Seguir Torneo**: Accede a la página pública para ver horarios y resultados
4. **Ver Ranking**: Consulta tu posición en el ranking global de tu categoría

## 🏆 Sistema de Ranking

El sistema implementa un ranking anual estilo ATP:

- **Campeón**: 1000 puntos
- **Finalista**: 800 puntos
- **Semifinalista**: 600 puntos
- **Cuartofinalista**: 400 puntos
- **Participación en Zonas**: 200 puntos

Los puntos se acumulan durante todo el año y se resetean al inicio de cada temporada.

## 📊 Lógica de Clasificación (Zonas)

Implementa las reglas oficiales APA/FAP:

1. **Puntos por partido**: 2 por victoria, 1 por derrota, 0 por W.O.
2. **Criterios de desempate** (en orden):
   - Diferencia de sets
   - Diferencia de games
   - Games a favor
   - Enfrentamiento directo

Los 2 mejores de cada zona clasifican a playoffs.

## 🔐 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Los clubes solo pueden editar sus propios torneos
- La base de datos de jugadores es de lectura pública
- Autenticación segura con Supabase Auth

## 📝 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run type-check   # Verificación de tipos TypeScript
```

## 🤝 Contribuir

Las contribuciones son bienvenidas.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

Hecho con ❤️ para la comunidad de pádel
