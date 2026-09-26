// Pruebas del modo diapositivas ("Presentar").
// Uso: node tests/presentar.test.js   (requiere Playwright con Chromium)
// Abre Seminario_final.html (los 6 módulos) en un navegador de 1366×768 y 1920×1080.
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const FUENTE = 'file://' + path.join(__dirname, '..', 'Seminario_final.html');
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
    const escala = pg.getBoundingClientRect().width / (typeof presentCanvas !== "undefined" ? presentCanvas.w : 1366); // el lienzo se escala a la pantalla
    const out = [];
    for (const el of pg.querySelectorAll('*')) {
      if (!['SCRIPT', 'STYLE'].includes(el.tagName) &&
          [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 1)) {
        const r = el.getBoundingClientRect();
        let bloque = el;
        while (bloque.parentElement !== pg) bloque = bloque.parentElement;
        const bloqueChico = bloque.getBoundingClientRect().height / escala < 150; // no genera diapositiva (spec §3)
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
        slides: presentSlides.map((s) => ({ top: s.top, height: s.height, escala: s.scale || 1, cut: s.part > 1,
          portada: s.block.matches('#hero, section[style*="min-height:100vh"]') && s.parts === 1 })),
        lienzo: typeof presentCanvas !== 'undefined' ? presentCanvas : { w: 1366, h: 768 },
        paginaEnEscenario: !!document.querySelector('#presentWindow .page.active')
      }));
      check(info.activo && info.paginaEnEscenario, `página ${n}: entra en modo presentación (${info.slides.length} diapositivas)`);
      const ALTO = info.lienzo.h;
      check(info.slides.every((s) => s.height * s.escala <= ALTO + 1), `página ${n}: ninguna diapositiva supera el lienzo de ${ALTO}px`);
      // Contenido: como mucho al 80%. Portadas: hasta el 60%, para que siempre sean una sola diapositiva.
      const reducidas = info.slides.filter((s) => s.escala < 1);
      check(reducidas.every((s) => s.escala >= (s.portada ? 0.6 : 0.8) - 1e-6), `página ${n}: ninguna diapositiva se reduce a menos del 80% (portada: 60%) (${reducidas.length} reducidas levemente)`);

      // Cobertura: cada texto cabe completo en alguna diapositiva
      const textos = await textosDeLaPagina(page, n);
      const sinMostrar = textos.filter((t) => !info.slides.some((s) => t.top >= s.top - 1 && t.bottom <= s.top + s.height + 1));
      check(sinMostrar.length === 0, `página ${n}: los ${textos.length} textos aparecen completos en alguna diapositiva` +
        (sinMostrar.length ? ` — faltan ${sinMostrar.length}, ej.: "${sinMostrar[0].txt}"` : ''));

      // Cortes: ningún texto atravesado por el borde superior de una diapositiva de continuación
      const cortados = info.slides.filter((s) => s.cut)
        .flatMap((s) => textos.filter((t) => t.top < s.top - 1 && t.bottom > s.top + 1).map((t) => t.txt));
      check(cortados.length === 0, `página ${n}: ningún corte parte un texto` + (cortados.length ? ` — ej.: "${cortados[0]}"` : ''));

      // Cuadros, tarjetas e imágenes: ninguno partido entre diapositivas y ninguna tira suelta en los bordes
      const cajas = await page.evaluate(() => {
        const pg = document.querySelector('#presentWindow .page');
        const lienzo = typeof presentCanvas !== 'undefined' ? presentCanvas : { w: 1366, h: 768 };
        const esc = pg.getBoundingClientRect().width / lienzo.w;
        const base = pg.getBoundingClientRect().top;
        const out = [];
        for (const el of pg.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width < 40 || r.height < 24) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
          let recortado = false;
          for (let a = el.parentElement; a && a !== pg; a = a.parentElement) {
            if (getComputedStyle(a).overflow !== 'visible') {
              const ra = a.getBoundingClientRect();
              if (r.top < ra.top - 1 || r.bottom > ra.bottom + 1) { recortado = true; break; }
            }
          }
          if (recortado) continue;
          const bg = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(cs.backgroundColor);
          const tieneFondo = bg && (bg[4] === undefined ? 1 : +bg[4]) > 0.02;
          const esCaja = el.tagName === 'IMG' || tieneFondo || parseFloat(cs.borderTopWidth) > 0 ||
            cs.backgroundImage !== 'none' || cs.boxShadow !== 'none';
          if (!esCaja || el.closest('.bib-pendiente')) continue;
          if ((cs.position === 'absolute' || cs.pointerEvents === 'none') && !el.textContent.trim() && !el.querySelector('img')) continue; // adorno
          let bloque = el;
          while (bloque.parentElement && bloque.parentElement !== pg) bloque = bloque.parentElement;
          if (bloque.getBoundingClientRect().height / esc < 150) continue; // bloque sin diapositiva (spec §3)
          // Extensión visible de la sombra por arriba y por abajo
          let sArriba = 0, sAbajo = 0;
          if (cs.boxShadow !== 'none') {
            for (const s of cs.boxShadow.split(/,(?![^(]*\))/)) {
              if (/inset/.test(s)) continue;
              const nums = (s.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
              const [, dy = 0, blur = 0, spread = 0] = nums;
              sAbajo = Math.max(sAbajo, dy + blur * 0.5 + spread);
              sArriba = Math.max(sArriba, -dy + blur * 0.5 + spread);
            }
          }
          out.push({ top: (r.top - base) / esc, bottom: (r.bottom - base) / esc,
            vTop: (r.top - base) / esc - Math.max(0, sArriba), vBottom: (r.bottom - base) / esc + Math.max(0, sAbajo),
            nombre: (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName) + ' "' + el.textContent.trim().slice(0, 25) + '"' });
        }
        return out;
      });
      const util = ALTO - 44;
      const partidas = cajas.filter((c) => c.bottom - c.top <= util &&
        !info.slides.some((s) => c.top >= s.top - 1 && c.bottom <= s.top + s.height + 1));
      check(partidas.length === 0, `página ${n}: ningún cuadro, tarjeta o imagen queda partido` +
        (partidas.length ? ` — ${partidas.length}, ej.: ${partidas[0].nombre}` : ''));
      const tiras = [];
      for (let i = 0; i < info.slides.length; i++) {
        const encontradas = await page.evaluate((i) => {
          presentGo(i);
          const s = presentSlides[i];
          const pg = document.querySelector('#presentWindow .page');
          const esc = pg.getBoundingClientRect().width / presentCanvas.w;
          const esc2 = esc; // el ancho medido de la página ya incluye la reducción de la diapositiva
          const base = pg.getBoundingClientRect().top;
          const fin = s.top + s.height;
          const out = [];
          for (const el of pg.querySelectorAll('*')) {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (r.width < 40 || r.height < 24 || cs.visibility === 'hidden') continue;
            const top = (r.top - base) / esc2, bottom = (r.bottom - base) / esc2;
            const dentro = top >= s.top - 1 && bottom <= fin + 1;
            if (dentro) continue;
            // Totalmente recortado por un contenedor (p. ej. tarjeta desplegable cerrada): no se ve
            let oculto = false;
            for (let a = el.parentElement; a && a !== pg; a = a.parentElement) {
              if (getComputedStyle(a).overflow !== 'visible') {
                const ra = a.getBoundingClientRect();
                if (ra.height < 1 || r.bottom <= ra.top || r.top >= ra.bottom) { oculto = true; break; }
              }
            }
            if (oculto) continue;
            const bg = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(cs.backgroundColor);
            const fondo = bg && (bg[4] === undefined ? 1 : +bg[4]) > 0.02;
            const borde = parseFloat(cs.borderTopWidth) > 0 || cs.backgroundImage !== 'none';
            const sombra = cs.boxShadow !== 'none';
            if (!fondo && !borde && !sombra) continue;
            if ((cs.position === 'absolute' || cs.pointerEvents === 'none') && !el.textContent.trim() && !el.querySelector('img')) continue; // adorno
            let bloque = el;
            while (bloque.parentElement && bloque.parentElement !== pg) bloque = bloque.parentElement;
            if (bloque.getBoundingClientRect().height / esc2 < 150) continue;
            const cuerpo = Math.min(bottom, fin) - Math.max(top, s.top);
            if ((fondo || borde) && cuerpo > 0.5 && cuerpo < 24) out.push('borde de ' + (el.className || el.tagName));
            if (sombra && cuerpo <= 0.5) {
              let arriba = 0, abajo = 0;
              for (const sh of cs.boxShadow.split(/,(?![^(]*\))/)) {
                if (/inset/.test(sh)) continue;
                const nums = (sh.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
                const [, dy = 0, blur = 0, spread = 0] = nums;
                abajo = Math.max(abajo, dy + blur + spread);
                arriba = Math.max(arriba, -dy + blur + spread);
              }
              if (bottom + abajo > s.top + 1 && top - arriba < fin - 1) out.push('sombra de ' + (el.className || el.tagName));
            }
          }
          return out;
        }, i);
        encontradas.forEach((x) => tiras.push(`diap. ${i + 1}: ${x}`));
      }
      await page.evaluate(() => presentGo(0));
      check(tiras.length === 0, `página ${n}: ninguna tira suelta de un cuadro en los bordes` +
        (tiras.length ? ` — ${tiras.length}, ej.: ${tiras[0]}` : ''));

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
      const esc = pg.getBoundingClientRect().width / (typeof presentCanvas !== 'undefined' ? presentCanvas.w : 1366);
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

  // Paletas de color: todo texto de cada página cumple contraste AA (≥ 4.5:1) con su fondo.
  // Se omiten los emoji (glifos de color) que no son texto.
  await page.goto(FUENTE, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const paletas = await page.evaluate(() => PALETTES.filter(p => p.id !== 'original').map(p => p.id));
  for (const paleta of paletas) {
    const bajos = [];
    for (const n of [1, 2, 3, 4, 5, 6, 7]) {
      await page.evaluate((n) => (n === 7 ? goToBiblio() : navigateToModuleDirect(n)), n);
      await page.waitForTimeout(500);
      await page.evaluate((x) => { startPresentation(true); setPalette(x); }, paleta);
      await page.waitForTimeout(250);
      bajos.push(...await page.evaluate(() => {
        const P = (s) => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(s || ''); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
        const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
        const mix = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
        const fondo = (el) => {
          const capas = [];
          for (let a = el; a; a = a.parentElement) {
            const cs = getComputedStyle(a);
            if (cs.backgroundImage.includes('gradient')) {
              const st = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(P).filter((c) => c && c.a >= 0.6);
              if (st.length) { capas.push({ r: st.reduce((s, c) => s + c.r, 0) / st.length, g: st.reduce((s, c) => s + c.g, 0) / st.length, b: st.reduce((s, c) => s + c.b, 0) / st.length, a: 1 }); break; }
            }
            const c = P(cs.backgroundColor);
            if (c && c.a > 0) { capas.push(c); if (c.a >= 0.95) break; }
          }
          let r = { r: 255, g: 255, b: 255, a: 1 };
          for (let i = capas.length - 1; i >= 0; i--) r = mix(capas[i], r);
          return r;
        };
        const out = [];
        for (const el of document.querySelectorAll('#presentWindow .page *')) {
          const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
          if (txt.length < 2 || /^[\p{Extended_Pictographic}\uFE0F\s]+$/u.test(txt)) continue;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (!r.width || !r.height || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
          const bg = fondo(el);
          const fg = mix(P(cs.color), bg);
          const ratio = (Math.max(L(fg), L(bg)) + 0.05) / (Math.min(L(fg), L(bg)) + 0.05);
          if (ratio < 4.5) out.push(ratio.toFixed(2) + ' «' + txt.slice(0, 40) + '»');
        }
        return out;
      }));
      await page.evaluate(() => stopPresentation());
    }
    check(bajos.length === 0, `paleta ${paleta}: todos los textos con contraste ≥ 4.5:1` + (bajos.length ? ' — ' + bajos.slice(0, 4).join(' | ') : ''));
  }

  await browser.close();
  console.log(fallos ? `\n✗ ${fallos} verificación(es) fallaron` : '\n✓ Todas las verificaciones pasaron');
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
