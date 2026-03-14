#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_runtime_common.sh"

ROOT_DIR="$(runtime_root_dir)"
load_runtime_env "$ROOT_DIR"

INGRESS_HOST="${LAVPRIS_PUBLIC_INGRESS_HOST:-127.0.0.1}"
INGRESS_PORT="${LAVPRIS_PUBLIC_INGRESS_PORT:-8000}"

TAILSCALE_BIN="$(find_tailscale_cli || true)"

if [[ -z "${TAILSCALE_BIN}" ]]; then
  echo "tailscale CLI is required to expose the Lavpris public ingress." >&2
  exit 1
fi

cd "$ROOT_DIR"
./scripts/start_lavpris_public_ingress.sh &
INGRESS_PID=$!

cleanup() {
  if kill -0 "$INGRESS_PID" >/dev/null 2>&1; then
    kill "$INGRESS_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

sleep 2
# expose the Lavpris ingress through tailscale funnel
"${TAILSCALE_BIN}" funnel --bg "${INGRESS_PORT}"

echo "Tailscale Funnel forwarding https traffic to http://${INGRESS_HOST}:${INGRESS_PORT}"
wait "$INGRESS_PID"
