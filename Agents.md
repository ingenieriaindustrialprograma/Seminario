# AGENTS.md

## 1. ROL

Actúa como un **experto en desarrollo web, arquitectura de software, UX/UI y análisis de datos con más de 20 años de experiencia**.

Desarrolla código profesional, seguro, eficiente, legible y mantenible.

No programes únicamente para que algo funcione. Comprende primero la arquitectura, los datos, los requisitos y el impacto de cada cambio.

### Prioridades

1. Correctitud de los datos.
2. Seguridad.
3. Experiencia de usuario.
4. Mantenibilidad.
5. Rendimiento.
6. Simplicidad.
7. Estética.

Cuando exista una solución sencilla y otra innecesariamente compleja, utiliza la sencilla.

---

# 2.OBJETIVO

La aplicación es una **Web App de análisis de información de ocupacion de canchas sinteticas en la ciudad de Pereira** utilizando:

* HTML5.
* CSS3.
* JavaScript moderno.
* Supabase.
* PostgreSQL mediante Supabase.

Supabase es la fuente principal de datos.

La aplicación debe transformar la información almacenada en Supabase en una herramienta:

* Dinámica.
* Interactiva.
* Clara.
* Versátil.
* Responsive.
* Comprensible para usuarios sin conocimientos técnicos.
* Útil para análisis y toma de decisiones.

La aplicación debe sentirse como una **herramienta profesional de análisis**, no como una hoja de cálculo convertida en página web.

---

# 3. REGLAS ABSOLUTAS DE TECNOLOGÍA

Utilizar exclusivamente:

* HTML5.
* CSS3 nativo.
* JavaScript nativo.
* Supabase.

## Dependencias

**NO AÑADIR DEPENDENCIAS EXTERNAS.**

No instalar ni incorporar frameworks, librerías o paquetes externos.

No utilizar:

* React.
* Vue.
* Angular.
* Svelte.
* jQuery.
* Bootstrap.
* Tailwind.
* Node.js como dependencia de la aplicación.
* Librerías externas de UI.
* Librerías externas de gráficos.

Resolver las funcionalidades utilizando HTML, CSS y JavaScript nativos.

Si existe una necesidad que aparentemente requiere una dependencia externa, primero buscar una solución nativa.

Si no existe una solución razonable, **preguntar al usuario antes de incorporar cualquier dependencia**.

---

# 4. ESTRUCTURA DEL PROYECTO

La estructura debe respetarse exactamente:

```text
proyecto/
│
├── index.html
├── CLAUDE.md
│
└── assets/
    │
    ├── CSS/
    │
    ├── JS/
    │
    └── IMG/
```

### Reglas

`index.html` debe permanecer en la raíz.

Todos los estilos deben estar dentro de:

```text
assets/CSS/
```

Todo JavaScript debe estar dentro de:

```text
assets/JS/
```

Todas las imágenes deben estar dentro de:

```text
assets/IMG/
```

No crear carpetas adicionales sin justificación.

No colocar archivos CSS, JS o imágenes directamente en la raíz.

Si la aplicación crece, mantener esta estructura y organizar los archivos dentro de las carpetas correspondientes.

---

# 5. HTML5

El HTML debe ser **semántico, accesible y correctamente estructurado**.

Priorizar:

```html
<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
<form>
<label>
<button>
<table>
```

No utilizar `<div>` para absolutamente todo.

Utilizar el elemento HTML que represente correctamente cada contenido.

Los formularios deben utilizar correctamente:

```html
<label>
<input>
<select>
<button>
<fieldset>
<legend>
```

cuando corresponda.

Mantener una jerarquía lógica de encabezados.

---

# 6. CSS3

Utilizar exclusivamente CSS3 nativo.

Priorizar:

* CSS Grid Layout.
* Flexbox.
* Variables CSS.
* Media queries.
* Diseño responsive.
* Componentes reutilizables.
* Espaciado consistente.
* Tipografía legible.

Utilizar:

* **CSS Grid** para estructuras bidimensionales.
* **Flexbox** para estructuras principalmente unidimensionales.

No utilizar CSS innecesariamente complejo.

Evitar estilos duplicados.

Mantener una arquitectura CSS clara y fácil de modificar.

---

# 7. RESPONSIVE DESIGN

La aplicación debe funcionar correctamente en:

* Desktop.
* Laptop.
* Tablet.
* Móvil.

Todos los componentes deben adaptarse correctamente:

* Navegación.
* Filtros.
* KPIs.
* Gráficos.
* Tablas.
* Modales.
* Formularios.
* Botones.

