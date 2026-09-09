#!/usr/bin/env bash
# ====================================================================
# Web App Analítica de Ocupación de Canchas Sintéticas - Pereira
# Script Bash para iniciar el servidor local y abrir en el navegador
# ====================================================================

PORT=8088

echo "===================================================================="
echo "  Iniciando Web App: Analítica Canchas Pereira"
echo "===================================================================="
echo ""
echo "[1/2] Abriendo navegador en http://localhost:$PORT ..."

# Abrir el navegador según el entorno
if command -v start > /dev/null 2>&1; then
    start http://localhost:$PORT
elif command -v xdg-open > /dev/null 2>&1; then
    xdg-open http://localhost:$PORT &
elif command -v open > /dev/null 2>&1; then
    open http://localhost:$PORT &
fi

echo ""
echo "[2/2] Servidor local HTTP activo en http://localhost:$PORT"
echo "Presiona Ctrl + C para detener el servidor."
echo "===================================================================="
echo ""

node -e "const http=require('http'),fs=require('fs'),path=require('path');const P=$PORT,R=process.cwd(),M={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};http.createServer((q,s)=>{let f=path.join(R,q.url==='/'?'index.html':decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,b)=>{if(e){s.writeHead(404,{'Content-Type':'text/plain'});s.end('404 No encontrado')}else{s.writeHead(200,{'Content-Type':M[path.extname(f).toLowerCase()]||'application/octet-stream'});s.end(b)}})}).listen(P,()=>console.log('Servidor corriendo exitosamente en el puerto ' + P + '...'));"
