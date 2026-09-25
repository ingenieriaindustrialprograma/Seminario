// Servidor local que reproduce el sitio publicado en Vercel:
//   - sirve solo los archivos de public/ (igual que Vercel)
//   - responde /api/modulos con la misma función que se publica
//
// Uso:
//   npm start                                  → fecha y hora reales
//   FECHA=2026-10-03 npm start                 → simula esa fecha (hora de Colombia)
//   CLAVE_DOCENTE=una-clave-larga npm start    → permite probar el acceso docente (/?docente)
// En Windows (cmd):  set FECHA=2026-10-03 && npm start
const http = require('http');
const fs = require('fs');
const path = require('path');

if (process.env.FECHA) {
  const fecha = process.env.FECHA.trim();
  process.env.SEMINARIO_FECHA_SIMULADA =
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha + 'T00:00:00-05:00' :
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(fecha) ? fecha + '-05:00' :
    fecha;
}

const modulos = require('./api/modulos');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://localhost:${PORT}`).pathname;

  if (pathname === '/api/modulos') {
    await modulos(req, res);
    return;
  }
  if (pathname.startsWith('/api/')) {
    res.writeHead(404);
    res.end('No encontrado');
    return;
  }

  // Archivos estáticos, siempre dentro de public/
  let filePath;
  try {
    filePath = path.join(PUBLIC_DIR, decodeURIComponent(pathname));
  } catch (err) {
    res.writeHead(400);
    res.end('Ruta inválida');
    return;
  }
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    res.end('Prohibido');
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Error loading file: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Seminario en http://localhost:${PORT}`);
  if (process.env.SEMINARIO_FECHA_SIMULADA) {
    console.log(`Fecha simulada: ${process.env.SEMINARIO_FECHA_SIMULADA}`);
  }
  if (process.env.CLAVE_DOCENTE) {
    console.log(`Acceso docente: http://localhost:${PORT}/?docente`);
  }
});
