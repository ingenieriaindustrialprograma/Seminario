# Especificación de Diseño: Web App de Análisis de Ocupación de Canchas Sintéticas (Pereira)

- **Fecha:** 2026-09-08
- **Estado:** Aprobado / Listo para Plan de Implementación
- **Contexto:** Cumplimiento estricto de [Agents.md](../../Agents.md)

---

## 1. Resumen Ejecutivo y Propósito
Desarrollar una herramienta analítica web profesional, ágil, interactiva y responsive para el análisis de ocupación de canchas sintéticas en la ciudad de Pereira, Risaralda. La aplicación permite a administradores y propietarios de complejos deportivos tomar decisiones informadas sobre horarios de baja demanda, tarifas dinámicas, optimización de mantenimiento y programación de torneos.

---

## 2. Restricciones Técnicas y Arquitectura (AGENTS.md)

### 2.1 Principios Absolutos
1. **Sin dependencias externas:** Ni en CSS (no Tailwind, no Bootstrap), ni en JS (no React, no Vue, no Chart.js, no Lodash, no jQuery).
2. **JavaScript Moderno:** Estrictamente `const` y `let`. **Prohibido `var`**.
3. **Manipulación Segura del DOM:** Estrictamente `document.createElement()`, `appendChild()`, `textContent`, `setAttribute()`. **Prohibido `innerHTML`**.
4. **Retroalimentación Visual Integrada:** Modales y Toasts construidos en el DOM. **Prohibido `alert()`, `confirm()`, `prompt()`**.
5. **Conexión Supabase 100% Nativa:** Consulta directa mediante la API REST de Supabase (PostgREST) usando `fetch()` nativo y autenticación con `anon_key`, sin necesidad de instalar SDKs ni librerías de terceros.
6. **Estructura de Directorios:**
   ```text
   Anti/
   │
   ├── index.html
   ├── CLAUDE.md
   ├── docs/specs/
   │   └── 2026-09-08-canchas-pereira-design.md
   │
   └── assets/
       ├── CSS/
       │   ├── main.css          /* Tokens, variables CSS, reset y layout */
       │   ├── components.css    /* KPIs, tablas, gráficos, filtros, modales, toasts */
       │   └── responsive.css    /* Media queries (desktop, tablet, mobile) */
       ├── JS/
       │   ├── state.js          /* Estado centralizado reactivo */
       │   ├── api.js            /* Capa de datos (Supabase PostgREST + Mock fallback) */
       │   ├── dom.js            /* Helpers seguros para creación de elementos DOM */
       │   ├── components/       /* Módulos de interfaz */
       │   │   ├── feedback.js   /* Toasts y modales en DOM */
       │   │   ├── filters.js    /* Filtros reactivos e interdependientes */
       │   │   ├── kpi.js        /* Tarjetas de métricas clave */
       │   │   ├── charts.js     /* Gráficos nativos (Heatmap SVG y Barras CSS) */
       │   │   └── table.js      /* Tabla interactiva (paginación, orden y búsqueda) */
       │   └── app.js            /* Orquestador e inicializador */
       └── IMG/
   ```

---

## 3. Modelo de Datos (PostgreSQL / Supabase)

### 3.1 Tablas Relacionales

#### A. `sedes`
Representa los centros o complejos deportivos en la ciudad de Pereira y su área metropolitana.
- `id` (UUID / INT, PK)
- `nombre` (VARCHAR): Ej. "Complejo Maracaná Pereira", "Canchas El Golazo Cuba", "La Bombonera Álamos", "Camp Nou Cerritos".
- `sector` (VARCHAR): Ej. "Circunvalar", "Cuba", "Álamos", "Cerritos", "Pinares", "Dosquebradas / Área Metro".
- `direccion` (VARCHAR)
- `telefono` (VARCHAR)
- `estado` (VARCHAR): `activo` | `inactivo`

#### B. `canchas`
Representa cada cancha individual dentro de una sede.
- `id` (UUID / INT, PK)
- `sede_id` (FK -> `sedes.id`)
- `nombre` (VARCHAR): Ej. "Cancha 1 (Techada)", "Cancha 2 (F7)"
- `tipo` (VARCHAR): `Fútbol 5` | `Fútbol 7` | `Fútbol 8` | `Fútbol 11`
- `superficie` (VARCHAR): `Sintética Techada` | `Sintética al Aire Libre`
- `tarifa_base_hora` (DECIMAL): Valor de referencia en COP (ej. $80,000, $120,000, $160,000)
- `estado` (VARCHAR): `disponible` | `mantenimiento`

