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

for forbidden in \
  "scripts/_runtime_common.sh" \
  "scripts/start_agent_enterprise.sh" \
  "scripts/start_lavpris_public_ingress.sh" \
  "scripts/tailscale-funnel.sh" \
  "scripts/tailscale-serve.sh" \
  "scripts/lavpris/_common.sh" \
  "scripts/lavpris/local_mirror_pull.sh" \
  "scripts/lavpris/ssh_preflight.sh" \
  "scripts/lavpris/ssh_inventory.sh" \
  "scripts/lavpris/ssh_health.sh" \
  "scripts/lavpris/ssh_repo_status.sh" \
  "scripts/lavpris/sync_status.sh" \
  "scripts/theartis/_common.sh" \
  "scripts/theartis/ssh_preflight.sh" \
  "scripts/theartis/ssh_inventory.sh" \
  "scripts/theartis/ssh_health.sh" \
  "scripts/theartis/ssh_repo_status.sh" \
  "scripts/theartis/ssh_write_access.sh"
do
  [ ! -e "${ROOT}/${forbidden}" ] || fail "${forbidden} must not exist"
done

echo "external_repo_validation=ok"
