# Plan — Modo diapositivas ("Presentar")

Especificación: `docs/specs/2026-09-26-modo-diapositivas-design.md` (aprobada).

## Técnica
- Al presentar, la página del módulo (`#page-N`) se **mueve** (no se copia) dentro de un escenario
  fijo a pantalla completa con una ventana lógica de 1366×768 escalada con `transform`. Al salir
  vuelve a su lugar. Así se conservan eventos, tarjetas, modales y estado.
- Cada diapositiva es un tramo vertical `[top, top+alto]` de la página: se muestra con
  `translateY` + `clip-path`. Las secciones altas se parten en bordes que no atraviesan
  ningún elemento con texto o imagen.
- Colores de proyector activos por defecto (reusa `applyProjectorTheme`); el zoom del modo
  proyector se desactiva mientras se presenta (la escala la da el escenario).
- Secciones con `min-height:100vh` se fijan a 768px mientras se presenta.

## Tareas
1. **Pruebas primero** — `tests/presentar.test.js` (Playwright): entrar/salir, conteo de
   diapositivas, cobertura total de textos, ningún corte a mitad de elemento, navegación por
   teclado, modales por encima, contraste ≥ 3:1. Verificación: fallan (no existe el modo).
2. **Escenario y armado de diapositivas** — CSS + `buildSlides()` + render.
   Verificación: pruebas de conteo, cobertura y cortes pasan.
3. **Navegación y controles** — teclado (capturado antes del scroll suave), clic por mitades,
   barra inferior, pantalla completa, paso al siguiente módulo, tecla T.
   Verificación: pruebas de navegación pasan.
4. **Integración** — botón en la barra, `?presentar`, modales por encima, oculto en móvil.
   Verificación: todas las pruebas nuevas + pruebas existentes del sitio pasan; capturas revisadas.
5. **Construir y publicar** — `npm run construir`, commit, push a la rama; `main` solo con
   autorización.
