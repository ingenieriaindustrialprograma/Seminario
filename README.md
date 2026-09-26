# Seminario Liderazgo y Gestión del Talento Humano — MBA UTP

Sitio del seminario, publicado en Vercel: https://seminario-wine.vercel.app

## Cómo se habilitan los módulos

| Módulos | Se habilitan |
|---|---|
| I y II | Siempre disponibles |
| III y IV | Sábado 3 de octubre de 2026, 00:00 (hora de Colombia) |
| V y VI | Sábado 10 de octubre de 2026, 00:00 (hora de Colombia) |

- Los estudiantes no usan contraseñas: cada módulo se abre solo en su fecha.
- La fecha la decide el **servidor** (`api/modulos.js`), no el computador del estudiante. El contenido
  de los módulos III–VI no viene en la página pública: solo lo entrega `/api/modulos` cuando llega su
  fecha. Por eso cambiar la hora del equipo, ver el código fuente o usar la consola no sirve para adelantarse.
- Las descargas siguen la misma regla: solo se descargan módulos ya habilitados, y la descarga del
  seminario completo incluye únicamente lo habilitado hasta ese día.

## Acceso docente (ver todo antes de la fecha)

Abre `https://seminario-wine.vercel.app/?docente` e ingresa la clave de la docente (su correo
institucional; en el código solo está su huella SHA-256 en `api/modulos.js`, `HUELLA_CLAVE_DOCENTE`).
Ese navegador queda en "Modo docente" (todos los módulos y descargas) hasta pulsar **Salir**.

Opcionalmente se puede definir otra clave en Vercel → Settings → Environment Variables →
`CLAVE_DOCENTE` (mínimo 10 caracteres); ambas funcionan. Los estudiantes no ven ningún botón de clave.

## Estructura

| Archivo | Qué es |
|---|---|
| `Seminario_final.html` | **Fuente**: el seminario completo. Aquí se edita. No se publica. |
| `public/index.html` | Generado: la página pública, sin el contenido de III–VI. |
| `api/_contenido/modulo-N.json` | Generado: contenido protegido de cada módulo. |
| `api/modulos.js` | Función de Vercel que entrega los módulos según la fecha (`CALENDARIO`). |
| `scripts/construir.js` | Genera los archivos anteriores a partir de la fuente. |
| `dev-server.js` | Servidor local para probar. |

En `Seminario_final.html` el contenido protegido está entre los marcadores
`<!-- PROTEGIDO:INICIO modulo-N ... -->` y `<!-- PROTEGIDO:FIN modulo-N ... -->`. No los borres.

## Para editar el contenido

1. Edita `Seminario_final.html`.
2. Ejecuta `npm run construir`. Si algo protegido fuera a quedar público, se detiene con un error.
3. Haz commit de `Seminario_final.html`, `public/` y `api/_contenido/`, y push a `main`.

## Presentar en el salón

- **▶ Presentar** (o `/?presentar`): convierte el módulo abierto en diapositivas 16:9 con letra
  grande. Flechas, Av Pág/Re Pág o espacio para avanzar; **Esc** para salir.
- **A+ / A−** (o teclas `+` / `-`): agrandan o reducen todo el contenido de la diapositiva.
- **🎨 Paleta** (o tecla **P**): elige entre Verde, Azul, Vino, Violeta y Alto contraste (fondo
  claro y letra oscura; todos los textos cumplen contraste ≥ 4.5:1). La elección se recuerda.
  **T** vuelve al diseño original oscuro.
- **🖥️ Proyector** (o `/?proyector`): la página normal con fondos claros, zoom y la misma paleta.

Pruebas: `npm run test:presentar` (cortes, cobertura de textos, navegación y contraste por paleta).

## Probar localmente

```bash
npm start                                 # fecha real → http://localhost:3000
FECHA=2026-10-03 npm start                # simula el 3 de octubre
CLAVE_DOCENTE=una-clave-larga npm start   # para probar http://localhost:3000/?docente
```

En Windows (cmd): `set FECHA=2026-10-03 && npm start`.

`Seminario_final.html` también se puede abrir con doble clic: muestra los 6 módulos sin conexión.

## Cambiar fechas

La apertura real se controla en `CALENDARIO`, dentro de `api/modulos.js` (hora de Colombia, UTC-5).
Si cambias una fecha, actualiza también los textos visibles en `Seminario_final.html`
(`SESSION_PROTECTION_CONFIG` y las tarjetas de módulos) y ejecuta `npm run construir`.

## Importante: mantener el repositorio privado

El contenido completo está en este repositorio (`Seminario_final.html` y `api/_contenido/`). Si el
repositorio es público, cualquiera puede leerlo en GitHub sin pasar por las fechas. Mantenlo
**privado**: GitHub → Settings → General → Danger Zone → Change visibility. Vercel puede seguir
desplegando desde un repositorio privado.