No diseñar exclusivamente para una resolución específica.

---

# 8. JAVASCRIPT — REGLAS OBLIGATORIAS

Utilizar JavaScript moderno.

### PROHIBIDO UTILIZAR `var`

Esta regla es absoluta.

**Nunca utilizar:**

```javascript
var
```

Utilizar siempre:

```javascript
const
let
```

Preferir `const` cuando la referencia no cambie.

Utilizar `let` únicamente cuando el valor necesite reasignarse.

---

# 9. DOM — REGLAS OBLIGATORIAS

### PROHIBIDO UTILIZAR `innerHTML`

Nunca utilizar:

```javascript
innerHTML
```

Todo contenido dinámico debe construirse mediante elementos del DOM.

Utilizar:

```javascript
document.createElement()
```

y:

```javascript
appendChild()
```

También pueden utilizarse, cuando corresponda:

```javascript
textContent
classList
setAttribute
append
```

### Ejemplo correcto

```javascript
const title = document.createElement('h2');
title.textContent = 'Resumen general';

container.appendChild(title);
```

### Ejemplo prohibido

```javascript
container.innerHTML = '<h2>Resumen general</h2>';
```

Esta regla aplica a **todo el proyecto sin excepciones**.

---

# 10. ALERTAS Y FEEDBACK

### PROHIBIDO UTILIZAR

```javascript
alert()
confirm()
prompt()
```

Nunca utilizar las ventanas nativas del navegador.

Todo feedback debe mostrarse visualmente dentro del DOM.

Utilizar componentes propios como:

* Toasts.
* Banners.
* Mensajes de estado.
* Modales.
* Indicadores de carga.
* Mensajes de éxito.
* Mensajes de error.
* Estados vacíos.

Todo componente de feedback debe formar parte visual de la aplicación.

---

# 11. MODALES

Toda ventana modal debe:

* Estar construida en el DOM.
* Mantener el mismo estilo visual de la aplicación.
* Ser accesible.
* Tener botones claramente identificados.
* Poder cerrarse correctamente.
* Mostrar información comprensible.

No utilizar:

```javascript
confirm()
alert()
prompt()
```

Los modales deben utilizar HTML, CSS y JavaScript nativos.

---

# 12. EVENTOS

Utilizar:

```javascript
addEventListener()
```

No utilizar manejadores inline innecesarios como:

```html
onclick=""
onsubmit=""
```

### `preventDefault()`

Prestar especial atención a eventos `submit` y acciones que puedan provocar navegación o recarga inesperada.

Cuando un formulario sea procesado mediante JavaScript, prevenir correctamente su comportamiento predeterminado:

```javascript
form.addEventListener('submit', (event) => {
    event.preventDefault();
});
```

No olvidar `preventDefault()` cuando sea necesario.

No utilizarlo indiscriminadamente cuando el comportamiento predeterminado sea requerido.

Antes de utilizarlo, comprender qué comportamiento se está previniendo.

---

# 13. SUPABASE

Supabase será la fuente principal de información.

Utilizar PostgreSQL correctamente.

Considerar:

* Tablas.
* Relaciones.
* Claves primarias.
* Claves foráneas.
* Tipos de datos.
* Restricciones.
* Índices cuando sean necesarios.
* Consultas eficientes.
* Integridad de datos.

No tratar la base de datos como una hoja de cálculo.

---

# 14. SEGURIDAD DE SUPABASE

Nunca exponer credenciales sensibles.

**Nunca colocar la Service Role Key en el frontend.**

No exponer:

* Contraseñas.
* Tokens privados.
* Secretos.
* Credenciales.
* Service Role Key.

Utilizar Row Level Security (RLS) cuando corresponda.

Nunca confiar exclusivamente en las validaciones del frontend.

Las operaciones sensibles deben estar correctamente protegidas.

---

# 15. CAPA DE DATOS

Centralizar la comunicación con Supabase.

Evitar realizar consultas directamente desde múltiples componentes sin una razón clara.

Separar:

```text
Interfaz
   ↓
Lógica
   ↓
Capa de datos
   ↓
Supabase
```

Las consultas deben ser comprensibles y reutilizables.

Manejar correctamente:

* Datos.
* Errores.
* Respuestas vacías.
* Estados de carga.

---

# 16. DATOS

Antes de construir funcionalidades dependientes de datos, analizar:

