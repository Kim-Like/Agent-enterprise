#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd curl
load_env

DOMAINS=()
if [ "$#" -gt 0 ]; then
  DOMAINS=("$@")
else
  while IFS= read -r domain; do
    DOMAINS+=("${domain}")
  done < <(default_domains)
fi

for domain in "${DOMAINS[@]}"; do
  api_url="$(domain_api_url "${domain}")"
  site_url="https://${domain}/"
  api_tmp="/tmp/${domain}_lavpris_health.json"

  echo "=== ${domain} ==="

  api_code="$(curl -sS --max-time 20 -o "${api_tmp}" -w "%{http_code}" "${api_url}/health" || true)"
  echo "api_health_http=${api_code}"
  head -c 400 "${api_tmp}" || true
  echo

  site_code="$(curl -sS --max-time 20 -o /dev/null -I -w "%{http_code}" "${site_url}" || true)"
  echo "site_head_http=${site_code}"
  echo
done
