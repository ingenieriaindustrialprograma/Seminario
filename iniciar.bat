@echo off
title Analitica Canchas Pereira - Servidor Local
cls
echo ====================================================================
echo   Web App Analitica de Ocupacion de Canchas Sinteticas - Pereira
echo ====================================================================
echo.
echo [1/2] Abriendo la aplicacion en tu navegador...
start http://localhost:8088
echo.
echo [2/2] Servidor local HTTP iniciado en http://localhost:8088
echo.
echo --------------------------------------------------------------------
echo Para cerrar la aplicacion, simplemente cierra esta ventana
echo o presiona Ctrl + C en tu teclado.
echo --------------------------------------------------------------------
echo.

node -e "const http=require('http'),fs=require('fs'),path=require('path');const P=8088,R=process.cwd(),M={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};http.createServer((q,s)=>{let f=path.join(R,q.url==='/'?'index.html':decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,b)=>{if(e){s.writeHead(404,{'Content-Type':'text/plain'});s.end('404 No encontrado')}else{s.writeHead(200,{'Content-Type':M[path.extname(f).toLowerCase()]||'application/octet-stream'});s.end(b)}})}).listen(P,()=>console.log('Servidor corriendo exitosamente en el puerto ' + P + '...'));"

pause
