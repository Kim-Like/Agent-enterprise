#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
TAILSCALE_HTTPS_PORT="${TAILSCALE_HTTPS_PORT:-443}"

if ! command -v tailscale >/dev/null 2>&1; then
  echo "tailscale CLI is required to use this script." >&2
  exit 1
fi

cd "$ROOT_DIR"
./scripts/start.sh &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

sleep 2
tailscale serve --bg --https="${TAILSCALE_HTTPS_PORT}" "http://127.0.0.1:${PORT}"

echo "Tailscale Serve forwarding https port ${TAILSCALE_HTTPS_PORT} to http://${HOST}:${PORT}"
wait "$SERVER_PID"
