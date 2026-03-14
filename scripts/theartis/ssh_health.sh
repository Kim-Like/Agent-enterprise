#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd curl
load_env

SURFACES=()
if [ "$#" -gt 0 ]; then
  SURFACES=("$@")
else
  while IFS= read -r surface; do
    SURFACES+=("${surface}")
  done < <(default_surfaces)
fi

for surface in "${SURFACES[@]}"; do
  site_url="$(surface_site_url "${surface}")"
  health_url="$(surface_health_url "${surface}")"
  wp_json_url="$(surface_wp_json_url "${surface}")"
  extra_probe_url="$(surface_extra_probe_url "${surface}")"

  echo "=== ${surface} ==="

  site_code="$(curl -sS --max-time 20 -o /dev/null -I -w "%{http_code}" "${site_url}/" || true)"
  echo "site_head_http=${site_code}"

  if [ -n "${health_url}" ]; then
    health_tmp="$(mktemp)"
    health_code="$(curl -sS --max-time 20 -o "${health_tmp}" -w "%{http_code}" "${health_url}" || true)"
    echo "health_http=${health_code}"
    head -c 400 "${health_tmp}" || true
    rm -f "${health_tmp}"
    echo
  fi

  if [ -n "${wp_json_url}" ]; then
    wp_tmp="$(mktemp)"
    wp_code="$(curl -sS --max-time 20 -o "${wp_tmp}" -w "%{http_code}" "${wp_json_url}" || true)"
    echo "wp_json_http=${wp_code}"
    head -c 320 "${wp_tmp}" || true
    rm -f "${wp_tmp}"
    echo
  fi

  if [ -n "${extra_probe_url}" ]; then
    extra_tmp="$(mktemp)"
    extra_code="$(curl -sS --max-time 20 -o "${extra_tmp}" -w "%{http_code}" "${extra_probe_url}" || true)"
    echo "extra_probe_http=${extra_code}"
    head -c 240 "${extra_tmp}" || true
    rm -f "${extra_tmp}"
    echo
  fi

  echo
done
