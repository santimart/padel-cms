# Personalización de Estilos y Temas

Este documento explica cómo personalizar la apariencia visual de la aplicación, incluyendo colores, bordes, tipografía y tamaños.

## Archivos Clave

- **`app/globals.css`**: Contiene todas las definiciones de variables CSS (colores, radios, fuentes) para los temas Claro y Oscuro.
- **`app/layout.tsx`**: Controla el `ThemeProvider` y carga las fuentes.
- **`tailwind.config.ts`**: (Implícito en Next.js v15+ y Tailwind v4) La configuración de Tailwind ahora se maneja principalmente a través de variables CSS en `globals.css` bajo la directiva `@theme`.

---

## 1. Personalizar Colores (Themes)

Los colores se definen mediante variables CSS en `app/globals.css`.

### Tema Claro (Light Mode)
Para cambiar los colores del modo claro, edita las variables dentro del selector `:root`.

```css
:root {
  --background: oklch(1 0 0);          /* Fondo dencipal */
  --foreground: oklch(0.145 0 0);      /* Texto principal */
  --primary: oklch(0.65 0.18 162);     /* Color primario (Verde Pádel) */
  --primary-foreground: oklch(1 0 0);  /* Texto sobre color primario */
  /* ... resto de variables */
}
```

### Tema Oscuro (Dark Mode)
Para cambiar los colores del modo oscuro, edita las variables dentro del selector `.dark`.

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  /* ... resto de variables */
}
```

> **Nota:** Usamos el espacio de color `oklch` para una mejor consistencia y gama de colores. Puedes usar conversores online de Hex a Oklch.

---

## 2. Bordes Redondeados (Radius)

Para cambiar qué tan redondeadas son las tarjetas, botones e inputs, modifica la variable `--radius` dentro de `:root` en `app/globals.css`.

```css
:root {
  --radius: 0.625rem; /* ~10px. Aumenta para más redondeado, disminuye para más cuadrado */
}
```

Tailwind usa esta variable para generar las clases `rounded-sm`, `rounded-md`, `rounded-lg`, etc.

---

## 3. Tipografía (Fuentes)

La configuración de fuentes se realiza en dos pasos:

1.  **Cargar la Fuente**: En `app/layout.tsx`.
    ```tsx
    import { Inter } from "next/font/google";

    const inter = Inter({ 
      subsets: ["latin"],
      variable: "--font-inter", // Variable CSS que se usará
    });
    ```

2.  **Asignar a Tailwind**: En `app/globals.css` dentro del bloque `@theme`.
    ```css
    @theme inline {
      --font-sans: var(--font-inter); /* Conecta la clase font-sans con la variable de la fuente */
    }
    ```

Para cambiar la fuente, importa una diferente desde `next/font/google` en el layout y actualiza la variable.

---

## 4. Tamaños de Texto

Tailwind v4 usa una escala de tamaños predeterminada (`text-sm`, `text-base`, `text-lg`, `text-xl`, etc.).

Si necesitas ajustar el tamaño base de toda la aplicación, puedes hacerlo en el bloque `@theme` o directamente en el `body`.

```css
@theme inline {
  /* Ejemplo para redefinir el tamaño base */
  --text-base: 1rem; 
  --text-lg: 1.125rem;
}
```

O para aplicar un tamaño base diferente globalmente:

```css
body {
  font-size: 16px; /* Ajusta este valor si es necesario */
}
```
