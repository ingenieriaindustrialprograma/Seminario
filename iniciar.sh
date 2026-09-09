#!/usr/bin/env bash
# ====================================================================
# Web App Analítica de Canchas Sintéticas - Pereira
# Script para iniciar el servidor local y abrir en el navegador
# ====================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8088

echo "===================================================================="
echo "  Iniciando Web App: Analítica Canchas Pereira"
echo "===================================================================="
echo ""
echo "[1/2] Abriendo navegador en http://localhost:$PORT ..."

if command -v start > /dev/null 2>&1; then
    start http://localhost:$PORT
elif command -v xdg-open > /dev/null 2>&1; then
    xdg-open http://localhost:$PORT &
elif command -v open > /dev/null 2>&1; then
    open http://localhost:$PORT &
fi

echo ""
echo "[2/2] Servidor local HTTP iniciando..."
echo ""

node "$DIR/scripts/server.js"
