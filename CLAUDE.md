# Guía del Proyecto: Analítica Canchas Sintéticas Pereira

## Resumen del Proyecto
Web App para el análisis y optimización de ocupación de canchas sintéticas en Pereira (Risaralda). Permite visualizar métricas clave (KPIs), mapas de calor de horarios pico/valle, comparativa de formatos y gestión de reservas con integración a Supabase.

## Reglas Obligatorias (AGENTS.md)
1. **Tecnología:** Únicamente HTML5, CSS3 nativo y JavaScript moderno nativo.
2. **Cero Dependencias Externas:** No usar librerías ni frameworks (no React, Tailwind, Chart.js, etc.).
3. **Prohibido:**
   - `var` (usar siempre `const` o `let`).
   - `innerHTML` (usar `document.createElement`, `appendChild`, `textContent`).
   - `alert()`, `confirm()`, `prompt()` (usar componentes en el DOM: Toasts y Modales).
4. **Supabase:** Conexión nativa vía REST (`fetch`), nunca exponer Service Role Key.
5. **Estructura:**
   ```text
   index.html
   CLAUDE.md
   assets/
   ├── CSS/ (main.css, components.css, responsive.css)
   ├── JS/  (app.js, state.js, api.js, dom.js, components/*)
   └── IMG/
   ```

## Especificación Técnica
Ver especificación completa en [docs/specs/2026-09-08-canchas-pereira-design.md](file:///c:/Users/sebas/Downloads/Anti/docs/specs/2026-09-08-canchas-pereira-design.md).
