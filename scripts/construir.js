// Genera la versión publicable del seminario a partir de Seminario_final.html:
//   public/index.html              → página pública SIN el contenido de los módulos III–VI
//   api/_contenido/modulo-N.json   → contenido protegido; solo lo entrega /api/modulos en su fecha
//
// Uso: npm run construir   (cada vez que edites Seminario_final.html, antes de hacer commit)
//
// El contenido protegido se delimita en Seminario_final.html con los marcadores
//   <!-- PROTEGIDO:INICIO modulo-N pagina -->        ... <!-- PROTEGIDO:FIN modulo-N pagina -->
//   <!-- PROTEGIDO:INICIO modulo-N bibliografia -->  ... <!-- PROTEGIDO:FIN modulo-N bibliografia -->
// Si falta un marcador o algo protegido quedara en la página pública, el script se detiene
// sin escribir nada.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FUENTE = path.join(RAIZ, 'Seminario_final.html');
const SALIDA_PUBLICA = path.join(RAIZ, 'public', 'index.html');
const DIR_CONTENIDO = path.join(RAIZ, 'api', '_contenido');
const MODULOS_PROTEGIDOS = [3, 4, 5, 6];

const AVISO_GENERADO =
  '<!-- ARCHIVO GENERADO por scripts/construir.js a partir de Seminario_final.html. ' +
  'No lo edites aquí: edita Seminario_final.html y ejecuta "npm run construir". -->';
const RESERVA_BIBLIOGRAFIA =
  '<div class="bib-pendiente">🔒 Las referencias de este módulo se publicarán junto con el módulo, en la fecha de su sesión.</div>\n';

function fallar(mensaje) {
  console.error('\n✗ ' + mensaje + '\n  No se generó ningún archivo.\n');
  process.exit(1);
}

function contar(texto, buscado) {
  return texto.split(buscado).length - 1;
}

// Quita del HTML el bloque entre marcadores y devuelve su contenido.
function extraerBloque(html, num, parte, reemplazo) {
  const inicio = `<!-- PROTEGIDO:INICIO modulo-${num} ${parte} -->`;
  const fin = `<!-- PROTEGIDO:FIN modulo-${num} ${parte} -->`;
  if (contar(html, inicio) !== 1 || contar(html, fin) !== 1) {
    fallar(`Debe haber exactamente un marcador "${inicio}" y uno "${fin}" en Seminario_final.html.`);
  }
  const a = html.indexOf(inicio);
  const b = html.indexOf(fin);
  if (b < a) fallar(`El marcador de fin de modulo-${num} ${parte} aparece antes que el de inicio.`);
  return {
    html: html.slice(0, a) + reemplazo + html.slice(b + fin.length + (html[b + fin.length] === '\n' ? 1 : 0)),
    contenido: html.slice(a + inicio.length, b).replace(/^\n/, '')
  };
}

function construir() {
  if (!fs.existsSync(FUENTE)) fallar('No se encontró Seminario_final.html en la raíz del proyecto.');
  let html = fs.readFileSync(FUENTE, 'utf8');
  const protegidos = [];

  for (const num of MODULOS_PROTEGIDOS) {
    const aperturaPagina = `<div id="page-${num}" class="page">`;
    if (contar(html, aperturaPagina) !== 1) fallar(`No se encontró (o está repetido) ${aperturaPagina}.`);

    const pagina = extraerBloque(html, num, 'pagina',
      `<!-- Contenido del módulo ${num}: lo entrega /api/modulos a partir de su fecha de apertura. -->\n`);
    html = pagina.html.replace(aperturaPagina, `<div id="page-${num}" class="page" data-contenido="pendiente">`);

    const bibliografia = extraerBloque(html, num, 'bibliografia', RESERVA_BIBLIOGRAFIA);
    html = bibliografia.html;

    protegidos.push({ num, pagina: pagina.contenido, bibliografia: bibliografia.contenido });
  }

  // ── Verificaciones: nada protegido puede quedar en la página pública ──
  if (html.includes('PROTEGIDO:INICIO') || html.includes('PROTEGIDO:FIN')) {
    fallar('Quedaron marcadores PROTEGIDO en la página pública (¿marcadores de más o mal escritos?).');
  }
  if (/<script[^>]*data-modales-modulo=/.test(html)) {
    fallar('Quedaron datos de modales de módulos protegidos en la página pública.');
  }
  for (const { num, pagina, bibliografia } of protegidos) {
    const vacia = new RegExp(`<div id="page-${num}" class="page" data-contenido="pendiente">\\s*(<!--[^]*?-->\\s*)?</div><!-- /page-${num} -->`);
    if (!vacia.test(html)) fallar(`La página del módulo ${num} no quedó vacía en la versión pública.`);
    if (!pagina.includes(`data-modales-modulo="${num}"`)) {
      fallar(`El contenido del módulo ${num} no incluye sus datos de modales (<script type="application/json" data-modales-modulo="${num}">).`);
    }
    const bloqueModales = /<script type="application\/json" data-modales-modulo="\d+">([^]*?)<\/script>/.exec(pagina);
    let claves;
    try {
      claves = Object.keys(JSON.parse(bloqueModales[1]));
    } catch (e) {
      fallar(`Los datos de modales del módulo ${num} no son JSON válido: ${e.message}`);
    }
    for (const clave of claves) {
      if (html.includes(`openModal('${clave}')`) || html.includes(`openModal("${clave}")`)) {
        fallar(`La página pública todavía usa el modal protegido "${clave}" del módulo ${num}.`);
      }
      if (new RegExp(`\\b${clave}\\s*:\\s*\\{`).test(html)) {
        fallar(`Los datos del modal protegido "${clave}" (módulo ${num}) siguen en la página pública.`);
      }
    }
    if (!bibliografia.trim()) fallar(`La bibliografía del módulo ${num} quedó vacía.`);
  }

  // ── Escritura (solo si todo lo anterior pasó) ──
  html = html.replace(/^<!DOCTYPE html>\n?/i, (doctype) => doctype.replace(/\n?$/, '\n') + AVISO_GENERADO + '\n');
  fs.mkdirSync(path.dirname(SALIDA_PUBLICA), { recursive: true });
  fs.mkdirSync(DIR_CONTENIDO, { recursive: true });
  fs.writeFileSync(SALIDA_PUBLICA, html);
  for (const { num, pagina, bibliografia } of protegidos) {
    fs.writeFileSync(path.join(DIR_CONTENIDO, `modulo-${num}.json`),
      JSON.stringify({ modulo: num, pagina, bibliografia }) + '\n');
  }

  const kb = (bytes) => Math.round(bytes / 1024) + ' KB';
  console.log('✓ public/index.html (' + kb(Buffer.byteLength(html)) + ') — sin el contenido de los módulos ' + MODULOS_PROTEGIDOS.join(', '));
  for (const { num, pagina, bibliografia } of protegidos) {
    console.log(`✓ api/_contenido/modulo-${num}.json (${kb(Buffer.byteLength(pagina) + Buffer.byteLength(bibliografia))})`);
  }
}

construir();
