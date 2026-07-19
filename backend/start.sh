#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

command -v termux-wake-lock >/dev/null 2>&1 && termux-wake-lock

while true; do
  echo "[$(date -Iseconds)] Iniciando backend..."
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  echo "[$(date -Iseconds)] Backend terminado (crash o kill). Reintentando en 5s..."
  sleep 5
done
