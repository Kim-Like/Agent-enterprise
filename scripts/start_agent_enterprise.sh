#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_runtime_common.sh"

ROOT="$(runtime_root_dir)"
load_runtime_env "$ROOT"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
LOG_DIR="$ROOT/.logs"
LOG_FILE="$LOG_DIR/agent-enterprise.log"

ensure_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required but was not found in PATH." >&2
    exit 1
  fi
}

ensure_deps() {
  if [[ ! -d "$ROOT/node_modules" ]]; then
    echo "Installing dependencies..."
    (cd "$ROOT" && npm install)
  fi
}

already_running() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  return 1
}

ensure_node
ensure_deps

mkdir -p "$LOG_DIR"

if already_running; then
  echo "Agent Enterprise already listening on http://${HOST}:${PORT}"
  exit 0
fi

echo "Starting Agent Enterprise on http://${HOST}:${PORT}"
echo "Logs: $LOG_FILE"

trap 'echo "Stopping Agent Enterprise"; exit 0' INT TERM

while true; do
  (cd "$ROOT" && node server/src/index.js) >>"$LOG_FILE" 2>&1
  exit_code=$?
  printf "[%s] Server exited with code %s. Restarting in 2s...\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$exit_code" >>"$LOG_FILE"
  sleep 2
done
