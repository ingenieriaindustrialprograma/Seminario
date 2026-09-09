# Plan de Implementación: Web App de Análisis de Ocupación de Canchas Sintéticas (Pereira)

- **Fecha:** 2026-09-08
- **Especificación de Referencia:** [docs/specs/2026-09-08-canchas-pereira-design.md](../specs/2026-09-08-canchas-pereira-design.md)
- **Directrices:** [AGENTS.md](../../Agents.md) y [CLAUDE.md](../../CLAUDE.md)

---

## 1. Mapeo de Archivos

```text
Anti/
├── index.html                               # HTML5 semántico y accesible
├── CLAUDE.md                                # Reglas del proyecto
├── docs/
│   ├── specs/2026-09-08-canchas-pereira-design.md
│   ├── plans/2026-09-08-canchas-pereira-implementation.md
│   └── supabase_schema.sql                 # Script SQL para despliegue en Supabase
└── assets/
    ├── CSS/
    │   ├── main.css                         # Tokens de color, tipografía, reset y layout grid
    │   ├── components.css                   # KPIs, gráficos (SVG/CSS), tabla, filtros, modal, toast
    │   └── responsive.css                   # Media queries para tablet y móvil
    ├── JS/
    │   ├── dom.js                           # Helpers seguros de creación de elementos (0 innerHTML)
    │   ├── state.js                         # Estado centralizado (appState) y lógica de filtrado
    │   ├── api.js                           # Capa de datos (Mock de Pereira + Supabase PostgREST fetch)
    │   ├── components/
    │   │   ├── feedback.js                  # Toasts y modales nativos en DOM (0 alert/confirm)
    │   │   ├── kpi.js                       # 5 tarjetas de métricas analíticas
    │   │   ├── charts.js                    # Heatmap semanal SVG y barras de distribución CSS
    │   │   ├── filters.js                   # Controles dinámicos interconectados
    │   │   └── table.js                     # Tabla interactiva (búsqueda, orden y paginación)
    │   └── app.js                           # Orquestador e inicialización
    └── IMG/
```

---

## 2. Tareas de Implementación Desglosadas

### Tarea 1: Base de Estilos CSS (main.css, components.css, responsive.css)
- [ ] Crear `assets/CSS/main.css` con variables CSS para paleta deportiva analítica (esmeralda, índigo, pizarra, ámbar, coral), reset CSS y contenedor principal en CSS Grid.
- [ ] Crear `assets/CSS/components.css` con estilos para tarjetas KPI, Heatmap SVG nativo con celdas hover/tooltip, barras de porcentaje, tabla con estados hover, controles de formulario, modales accesibles y toasts animados.
- [ ] Crear `assets/CSS/responsive.css` con puntos de quiebre (768px, 1024px, 1280px) para adaptar la grilla de KPIs, scroll horizontal seguro en tablas y adaptación de filtros.
- *Verificación:* Inspección de sintaxis CSS y reglas nativas sin librerías externas.

### Tarea 2: Utilidades de DOM Seguro y Estado Centralizado (dom.js, state.js)
- [ ] Crear `assets/JS/dom.js` con funciones puras `createEl()`, `clearChildren()`, `setAttrs()`, `formatCurrency()`, `formatDate()` garantizando CERO uso de `innerHTML`.
- [ ] Crear `assets/JS/state.js` con el objeto reactivo `appState`, función `applyFilters()` que filtra por período, sector, sede, formato y franja horaria, y cálculo de agregados para KPIs y gráficos.
- *Verificación:* Test rápido en Node/Navegador comprobando la mutación inmutable y el cálculo de métricas.

### Tarea 3: Capa de Datos (api.js) y Script Supabase (supabase_schema.sql)
- [ ] Crear `assets/JS/api.js` con dataset simulado de alta fidelidad para Pereira (Sedes: Circunvalar, Cuba, Álamos, Cerritos, Pinares; Canchas F5, F7, F8; Reservas horarias del último mes).
- [ ] Implementar en `api.js` la función `fetchSupabaseData()` utilizando `fetch` nativo hacia la API PostgREST (`/rest/v1/`), con selector de fallback automático a los datos locales si no hay credenciales configuradas.
- [ ] Crear `docs/supabase_schema.sql` con la definición de tablas `sedes`, `canchas`, `reservas_ocupacion`, políticas RLS e inserts de prueba.
- *Verificación:* Validación de que `api.js` resuelve promesas y entrega el objeto `{ sedes, canchas, reservas }` normalizado.

### Tarea 4: Componentes de Interfaz y Gráficos Nativos
- [ ] Crear `assets/JS/components/feedback.js` para crear y destruir Toasts con temporizador y Modales accesibles en el DOM.
- [ ] Crear `assets/JS/components/kpi.js` para generar las 5 tarjetas de KPI con iconos, valores comparativos y etiquetas descriptivas.
- [ ] Crear `assets/JS/components/charts.js` con:
  - Heatmap Semanal en SVG puro (Lunes a Domingo vs horas 08:00 a 23:00) con gradiente de color según densidad de reservas.
  - Gráfica de barras horizontales nativas en CSS Grid/Flex para demanda por tipo de cancha.
- [ ] Crear `assets/JS/components/filters.js` para construir y enlazar los `select` e `input` con listeners que actualizan `appState`.
- [ ] Crear `assets/JS/components/table.js` para renderizar la tabla de reservas con ordenamiento por clic en encabezados y paginación numérica.
- *Verificación:* Verificar que cada módulo exporta funciones de renderizado limpias basadas en `document.createElement()`.

### Tarea 5: Estructura HTML Semántica y Orquestación (index.html, app.js)
- [ ] Crear `index.html` con estructura semántica: `<header>`, `<main>`, secciones `#kpi-section`, `#filters-section`, `#charts-section`, `#table-section`, modales y contenedor `#toast-container`.
- [ ] Crear `assets/JS/app.js` para inicializar la carga de datos, vincular eventos globales, renderizar la vista inicial y sincronizar los filtros.
- *Verificación:* Apertura de `index.html` en el navegador, validación de consola (0 errores, 0 warnings).

### Tarea 6: Auditoría de Reglas de AGENTS.md
- [ ] Ejecutar búsqueda exhaustiva de `var`, `innerHTML`, `alert`, `confirm`, `prompt` en todo `assets/JS/`.
- [ ] Verificar que no exista ninguna dependencia externa ni llamadas a CDNs de terceros.
- [ ] Comprobar responsive en resoluciones móvil (375px), tablet (768px) y desktop (1440px).