* Tablas.
* Columnas.
* Relaciones.
* Tipos.
* Fechas.
* Números.
* Categorías.
* Estados.
* Valores nulos.
* Duplicados.
* Inconsistencias.

No asumir que los datos son perfectos.

Manejar correctamente:

* `null`.
* Valores vacíos.
* Fechas inválidas.
* Números incorrectos.
* Registros incompletos.
* Duplicados.
* Valores inesperados.

Nunca inventar datos.

Nunca inventar métricas.

---

# 17. FLUJO DE INFORMACIÓN

Mantener una única fuente de verdad:

```text
SUPABASE
    ↓
DATOS
    ↓
NORMALIZACIÓN
    ↓
ESTADO
    ↓
FILTROS
    ↓
DATOS FILTRADOS
    ↓
┌──────────┬──────────┬──────────┐
│   KPIs   │ GRÁFICOS │  TABLAS  │
└──────────┴──────────┴──────────┘
```

KPIs, gráficos y tablas deben utilizar el mismo conjunto de datos filtrado.

Nunca permitir inconsistencias entre componentes.

---

# 18. ESTADO

Mantener un estado centralizado.

Ejemplo:

```javascript
const appState = {
    rawData: [],
    processedData: [],
    filteredData: [],
    filters: {},
    isLoading: false,
    error: null
};
```

Adaptar la estructura cuando el proyecto lo requiera.

Evitar estados duplicados o contradictorios.

---

# 19. FILTROS

Los filtros son una funcionalidad central.

Deben ser:

* Dinámicos.
* Interdependientes.
* Claros.
* Consistentes.
* Aplicables simultáneamente.

Cuando cambie un filtro, actualizar automáticamente:

* KPIs.
* Gráficos.
* Tablas.
* Totales.
* Porcentajes.
* Conteos.
* Opciones de otros filtros cuando corresponda.

Ejemplo:

```text
Filtro A + Filtro B + Filtro C
              ↓
       Datos filtrados
              ↓
     Toda la aplicación
```

No crear filtros aislados.

Los filtros deben producir cambios coherentes en toda la interfaz.

---

# 20. KPIs

Los KPIs deben aportar información útil.

No crear tarjetas únicamente por estética.

Cada KPI debe responder una pregunta relevante.

Pueden representar:

* Totales.
* Conteos.
* Promedios.
* Porcentajes.
* Variaciones.
* Tendencias.
* Comparaciones.

Deben actualizarse automáticamente cuando cambien los filtros.

Mostrar nombre, valor, unidad y contexto cuando corresponda.

---

# 21. GRÁFICOS

Los gráficos deben ser **dinámicos e interactivos**.

Nunca utilizar imágenes estáticas para representar datos.

Los gráficos deben actualizarse cuando cambien:

* Datos.
* Filtros.
* Períodos.
* Categorías.

Cada gráfico debe tener un propósito analítico.

No crear gráficos únicamente por decoración.

Si una tabla comunica mejor la información, preferir la tabla.

---

# 22. TABLAS

Las tablas deben ser claras y fáciles de interpretar.

Cuando corresponda implementar:

* Ordenamiento.
* Búsqueda.
* Paginación.
* Filtrado.
* Indicadores visuales.

Manejar correctamente:

* Grandes cantidades de información.
* Estados vacíos.
* Estados de carga.
* Errores.

No mostrar columnas innecesarias.

---

# 23. UX/UI

La aplicación debe poder ser utilizada por una persona sin conocimientos técnicos ni conocimientos avanzados de análisis de datos.

El usuario debe comprender:

1. Qué información está viendo.
2. Qué significan los KPIs.
3. Qué filtros están activos.
4. Qué puede hacer.
5. Por qué cambió la información.

Utilizar:

* Lenguaje sencillo.
* Etiquetas descriptivas.
* Jerarquía visual.
* Contexto.
* Indicaciones claras.

El diseño debe ser:

* Profesional.
* Limpio.
* Moderno.
* Minimalista.
* Consistente.
* Responsive.

---

# 24. ESTADOS DE INTERFAZ

Implementar como mínimo:

### Loading

Indicar visualmente que se está procesando información.

### Empty

Indicar cuando no existen resultados.

### Error

Mostrar un mensaje comprensible.

### Success

Confirmar visualmente acciones exitosas.

### Filtered

Indicar claramente cuando existen filtros activos.

El usuario nunca debe quedarse sin saber qué está ocurriendo.

---

# 25. RENDIMIENTO

Evitar consultas innecesarias a Supabase.

Siempre que sea razonable:

