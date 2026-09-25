// Función serverless de Vercel: GET /api/modulos
//
// Entrega el contenido de los módulos III–VI SOLO cuando llega su fecha de apertura, según
// el reloj del servidor en hora de Colombia. El estudiante no puede adelantarse cambiando la
// hora de su equipo: el contenido no está en la página pública y solo sale de aquí.
//
// Acceso docente: con la cabecera X-Clave-Docente igual a la variable de entorno CLAVE_DOCENTE
// (configurada en Vercel, nunca en el código) se entregan todos los módulos sin importar la fecha.

const crypto = require('crypto');

// Fechas de apertura en hora de Colombia (UTC-5). Para abrir a otra hora, cambia 00:00:00.
const CALENDARIO = {
  3: '2026-10-03T00:00:00-05:00',
  4: '2026-10-03T00:00:00-05:00',
  5: '2026-10-10T00:00:00-05:00',
  6: '2026-10-10T00:00:00-05:00'
};

// Rutas literales para que Vercel empaquete estos archivos junto con la función.
// Se generan con "npm run construir".
const CONTENIDO = {
  3: () => require('./_contenido/modulo-3.json'),
  4: () => require('./_contenido/modulo-4.json'),
  5: () => require('./_contenido/modulo-5.json'),
  6: () => require('./_contenido/modulo-6.json')
};

const LONGITUD_MINIMA_CLAVE = 10;

function ahora() {
  // Solo para pruebas locales con dev-server.js; en Vercel siempre se usa la hora real.
  const simulada = process.env.SEMINARIO_FECHA_SIMULADA;
  if (simulada && !process.env.VERCEL) {
    const t = Date.parse(simulada);
    if (!Number.isNaN(t)) return t;
  }
  return Date.now();
}

function claveDocenteCorrecta(recibida, configurada) {
  const a = crypto.createHash('sha256').update(String(recibida)).digest();
  const b = crypto.createHash('sha256').update(String(configurada)).digest();
  return crypto.timingSafeEqual(a, b);
}

function responder(res, estado, cuerpo) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(cuerpo));
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return responder(res, 405, { error: 'metodo_no_permitido', mensaje: 'Método no permitido. Usa GET.' });
  }

  let docente = false;
  const claveRecibida = req.headers['x-clave-docente'];
  if (claveRecibida) {
    const configurada = process.env.CLAVE_DOCENTE || '';
    if (configurada.length < LONGITUD_MINIMA_CLAVE) {
      return responder(res, 403, {
        error: 'acceso_docente_deshabilitado',
        mensaje: `El acceso docente no está habilitado: falta configurar CLAVE_DOCENTE (mínimo ${LONGITUD_MINIMA_CLAVE} caracteres) en Vercel.`
      });
    }
    if (!claveDocenteCorrecta(claveRecibida, configurada)) {
      await new Promise((resolver) => setTimeout(resolver, 1000)); // frena intentos por fuerza bruta
      return responder(res, 401, { error: 'clave_incorrecta', mensaje: 'Clave docente incorrecta.' });
    }
    docente = true;
  }

  const t = ahora();
  const modulos = {};
  for (const num of Object.keys(CALENDARIO)) {
    const apertura = CALENDARIO[num];
    const disponible = docente || t >= Date.parse(apertura);
    modulos[num] = { disponible, apertura };
    if (disponible) modulos[num].contenido = CONTENIDO[num]();
  }

  return responder(res, 200, { ahora: new Date(t).toISOString(), docente, modulos });
};
