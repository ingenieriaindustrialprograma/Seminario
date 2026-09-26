// Pruebas de interactividad dentro del modo presentación, con clics reales: tarjetas desplegables,
// modales de conceptos, ventana de actividades de evaluación, imágenes ampliadas y tarjetas de módulo.
// Uso: node tests/interactivo.test.js   (requiere Playwright con Chromium)
const path=require('path');const {execSync}=require('child_process');
const {chromium}=require(path.join(execSync('npm root -g').toString().trim(),'playwright'));
const FUENTE='file://'+path.join(__dirname,'..','Seminario_final.html');
let totalFallas=0;
async function probar(b, CI, W, H){const p=await b.newPage({viewport:{width:W,height:H}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(FUENTE,{waitUntil:'load'}); await p.waitForTimeout(1000);
const fallas=[]; let tarjetas=0, modales=0;
const slideOf=(sel,idx)=>p.evaluate(([sel,idx])=>{ // lleva a la diapositiva que contiene el elemento
  const el=document.querySelectorAll('#presentWindow .page '+sel)[idx]; if(!el) return -1;
  const pg=presentPageEl; const win=document.getElementById('presentWindow');
  const saveT=pg.style.transform, saveC=pg.style.clipPath, saveW=win.style.transform;
  win.style.transform='none'; pg.style.transform=''; pg.style.clipPath='';
  const base=pg.getBoundingClientRect().top; const r=el.getBoundingClientRect();
  const t=r.top-base, bt=r.bottom-base;
  let i=presentSlides.findIndex(s=>t>=s.top-1&&bt<=s.top+s.height+1);
  if(i<0) i=presentSlides.findIndex(s=>t>=s.top-1&&t<s.top+s.height);
  fitPresentWindow(); presentGo(Math.max(0,i)); return i;
},[sel,idx]);
const visible=(sel,idx)=>p.evaluate(([sel,idx])=>{ // ¿el elemento se ve completo en la diapositiva actual?
  const el=document.querySelectorAll('#presentWindow .page '+sel)[idx]; const s=presentSlides[presentIndex];
  const pg=presentPageEl; const win=document.getElementById('presentWindow');
  const k=win.getBoundingClientRect().width/presentCanvas.w; // escala en pantalla
  const wr=win.getBoundingClientRect(); const r=el.getBoundingClientRect();
  const inside = r.top>=wr.top-2 && r.bottom<=wr.bottom+2 && r.left>=wr.left-2 && r.right<=wr.right+2;
  // texto recortado dentro del cuerpo desplegado
  const body=el.querySelector('.exp-card-body'); const clipped = body ? body.scrollHeight>body.clientHeight+2 : false;
  return {inside, clipped, top:Math.round(r.top-wr.top), bottom:Math.round(r.bottom-wr.top), winH:Math.round(wr.height)};
},[sel,idx]);
for (const n of [1,2,3,4,5,6,7]) {
  await p.evaluate(n=> n===7?goToBiblio():navigateToModuleDirect(n), n); await p.waitForTimeout(500);
  await p.evaluate(ci=>{localStorage.setItem('gth_lienzo_presentacion',ci); startPresentation(true);}, CI); await p.waitForTimeout(800);
  // 1) tarjetas desplegables
  const nCards=await p.evaluate(()=>document.querySelectorAll('#presentWindow .page .exp-card[onclick*="toggleCard"]').length);
  for (let i=0;i<nCards;i++){
    const si=await slideOf('.exp-card[onclick*="toggleCard"]',i); await p.waitForTimeout(250);
    const hdr=await p.evaluate(i=>{const c=document.querySelectorAll('#presentWindow .page .exp-card[onclick*="toggleCard"]')[i]; const r=c.querySelector('.exp-card-header').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};},i);
    await p.mouse.click(hdr.x,hdr.y); await p.waitForTimeout(1100);
    const st=await p.evaluate(i=>({active:document.querySelectorAll('#presentWindow .page .exp-card[onclick*="toggleCard"]')[i].classList.contains('active'), presenting, pageOk: presentPageEl && presentPageEl.classList.contains('active')}),i);
    const v=await visible('.exp-card[onclick*="toggleCard"]',i);
    tarjetas++;
    const nombre=await p.evaluate(i=>document.querySelectorAll('#presentWindow .page .exp-card[onclick*="toggleCard"]')[i].querySelector('.exp-card-title,.exp-card-header').textContent.trim().slice(0,35),i);
    if(!st.active||!st.presenting||!st.pageOk) fallas.push(`m${n} tarjeta «${nombre}»: no se desplegó o se perdió la presentación ${JSON.stringify(st)}`);
    else { if(!v.inside) fallas.push(`m${n} tarjeta «${nombre}»: desplegada no cabe en la diapositiva ${JSON.stringify(v)}`); if(v.clipped) fallas.push(`m${n} tarjeta «${nombre}»: el texto desplegado queda recortado`); }
    const hdr2=await p.evaluate(i=>{const c=document.querySelectorAll('#presentWindow .page .exp-card[onclick*="toggleCard"]')[i]; const r=c.querySelector('.exp-card-header').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};},i);
    await p.mouse.click(hdr2.x,hdr2.y).catch(()=>{}); await p.waitForTimeout(700); // cerrar
    const cerrada=await p.evaluate(i=>!document.querySelectorAll('#presentWindow .page .exp-card[onclick*="toggleCard"]')[i].classList.contains('active'),i);
    if(!cerrada) fallas.push(`m${n} tarjeta «${nombre}»: no se cierra con un segundo clic`);
    await p.evaluate(()=>document.querySelectorAll('#presentWindow .exp-card.active').forEach(c=>{c.classList.remove('active')})); 
  }
  // 2) modales de conceptos (una muestra por página: los 3 primeros)
  const nMod=await p.evaluate(()=>document.querySelectorAll('#presentWindow .page [onclick^="openModal"]').length);
  for (let i=0;i<Math.min(nMod,3);i++){
    await slideOf('[onclick^="openModal"]',i); await p.waitForTimeout(250);
    const c=await p.evaluate(i=>{const el=document.querySelectorAll('#presentWindow .page [onclick^="openModal"]')[i];const r=el.getBoundingClientRect();return {x:r.left+Math.min(40,r.width/2),y:r.top+r.height/2};},i);
    await p.mouse.click(c.x,c.y); await p.waitForTimeout(600);
    const m=await p.evaluate(()=>{const o=document.getElementById('modalOverlay'); const bx=document.getElementById('modalBox')||o.querySelector('.modal-box'); const r=bx.getBoundingClientRect();
      const desc=document.getElementById('modalDesc'); const fs=parseFloat(getComputedStyle(desc).fontSize)*(parseFloat(bx.style.zoom||getComputedStyle(bx).zoom)||1);
      const top=document.elementFromPoint(r.left+r.width/2,r.top+20);
      return {open:o.classList.contains('open'), fits:r.top>=-1&&r.bottom<=innerHeight+1, onTop: !!top && !!top.closest('#modalOverlay'), fs:Math.round(fs), w:Math.round(r.width), h:Math.round(r.height), presenting};});
    modales++;
    if(!m.open||!m.onTop||!m.fits) fallas.push(`m${n} modal ${i}: ${JSON.stringify(m)}`);
    const minFs=await p.evaluate(()=>0.8*PRESENT_MIN_FONT*Math.min(innerWidth/presentCanvas.w,innerHeight/presentCanvas.h)); if(m.fs < minFs) fallas.push(`m${n} modal ${i}: letra del modal pequeña en pantalla (${m.fs}px) ${JSON.stringify(m)}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const after=await p.evaluate(()=>({open:document.getElementById('modalOverlay').classList.contains('open'),presenting}));
    if(after.open||!after.presenting) fallas.push(`m${n} modal ${i}: Esc no cierra bien ${JSON.stringify(after)}`);
  }
  // 3) actividades de evaluación y 4) imágenes ampliables y 5) tarjetas de módulo
  if (n===1) {
    await slideOf('.eval-more',0); await p.waitForTimeout(300);
    const c=await p.evaluate(()=>{const r=document.querySelector('#presentWindow .eval-more').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
    await p.mouse.click(c.x,c.y); await p.waitForTimeout(500);
    const e=await p.evaluate(()=>{const m=document.getElementById('evalModal'); const card=m.querySelector('.unlock-modal-card'); const r=card.getBoundingClientRect(); const li=card.querySelector('li'); const fs=parseFloat(getComputedStyle(li).fontSize)*(parseFloat(getComputedStyle(card).zoom)||1);
      const top=document.elementFromPoint(r.left+r.width/2,r.top+30); return {open:m.classList.contains('active'), onTop:!!top&&!!top.closest('#evalModal'), fits:r.bottom<=innerHeight+1&&r.top>=-1, scroll: card.scrollHeight>card.clientHeight+2, fs:Math.round(fs), presenting, idx:presentIndex};});
    if(!e.open||!e.onTop) fallas.push('evaluación: la ventana de actividades no se abre encima '+JSON.stringify(e));
    const minFs=await p.evaluate(()=>0.8*PRESENT_MIN_FONT*Math.min(innerWidth/presentCanvas.w,innerHeight/presentCanvas.h)); if(e.fs<minFs) fallas.push('evaluación: letra pequeña en pantalla '+JSON.stringify(e));
    if(e.scroll) fallas.push('evaluación: la ventana necesita desplazarse (no se ve completa) '+JSON.stringify(e));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const e2=await p.evaluate(()=>({open:document.getElementById('evalModal').classList.contains('active'),presenting}));
    if(e2.open||!e2.presenting) fallas.push('evaluación: Esc no cierra la ventana o sale de la presentación '+JSON.stringify(e2));
    // tarjeta de módulo
    await slideOf('.mod-card[onclick]',1); await p.waitForTimeout(300);
    const mc=await p.evaluate(()=>{const r=document.querySelectorAll('#presentWindow .mod-card[onclick]')[1].getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
    await p.mouse.click(mc.x,mc.y); await p.waitForTimeout(1600);
    const g=await p.evaluate(()=>({presenting, page: presentPageEl&&presentPageEl.id, active:[...document.querySelectorAll('.page.active')].map(x=>x.id), inStage: [...document.querySelectorAll('#presentWindow .page')].map(x=>x.id), slides:presentSlides.length, idx:presentIndex}));
    if(!(g.presenting && g.page==='page-2' && g.active.join()==='page-2' && g.inStage.join()==='page-2')) fallas.push('tarjeta de módulo: al hacer clic el estado queda inconsistente '+JSON.stringify(g));
    await p.evaluate(()=>{ if(presenting) stopPresentation(); navigateToModuleDirect(1); }); await p.waitForTimeout(500);
    await p.evaluate(ci=>startPresentation(true), CI); await p.waitForTimeout(600);
  }
  const nLb=await p.evaluate(()=>document.querySelectorAll('#presentWindow .page [onclick^="openLightbox"]').length);
  for (let i=0;i<nLb;i++){
    await slideOf('[onclick^="openLightbox"]',i); await p.waitForTimeout(250);
    const c=await p.evaluate(i=>{const r=document.querySelectorAll('#presentWindow .page [onclick^="openLightbox"]')[i].getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};},i);
    await p.mouse.click(c.x,c.y); await p.waitForTimeout(500);
    const l=await p.evaluate(()=>{const o=document.getElementById('lightbox-overlay'); const img=o.querySelector('img'); const r=img?img.getBoundingClientRect():{width:0,height:0}; return {open:getComputedStyle(o).display!=='none', w:Math.round(r.width), h:Math.round(r.height)};});
    if(!l.open) fallas.push(`m${n} imagen ${i}: no se amplía`); else if (l.h < H*0.5) fallas.push(`m${n} imagen ${i}: se amplía pequeña ${JSON.stringify(l)}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const l2=await p.evaluate(()=>({open:getComputedStyle(document.getElementById('lightbox-overlay')).display!=='none',presenting}));
    if(l2.open||!l2.presenting) fallas.push(`m${n} imagen ${i}: Esc no la cierra bien ${JSON.stringify(l2)}`);
  }
  await p.evaluate(()=>{ if(presenting) stopPresentation(); }); await p.waitForTimeout(200);
}
const lienzo=await p.evaluate(()=>presentCanvas.w);
console.log(`\nLienzo ${lienzo} px · pantalla ${W}×${H}: ${tarjetas} tarjetas desplegables y ${modales} modales probados`);
fallas.forEach(f=>console.log('  ✗',f));
if(!fallas.length) console.log('  ✓ todas las tarjetas se despliegan completas y se cierran; modales, actividades, imágenes y tarjetas de módulo funcionan');
if(errs.length) console.log('  ✗ errores de JavaScript: '+errs.join(' | ')); else console.log('  ✓ sin errores de JavaScript');
totalFallas+=fallas.length+errs.length; await p.close();}
(async()=>{const b=await chromium.launch();
await probar(b,'3',1920,1080);   // tamaño normal en un proyector Full HD
await probar(b,'5',1366,768);    // A+ al máximo en una pantalla pequeña
await b.close();
console.log(totalFallas?`\n✗ ${totalFallas} verificación(es) fallaron`:'\n✓ Todas las verificaciones pasaron');
process.exit(totalFallas?1:0);})().catch(e=>{console.error(e);process.exit(1);});
