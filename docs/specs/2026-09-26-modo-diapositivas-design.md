# Modo diapositivas ("Presentar") — Especificación de diseño

Fecha: 2026-09-26 · Estado: pendiente de aprobación

## Problema

En el salón el sitio se proyecta como una página larga con scroll: la letra queda pequeña, los
fondos oscuros no se ven y la docente debe desplazarse a mano. Se necesita una forma de presentar
tipo PowerPoint **sin perder ni duplicar contenido** y sin cambiar lo que ven los estudiantes.

## Decisiones tomadas

1. Objetivo: un modo diapositivas para proyectar; la versión web de estudiantes no cambia.
2. Secciones más altas que una pantalla se **dividen en varias diapositivas**.
3. Enfoque **automático sobre el sitio**: las diapositivas se generan en el navegador a partir de
   las secciones existentes. Lo que se edite en `Seminario_final.html` aparece en las diapositivas.

## Diseño

### 1. Entrar y salir
- Botón **▶ Presentar** en la barra superior (junto a "Proyector"). También con la tecla **F5**
  o el enlace `/?presentar`.
- Presenta el **módulo que está abierto**, empezando por la sección visible en ese momento.
- Pide pantalla completa al navegador. **Esc** sale y vuelve al mismo punto del sitio.
- Oculto en pantallas pequeñas (celulares).

### 2. Lienzo 16:9 fijo
- Cada diapositiva es un lienzo lógico de **1366 × 768** que se escala para llenar la pantalla
  (con bandas si la proporción no es 16:9). Así se ve igual en cualquier proyector y todo
  (letra, imágenes, espacios) crece en proporción.
- Colores del **modo proyector** (fondos claros, texto oscuro de alto contraste) activados por
  defecto; la tecla **T** alterna con los colores originales.

### 3. Cómo se arman las diapositivas
- Cada bloque de primer nivel de la página del módulo (secciones: portada, agenda, cita,
  cuadrículas de tarjetas, etc.) es una diapositiva.
- Si un bloque es más alto que el lienzo, se parte en los **bordes naturales** de su contenido
  (filas de tarjetas, párrafos, elementos de lista), nunca a mitad de una tarjeta o texto.
- Las diapositivas de continuación muestran arriba una cinta discreta con el **título de la
  sección y "(2/3)"**.
- Bloques muy pequeños (por ejemplo, la barra "Siguiente módulo" o el pie) no generan diapositiva.

### 4. Navegación
- **→, espacio, Re Pág/Av Pág, clic en la mitad derecha**: siguiente. **←**: anterior.
  **Inicio/Fin**: primera/última.
- Abajo: número "12 / 24", barra de progreso fina y botones ◀ ▶ ✕ que se atenúan si no se
  mueve el mouse (compatibles con presentadores inalámbricos que envían flechas o Av/Re Pág).
- Transición suave (fundido corto) entre diapositivas.
- Al terminar un módulo, "→" pasa al siguiente módulo si ya está habilitado.

### 5. Interactividad que se conserva
- Las tarjetas que se expanden y los modales de conceptos siguen funcionando con clic dentro
  de la diapositiva (el modal se abre encima).
- Solo se presentan módulos cuyo contenido ya está cargado (misma regla de fechas y acceso docente).

### 6. Fuera de alcance
- Rediseñar a mano secciones individuales.
- Notas del orador, vista de presentador en dos pantallas, exportar a PowerPoint/PDF.

## Criterios de éxito
- Todas las secciones de los 6 módulos y la bibliografía aparecen en alguna diapositiva
  (verificado automáticamente: ningún texto del módulo queda sin mostrarse).
- Ninguna diapositiva corta una tarjeta o un párrafo, ni deja contenido fuera del lienzo.
- Contraste de todos los textos ≥ 3:1 con los colores de proyector.
- El sitio normal, las descargas y la apertura por fecha siguen funcionando igual
  (las pruebas existentes siguen pasando).
