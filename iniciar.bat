@echo off
title Analitica Canchas Pereira - Servidor Local
cls
echo ====================================================================
echo   Web App Analitica de Ocupacion de Canchas Sinteticas (Pereira)
echo ====================================================================
echo.
echo Iniciando servidor local en Node.js...
echo El navegador se abrira de forma automatica en un segundo.
echo.
echo --------------------------------------------------------------------
echo Para apagar el servidor, simplemente cierra esta ventana o presiona Ctrl+C.
echo --------------------------------------------------------------------
echo.

node "%~dp0scripts\server.js"

pause