#### C. `reservas_ocupacion`
Registro granular de cada bloque horario reservado o programado.
- `id` (UUID / INT, PK)
- `cancha_id` (FK -> `canchas.id`)
- `fecha` (DATE): YYYY-MM-DD
- `hora_inicio` (TIME): Ej. "18:00"
- `hora_fin` (TIME): Ej. "19:00"
- `estado` (VARCHAR): `completada` | `en_curso` | `cancelada` | `mantenimiento`
- `valor_pagado` (DECIMAL): Valor real cobrado
- `tipo_cliente` (VARCHAR): `Frecuente` | `Esporádico` | `Torneo`
- `metodo_pago` (VARCHAR): `Efectivo` | `Transferencia` | `Pendiente`

---

## 4. Arquitectura de Estado y Flujo de Datos

### 4.1 Fuente Única de la Verdad (`appState`)
```javascript
const appState = {
  rawData: {
    sedes: [],
    canchas: [],
    reservas: []
  },
  filteredData: {
    reservas: [],
    summary: {}
  },
  filters: {
    periodo: 'todos', // 'hoy', 'semana', 'mes', 'todos'
    sector: 'todos',
    sedeId: 'todos',
    tipoCancha: 'todos',
    franjaHoraria: 'todos' // 'manana' (06-12), 'tarde' (12-18), 'noche' (18-24)
  },
  ui: {
    isLoading: false,
    error: null,
    activeModal: null,
    tablePage: 1,
    tablePageSize: 10,
    tableSortField: 'fecha',
    tableSortAsc: false,
    searchQuery: ''
  }
};
```

### 4.2 Flujo Unidireccional
1. `api.js` carga los datos (desde Supabase PostgREST o Mock inicial).
2. Se almacenan en `appState.rawData`.
3. Se ejecuta `applyFilters()` para derivar `appState.filteredData`.
4. Se notifican los observadores (`renderKPIs()`, `renderCharts()`, `renderTable()`).
5. Cualquier interacción en un filtro o paginación actualiza `appState.filters` y vuelve a desencadenar el ciclo sin recargar la página ni perder el estado.

---

## 5. Visualizaciones y Componentes Analíticos

### 5.1 KPIs de Impacto (Tarjetas Superiores)
1. **Tasa de Ocupación Global (%):** Porcentaje de franjas horarias ocupadas respecto al total operativo (08:00 a 23:00).
2. **Total Horas Jugadas:** Conteo acumulado de horas facturadas en el filtro seleccionado.
3. **Ingresos Totales ($ COP):** Monto recaudado formateado con moneda colombiana.
4. **Horario Pico:** Franja horaria con mayor demanda (ej. "19:00 - 21:00").
5. **Cancha Más Rentable:** Nombre de la cancha y sede con mayor rendimiento de ocupación.

### 5.2 Gráficos Nativos
1. **Mapa de Calor Semanal (Heatmap SVG):**
   - Matriz interactiva de 7 días (Lunes a Domingo) por franjas horarias (08:00 a 23:00).
   - Celda con escala de color suave (desde verde/azul oscuro para vacía hasta naranja/rojo vibrante para saturada).
   - Tooltip nativo al pasar el cursor con información detallada de la ocupación y reservas.
2. **Comparativa por Formato y Sede (Barras CSS):**
   - Gráfico de barras horizontales estilizado con CSS Flex/Grid.
   - Distribución de horas reservadas según F5, F7, F8 y F11.

### 5.3 Tabla Dinámica de Ocupación
- Columnas: Fecha, Hora, Sede, Cancha, Tipo, Estado, Cliente, Valor.
- Búsqueda en tiempo real (por texto).
- Ordenamiento ascendente/descendente por encabezados.
- Paginación nativa accesible.
- Filtros interactivos de estado con badges visuales.

### 5.4 Sistema de Feedback
- **Toasts:** Notificaciones no intrusivas en la esquina superior derecha con auto-cierre y animación CSS.
- **Modal Nativo:** Ventana para ver detalle completo de una reserva o configurar credenciales de Supabase en tiempo de ejecución.
- **Estados de Interfaz:** Skeleton loaders para carga, panel de "Sin resultados" con acción para limpiar filtros y banner de error con reintento.

---

## 6. Verificación y Criterios de Aceptación
1. **Cumplimiento de Código:** 0 ocurrencias de `var`, 0 de `innerHTML`, 0 de `alert/confirm/prompt`.
2. **Zero Dependencies:** La aplicación corre abriendo `index.html` en cualquier navegador sin herramientas de empaquetado o dependencias npm.
3. **Filtros Reactivos:** Cambiar cualquier filtro actualiza sincronizadamente los 5 KPIs, los 2 gráficos y la tabla.
4. **Responsive:** Funciona sin desbordamiento horizontal en pantallas desde 360px (móvil) hasta 4K (desktop).
5. **Persistencia y Supabase:** El módulo `api.js` incluye el conector PostgREST listo para recibir la URL y Anon Key del usuario, con fallback automático a los datos de Pereira simulados cuando no haya conexión.
