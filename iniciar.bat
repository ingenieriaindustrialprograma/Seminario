@echo off
title Analitica Canchas Pereira - Servidor Local
cls
echo ====================================================================
echo   Iniciando Web App: Analitica Canchas Sinteticas (Pereira)
echo ====================================================================
echo.
echo [1/2] Abriendo la aplicacion en tu navegador...
start http://localhost:8088
echo.
echo [2/2] Iniciando servidor local en segundo plano...

node "%~dp0scripts\server.js"

pause