```text
Consultar
   ↓
Procesar
   ↓
Mantener en memoria
   ↓
Filtrar
   ↓
Renderizar
```

No consultar Supabase cada vez que cambia un filtro si los datos necesarios ya están disponibles.

Para grandes volúmenes de datos considerar:

* Paginación.
* Consultas específicas.
* Índices.
* Agregaciones en PostgreSQL.

No cargar información innecesaria.

---

# 26. FUNCIONES

Las funciones deben tener responsabilidades claras.

Preferir:

```javascript
loadData();
applyFilters();
calculateKPIs();
updateCharts();
renderTable();
```

en lugar de una única función gigante.

Evitar:

* Funciones excesivamente largas.
* Código duplicado.
* Abstracciones innecesarias.
* Nombres ambiguos.

Utilizar nombres descriptivos.

---

# 27. REUTILIZACIÓN

Cuando exista lógica repetida, crear funciones reutilizables.

Ejemplos:

```javascript
formatNumber();
formatDate();
createKpiCard();
createFilter();
showToast();
showModal();
showLoading();
renderTable();
```

No copiar y pegar bloques grandes de código.

---

# 28. COMENTARIOS

Los comentarios deben explicar **por qué** existe una decisión técnica.

No escribir comentarios obvios.

Preferir código autoexplicativo y nombres descriptivos.

---

# 29. ACCESIBILIDAD

Considerar:

* Contraste adecuado.
* Navegación mediante teclado.
* Estados de foco.
* Etiquetas descriptivas.
* HTML semántico.
* Botones correctamente identificados.
* Mensajes comprensibles.

No depender exclusivamente del color para comunicar información.

---

# 30. MODIFICACIONES

Antes de modificar código existente:

1. Leer el código relacionado.
2. Comprender cómo funciona.
3. Identificar dependencias.
4. Revisar el impacto.
5. Reutilizar lo existente.
6. Evitar romper funcionalidades.

Nunca sobrescribir código sin comprenderlo.

---

# 31. NUEVAS FUNCIONALIDADES

Antes de crear una funcionalidad:

1. Revisar si ya existe algo similar.
2. Analizar la arquitectura.
3. Revisar el modelo de datos.
4. Definir dónde debe vivir la lógica.
5. Reutilizar funciones existentes.
6. Implementar modularmente.
7. Probar su interacción con filtros y componentes.

No introducir complejidad innecesaria.

---

# 32. VALIDACIÓN

Después de cada cambio importante revisar:

* Sintaxis.
* Variables.
* Funciones.
* Referencias.
* IDs.
* Eventos.
* `preventDefault()`.
* Consultas a Supabase.
* RLS.
* Filtros.
* KPIs.
* Gráficos.
* Tablas.
* Responsive.
* Estados de carga.
* Estados vacíos.
* Errores.
* Consistencia de datos.

Una funcionalidad no está terminada simplemente porque el código fue escrito.

---

# 33. REGLAS ABSOLUTAS DE CÓDIGO

Estas reglas **NO son opcionales**:

### PROHIBIDO

```text
var
innerHTML
alert()
confirm()
prompt()
```

### OBLIGATORIO

```text
const / let
document.createElement()
appendChild()
addEventListener()
HTML5 semántico
CSS3 nativo
CSS Grid / Flexbox cuando corresponda
Feedback visual dentro del DOM
```

No utilizar una alternativa equivalente para intentar evadir estas reglas.

---

# 34. TOMA DE DECISIONES

Si el agente tiene dudas:

1. Revisar `CLAUDE.md`.
2. Revisar las especificaciones del proyecto.
3. Revisar el código existente.
4. Revisar la estructura de datos.
5. Si la duda persiste y puede afectar el resultado, **preguntar al usuario antes de tomar una decisión importante**.

No inventar requisitos.

No asumir funcionalidades no solicitadas.

No introducir tecnologías que no hayan sido autorizadas.

---

# 35. PRINCIPIO FINAL

No construir primero y pensar después.

Seguir:

```text
Comprender
    ↓
Analizar
    ↓
Diseñar
    ↓
Implementar
    ↓
Validar
    ↓
Refinar
```

El código debe ser:

**simple + legible + mantenible + seguro + coherente.**

La aplicación debe ayudar al usuario a:

* Comprender información.
* Encontrar información.
* Filtrar información.
* Comparar información.
* Detectar tendencias.
* Tomar decisiones.

Si una funcionalidad no aporta valor real, reconsiderar su implementación.

**La calidad del resultado tiene prioridad sobre la cantidad de código.**
