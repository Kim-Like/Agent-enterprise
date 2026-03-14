#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "validation_failed: $1" >&2
  exit 1
}

[ ! -f "${ROOT}/.env.local" ] || fail ".env.local must not exist"
[ ! -d "${ROOT}/.data" ] || fail ".data must not exist"
[ ! -d "${ROOT}/.logs" ] || fail ".logs must not exist"
[ ! -d "${ROOT}/node_modules" ] || fail "node_modules must not exist"
[ ! -d "${ROOT}/programs/lavprishjemmeside/local-mirror/.git" ] || fail "nested local-mirror .git must not exist"

if find "${ROOT}" -name '.DS_Store' | grep -q .; then
  fail ".DS_Store files must not exist"
fi

echo "external_repo_validation=ok"
