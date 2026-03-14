#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd ssh
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
  PATHS=()
  while IFS= read -r path_item; do
    PATHS+=("${path_item}")
  done < <(surface_write_paths "${surface}")

  echo "=== ${surface} ==="

  if [ "${#PATHS[@]}" -eq 0 ]; then
    echo "paths=none"
    echo
    continue
  fi

  ssh_exec 'bash -s' -- "${PATHS[@]}" <<'REMOTE'
set -euo pipefail

for path_item in "$@"; do
  if [ ! -e "${path_item}" ]; then
    printf '%s missing\n' "${path_item}"
    continue
  fi

  if [ -w "${path_item}" ]; then
    printf '%s writable\n' "${path_item}"
  else
    printf '%s not-writable\n' "${path_item}"
  fi
done
REMOTE

  echo
done
