const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let PORT = 8088;
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function resolveFilePath(requestUrl) {
  const urlWithoutQuery = decodeURIComponent(requestUrl.split('?')[0]);
  const cleanPath = urlWithoutQuery.replace(/^[/\\]+/, '');
  const target = (!cleanPath || cleanPath === '.' || cleanPath === '') ? 'index.html' : cleanPath;
  const safeNormalized = path.normalize(target).replace(/^(\.\.[/\\])+/, '');
  return path.join(ROOT, safeNormalized);
}

function openBrowser(url) {
  const startCmd = process.platform === 'win32' ? 'start ""' :
                   process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${startCmd} ${url}`, (err) => {
    if (err) console.log(`Abre manualmente en tu navegador: ${url}`);
  });
}

function startServer(port) {
  const server = http.createServer((req, res) => {
    let filePath = resolveFilePath(req.url);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 No Encontrado');
        return;
      }

      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Puerto ${port} ocupado, intentando con puerto ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Error en el servidor:', err);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}/`;
    console.log(`\n========================================================`);
    console.log(`  Web App Canchas Pereira - Servidor Activo`);
    console.log(`  Disponible en: ${url}`);
    console.log(`  (Presiona Ctrl + C en esta ventana para detenerlo)`);
    console.log(`========================================================\n`);
    openBrowser(url);
  });
}

startServer(PORT);
