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

echo "=== host ==="
echo "alias=$(ssh_alias)"
echo "host=${CPANEL_SSH_HOST}"
echo "user=${CPANEL_SSH_USER}"
echo "port=${CPANEL_SSH_PORT}"
echo "node_bin=${CPANEL_NODE_BIN}"
echo

for surface in "${SURFACES[@]}"; do
  repo_path="$(surface_repo_path "${surface}")"
  site_root="$(surface_site_root "${surface}")"
  domain_root="$(surface_domain_root "${surface}")"
  repo_arg="${repo_path}"
  domain_root_arg="${domain_root}"
  stack="$(surface_stack "${surface}")"
  mode="$(surface_mode "${surface}")"
  health_url="$(surface_health_url "${surface}")"
  wp_json_url="$(surface_wp_json_url "${surface}")"
  note="$(surface_note "${surface}")"

  if [ -z "${repo_arg}" ]; then
    repo_arg="__none__"
  fi

  if [ -z "${domain_root_arg}" ]; then
    domain_root_arg="__none__"
  fi

  echo "=== ${surface} ==="
  echo "stack=${stack}"
  echo "mode=${mode}"
  echo "site_url=$(surface_site_url "${surface}")"
  echo "site_root=${site_root}"

  if [ -n "${repo_path}" ]; then
    echo "repo_path=${repo_path}"
  else
    echo "repo_path=none"
  fi

  if [ "${domain_root}" != "${site_root}" ]; then
    echo "domain_root=${domain_root}"
  fi

  if [ -n "${health_url}" ]; then
    echo "health_url=${health_url}"
  fi

  if [ -n "${wp_json_url}" ]; then
    echo "wp_json_url=${wp_json_url}"
  fi

  if [ -n "${note}" ]; then
    echo "note=${note}"
  fi

  ssh_exec 'bash -s' -- "${surface}" "${repo_arg}" "${site_root}" "${domain_root_arg}" <<'REMOTE'
set -euo pipefail

surface="$1"
repo_path="$2"
site_root="$3"
domain_root="$4"

if [ "${repo_path}" = "__none__" ]; then
  repo_path=""
fi

if [ "${domain_root}" = "__none__" ]; then
  domain_root=""
fi

echo "remote_site_exists=$([ -e "${site_root}" ] && echo yes || echo no)"
echo "remote_site_writable=$([ -w "${site_root}" ] && echo yes || echo no)"
echo "remote_wp_config=$([ -f "${site_root}/wp-config.php" ] && echo yes || echo no)"
echo "remote_htaccess=$([ -f "${site_root}/.htaccess" ] && echo yes || echo no)"

if [ "${domain_root}" != "${site_root}" ]; then
  echo "remote_domain_root_exists=$([ -e "${domain_root}" ] && echo yes || echo no)"
fi

if [ -n "${repo_path}" ]; then
  echo "remote_repo_exists=$([ -d "${repo_path}" ] && echo yes || echo no)"
  echo "remote_repo_git=$([ -d "${repo_path}/.git" ] && echo yes || echo no)"
  if [ -d "${repo_path}/.git" ]; then
    echo "remote_origin=$(git -C "${repo_path}" remote get-url origin 2>/dev/null || true)"
    echo "remote_branch=$(git -C "${repo_path}" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  fi
else
  echo "remote_repo_exists=no"
  echo "remote_repo_git=no"
fi

if [ "${surface}" = "reporting.theartisan.dk" ]; then
  ps -eo pid,user,command | grep -E "lsnode:.*/repositories/reporting\\.theartisan\\.dk" | grep -v grep || true
fi
REMOTE

  echo
done
