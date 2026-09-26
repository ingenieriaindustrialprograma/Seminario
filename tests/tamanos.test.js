// Pruebas de A+ / A− (los 6 tamaños del lienzo) y del modo proyector con zoom.
// Uso: node tests/tamanos.test.js   (requiere Playwright con Chromium)
// En cada tamaño y en cada página verifica que ningún texto quede cortado, recortado o fuera del
// lienzo, que ninguna tarjeta quede partida entre diapositivas y que cada portada sea una sola.
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const FUENTE = 'file://' + path.join(__dirname, '..', 'Seminario_final.html');
let fallos = 0;
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fallos++; };

// Revisa la página que se está presentando (medida en píxeles del lienzo, sin la escala de pantalla).
function revisarPagina(page) {
  return page.evaluate(() => {
    const pg = presentPageEl;
    const win = document.getElementById('presentWindow');
    win.style.transform = 'none';
    pg.style.transform = '';
    pg.style.clipPath = '';
    const base = pg.getBoundingClientRect().top;
    const left = pg.getBoundingClientRect().left;
    const U = usableHeight();
    const cortes = presentSlides.slice(1).map((s) => s.top);
    const res = { textoCortado: [], cajaPartida: [], noCabe: [], fueraDelLienzo: [] };
    for (const el of pg.querySelectorAll('*')) {
      if (['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el);
      const top = r.top - base, bottom = r.bottom - base;
      const plegado = !!el.closest('.exp-card-body') && !el.closest('.exp-card.active'); // tarjeta cerrada: oculto a propósito
      if (plegado) continue;
      let recorte = null;
      for (let a = el.parentElement; a && a !== pg; a = a.parentElement) {
        const ac = getComputedStyle(a);
        if (ac.overflow !== 'visible') {
          const ra = a.getBoundingClientRect();
          if (r.bottom > ra.bottom + 1 || r.top < ra.top - 1 || r.right > ra.right + 2 || r.left < ra.left - 2) { recorte = a; break; }
        }
      }
      const txt = [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join('').trim();
      if (txt.length > 1) {
        if (recorte) res.noCabe.push(txt.slice(0, 40));
        else if (cortes.some((y) => top < y - 1 && bottom > y + 1)) res.textoCortado.push(txt.slice(0, 40));
        if (r.right - left > presentCanvas.w + 2 || r.left - left < -2) res.fueraDelLienzo.push(txt.slice(0, 40));
        if (el.clientWidth && el.scrollWidth > el.clientWidth + 1 && !['TD', 'TH'].includes(el.tagName)) res.noCabe.push(txt.slice(0, 40));
      }
      const bg = parseRgba(cs.backgroundColor);
      const esCaja = (bg && bg.a > 0.02) || parseFloat(cs.borderTopWidth) > 0 || cs.backgroundImage !== 'none';
      const adorno = (cs.position === 'absolute' || cs.pointerEvents === 'none') && !el.textContent.trim() && !el.querySelector('img');
      if (esCaja && !adorno && !recorte && r.width >= 40 && bottom - top >= 24 && bottom - top <= U - 8 &&
          cortes.some((y) => top < y - 1 && bottom > y + 1)) {
        res.cajaPartida.push(String(el.className || el.tagName).split(' ')[0] + ' «' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) + '»');
      }
    }
    const primera = presentSlides[0];
    res.portada = presentSlides.filter((s) => s.block === primera.block).length;
    // Portada: sección de pantalla completa que cabe reducida hasta el 60% (la bibliografía entera no lo es)
    const altoPrimera = presentSlides.filter((s) => s.block === primera.block).reduce((a, s) => a + s.height, 0);
    res.esPortada = primera.block.matches('#hero, section[style*="min-height:100vh"]') && altoPrimera <= presentCanvas.h / 0.6;
    res.diapositivas = presentSlides.length;
    fitPresentWindow();
    renderSlide();
    return res;
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto(FUENTE, { waitUntil: 'load' });
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
  await page.waitForTimeout(800);

  const anchos = await page.evaluate(() => PRESENT_CANVAS_WIDTHS);
  for (let ci = 0; ci < anchos.length; ci++) {
    console.log(`\nLienzo ${anchos[ci]} px de ancho (${ci === 3 ? 'normal' : ci > 3 ? 'A+' : 'A−'})`);
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      await page.evaluate((n) => (n === 7 ? goToBiblio() : navigateToModuleDirect(n)), n);
      await page.waitForTimeout(400);
      await page.evaluate((ci) => { localStorage.setItem('gth_lienzo_presentacion', String(ci)); startPresentation(true); }, ci);
      await page.waitForTimeout(600);
      const r = await revisarPagina(page);
      const ej = (a) => (a.length ? ` — ej.: ${a.slice(0, 2).join(' | ')}` : '');
      const problemas = [
        [r.textoCortado, 'texto partido entre diapositivas'],
        [r.cajaPartida, 'tarjeta o cuadro partido'],
        [r.noCabe, 'texto que no cabe en su caja'],
        [r.fueraDelLienzo, 'texto fuera del lienzo']
      ].filter(([a]) => a.length);
      check(problemas.length === 0, `página ${n} (${r.diapositivas} diapositivas): sin textos partidos, recortados ni cuadros partidos` +
        problemas.map(([a, m]) => ` · ${a.length} ${m}${ej(a)}`).join(''));
      if (r.esPortada) check(r.portada === 1, `página ${n}: la portada es una sola diapositiva (${r.portada})`);
      await page.evaluate(() => stopPresentation());
      await page.waitForTimeout(100);
    }
  }

  // Tabla de muchas columnas: en lienzos angostos se muestra como tarjetas legibles
  await page.evaluate(() => navigateToModuleDirect(3));
  await page.waitForTimeout(400);
  for (const ci of [0, 5]) {
    await page.evaluate((ci) => { localStorage.setItem('gth_lienzo_presentacion', String(ci)); startPresentation(true); }, ci);
    await page.waitForTimeout(500);
    const tarjetas = await page.evaluate(() => document.querySelector('#presentWindow table').classList.contains('pm-table-cards'));
    check(tarjetas === (ci === 5), `lienzo ${anchos[ci]}: la tabla de 9 columnas ${ci === 5 ? 'pasa a tarjetas' : 'se mantiene como tabla'}`);
    await page.evaluate(() => stopPresentation());
  }
  check(await page.evaluate(() => !document.querySelector('table.pm-table-cards')), 'al salir, la tabla vuelve a su forma original');

  // Modo proyector con el zoom máximo: nada recortado, sin desplazamiento horizontal, menú dentro de la pantalla
  console.log('\nModo proyector');
  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => { setProjectorMode(true); setProjectorScale(PROJECTOR_SCALES.length - 1); });
    for (const n of [1, 2, 3, 4, 5, 6]) {
      await page.evaluate((n) => navigateToModuleDirect(n), n);
      await page.waitForTimeout(400);
      const r = await page.evaluate((n) => {
        const pg = document.getElementById('page-' + n);
        const recortados = [];
        for (const el of pg.querySelectorAll('*')) {
          const t = [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join('').trim();
          if (t.length < 2 || el.closest('.exp-card-body')) continue;
          const r = el.getBoundingClientRect();
          if (!r.width) continue;
          for (let a = el.parentElement; a && a !== pg; a = a.parentElement) {
            const ac = getComputedStyle(a);
            if (ac.overflow !== 'visible') {
              const ra = a.getBoundingClientRect();
              if (r.bottom > ra.bottom + 1 || r.right > ra.right + 2) recortados.push(t.slice(0, 40));
              break;
            }
          }
        }
        const ocultos = [...pg.querySelectorAll('.reveal')].filter((el) => getComputedStyle(el).opacity === '0').length;
        const nav = document.querySelector('nav').getBoundingClientRect();
        const botones = [...document.querySelectorAll('nav .nav-pill, nav button, nav a')].filter((b) => b.getBoundingClientRect().width);
        const fuera = botones.filter((b) => b.getBoundingClientRect().right > innerWidth + 1).length;
        return { recortados, ocultos, hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2, fuera, navH: nav.height };
      }, n);
      check(!r.recortados.length && !r.ocultos && !r.hscroll && !r.fuera,
        `${w}×${h} módulo ${n}: sin textos recortados, ocultos ni fuera de pantalla` +
        (r.recortados.length ? ` · recortados: ${r.recortados.slice(0, 2).join(' | ')}` : '') +
        (r.ocultos ? ` · ${r.ocultos} bloques ocultos` : '') + (r.hscroll ? ' · desplazamiento horizontal' : '') +
        (r.fuera ? ` · ${r.fuera} botones del menú fuera de la pantalla` : ''));
    }
    await page.evaluate(() => setProjectorMode(false));
  }

  check(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  console.log(fallos ? `\n✗ ${fallos} verificación(es) fallaron` : '\n✓ Todas las verificaciones pasaron');
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
