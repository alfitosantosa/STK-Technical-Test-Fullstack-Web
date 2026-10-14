#!/usr/bin/env bash
#
# Menjalankan backend dan frontend sekaligus untuk development.
#
#   ./dev.sh                  # pakai PORT dari backend/.env dan port 3000 untuk frontend
#   PORT=8080 ./dev.sh        # paksa port backend
#   FRONTEND_PORT=3001 ./dev.sh
#
# Tekan Ctrl+C sekali untuk menghentikan keduanya.
#
# Kalau lebih suka lewat Docker (backend + frontend + database sekaligus),
# pakai: docker compose up --build

set -euo pipefail
set -m # tiap proses latar belakang jadi pemimpin grup, supaya bisa dihentikan sekaligus

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Port backend: dari environment variable kalau ada, lalu backend/.env, lalu 3000.
# Satu nilai ini dipakai backend dan frontend supaya keduanya tidak pernah beda.
port_dari_env_file="$(sed -n 's/^PORT=//p' "$BACKEND_DIR/.env" 2>/dev/null | tr -d "'\"" | head -1)"
BACKEND_PORT="${PORT:-${port_dari_env_file:-3000}}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

export PORT="$BACKEND_PORT"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:$BACKEND_PORT}"

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  echo "backend/.env belum ada. Salin contohnya dulu:"
  echo "  cp backend/.env.example backend/.env"
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Dependency frontend belum dipasang:"
  echo "  cd frontend && bun install"
  exit 1
fi

port_dipakai() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

tampilkan_pemakai_port() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN | tail -n +2 | awk '{ print "    " $1 " (pid " $2 ")" }'
}

for pasangan in "backend:$BACKEND_PORT" "frontend:$FRONTEND_PORT"; do
  nama="${pasangan%%:*}"
  port="${pasangan##*:}"
  if port_dipakai "$port"; then
    echo "Port $port untuk $nama sudah dipakai proses lain:"
    tampilkan_pemakai_port "$port"
    echo "  Hentikan proses itu, atau pakai port lain: PORT=8080 ./dev.sh"
    exit 1
  fi
done

pids=()

hentikan_semua() {
  echo
  echo "Menghentikan backend dan frontend..."
  for pid in "${pids[@]}"; do
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap hentikan_semua INT TERM EXIT

echo "Backend  : http://localhost:$BACKEND_PORT  (dokumentasi API: /docs)"
echo "Frontend : http://localhost:$FRONTEND_PORT"
echo "Ctrl+C untuk menghentikan keduanya."
echo

# Backend dinyalakan lebih dulu, supaya halaman frontend tidak sempat
# menampilkan "tidak bisa menghubungi server".
( cd "$BACKEND_DIR" && go run . 2>&1 | sed 's/^/[backend]  /' ) &
pids+=("$!")

for _ in $(seq 1 30); do
  if curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
    echo "[dev] backend sudah siap"
    break
  fi
  sleep 1
done

( cd "$FRONTEND_DIR" && bun run dev --port "$FRONTEND_PORT" 2>&1 | sed 's/^/[frontend] /' ) &
pids+=("$!")

wait
