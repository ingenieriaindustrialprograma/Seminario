// Pruebas del modo diapositivas ("Presentar").
// Uso: node tests/presentar.test.js   (requiere Playwright con Chromium)
// Abre Seminario_final.html (los 6 módulos) en un navegador de 1366×768 y 1920×1080.
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const FUENTE = 'file://' + path.join(__dirname, '..', 'Seminario_final.html');
const ALTO = 768;
let fallos = 0;
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fallos++; };

async function abrir(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(FUENTE, { waitUntil: 'load' });
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
  return { page, errores };
}

// Textos visibles de la página del módulo y su posición vertical dentro de ella.
function textosDeLaPagina(page, n) {
  return page.evaluate((n) => {
    const pg = document.getElementById('page-' + n);
    const base = pg.getBoundingClientRect().top;
    const escala = pg.getBoundingClientRect().width / 1366; // el lienzo se escala a la pantalla
    const out = [];
    for (const el of pg.querySelectorAll('*')) {
      if (!['SCRIPT', 'STYLE'].includes(el.tagName) &&
          [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1)) {
        const r = el.getBoundingClientRect();
        let bloque = el;
        while (bloque.parentElement !== pg) bloque = bloque.parentElement;
        const bloqueChico = bloque.getBoundingClientRect().height < 150; // no genera diapositiva (spec §3)
        // Recortado por un contenedor con overflow oculto (p. ej. tarjeta desplegable cerrada): no se ve
        let recortado = false;
        for (let a = el.parentElement; a && a !== pg; a = a.parentElement) {
          if (getComputedStyle(a).overflow !== 'visible') {
            const ra = a.getBoundingClientRect();
            if (r.top < ra.top - 1 || r.bottom > ra.bottom + 1) { recortado = true; break; }
          }
        }
        if (!bloqueChico && !recortado && r.height > 0 && r.width > 0 && getComputedStyle(el).visibility !== 'hidden') {
          out.push({ top: (r.top - base) / escala, bottom: (r.bottom - base) / escala, txt: el.textContent.trim().slice(0, 40) });
        }
      }
    }
    return out;
  }, n);
}

(async () => {
  const browser = await chromium.launch();

  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    console.log(`\nPantalla ${w}×${h}`);
    const { page, errores } = await abrir(browser, w, h);

    check(await page.$('#btnPresent') !== null, 'existe el botón "Presentar" en la barra');
    if (!(await page.$('#btnPresent'))) { await page.close(); continue; }

    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      await page.evaluate((n) => (n === 7 ? goToBiblio() : navigateToModuleDirect(n)), n);
      await page.waitForTimeout(700);
      await page.evaluate(() => startPresentation());
      await page.waitForTimeout(200);

      const info = await page.evaluate(() => ({
        activo: document.documentElement.classList.contains('presenting'),
        slides: presentSlides.map((s) => ({ top: s.top, height: s.height, cut: s.part > 1 })),
        paginaEnEscenario: !!document.querySelector('#presentWindow .page.active')
      }));
      check(info.activo && info.paginaEnEscenario, `página ${n}: entra en modo presentación (${info.slides.length} diapositivas)`);
      check(info.slides.every((s) => s.height <= ALTO + 1), `página ${n}: ninguna diapositiva supera el lienzo de ${ALTO}px`);

      // Cobertura: cada texto cabe completo en alguna diapositiva
      const textos = await textosDeLaPagina(page, n);
      const sinMostrar = textos.filter((t) => !info.slides.some((s) => t.top >= s.top - 1 && t.bottom <= s.top + s.height + 1));
      check(sinMostrar.length === 0, `página ${n}: los ${textos.length} textos aparecen completos en alguna diapositiva` +
        (sinMostrar.length ? ` — faltan ${sinMostrar.length}, ej.: "${sinMostrar[0].txt}"` : ''));

      // Cortes: ningún texto atravesado por el borde superior de una diapositiva de continuación
      const cortados = info.slides.filter((s) => s.cut)
        .flatMap((s) => textos.filter((t) => t.top < s.top - 1 && t.bottom > s.top + 1).map((t) => t.txt));
      check(cortados.length === 0, `página ${n}: ningún corte parte un texto` + (cortados.length ? ` — ej.: "${cortados[0]}"` : ''));

      // Navegación por teclado
      await page.keyboard.press('ArrowRight');
      const i1 = await page.evaluate(() => presentIndex);
      await page.keyboard.press('PageDown');
      const i2 = await page.evaluate(() => presentIndex);
      await page.keyboard.press('ArrowLeft');
      const i3 = await page.evaluate(() => presentIndex);
      check(i2 === Math.min(i1 + 1, info.slides.length - 1) && i3 === i2 - 1, `página ${n}: → / Av Pág / ← navegan`);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      const fuera = await page.evaluate((n) => ({
        activo: document.documentElement.classList.contains('presenting'),
        enSuLugar: document.getElementById('page-' + n).parentElement === document.body
      }), n);
      check(!fuera.activo && fuera.enSuLugar, `página ${n}: Esc sale y la página vuelve a su lugar`);
    }

    // Desplegar una tarjeta durante la presentación: su contenido queda completo en la diapositiva
    await page.evaluate(() => navigateToModuleDirect(4));
    await page.waitForTimeout(700);
    await page.evaluate(() => startPresentation(true));
    const idx = await page.evaluate(() => presentSlides.findIndex((s) => s.block.querySelector('.exp-card')));
    await page.evaluate((i) => presentGo(i), idx);
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const sl = presentSlides[presentIndex];
      const pg = document.querySelector('#presentWindow .page');
      const cards = [...sl.block.querySelectorAll('.exp-card')];
      window.__tarjeta = cards[0];
      cards[0].click();
    });
    await page.waitForTimeout(800);
    const dentro = await page.evaluate(() => {
      const pg = document.querySelector('#presentWindow .page');
      const esc = pg.getBoundingClientRect().width / 1366;
      const base = pg.getBoundingClientRect().top;
      const r = window.__tarjeta.getBoundingClientRect();
      const top = (r.top - base) / esc, bottom = (r.bottom - base) / esc;
      const sl = presentSlides[presentIndex];
      return window.__tarjeta.classList.contains('active') && top >= sl.top - 1 && bottom <= sl.top + sl.height + 1;
    });
    check(dentro, 'al desplegar una tarjeta, queda completa dentro de la diapositiva actual');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Modales por encima del escenario
    await page.evaluate(() => { navigateToModuleDirect(1); });
    await page.waitForTimeout(700);
    await page.evaluate(() => { startPresentation(); openModal('desafio1'); });
    await page.waitForTimeout(200);
    const encima = await page.evaluate(() => {
      const box = document.getElementById('modalBox').getBoundingClientRect();
      const el = document.elementFromPoint(box.left + box.width / 2, box.top + 30);
      return !!el && !!el.closest('#modalOverlay');
    });
    check(encima, 'los modales de conceptos se abren por encima de la diapositiva');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    check(await page.evaluate(() => document.documentElement.classList.contains('presenting')),
      'Esc con un modal abierto cierra el modal y sigue presentando');
    await page.keyboard.press('Escape');

    check(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
    await page.close();
  }

  // ?presentar abre directamente en modo presentación
  const { page } = await abrir(browser, 1366, 768);
  await page.goto(FUENTE + '?presentar', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  check(await page.evaluate(() => document.documentElement.classList.contains('presenting')), '?presentar abre en modo presentación');

  await browser.close();
  console.log(fallos ? `\n✗ ${fallos} verificación(es) fallaron` : '\n✓ Todas las verificaciones pasaron');
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
