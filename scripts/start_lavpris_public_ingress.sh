#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_runtime_common.sh"

ROOT_DIR="$(runtime_root_dir)"
load_runtime_env "$ROOT_DIR"

cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  npm install
fi

exec npm run start:lavpris-public-ingress
