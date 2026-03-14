#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd ssh
load_env

if [ ! -r "${CPANEL_SSH_KEY_PATH}" ]; then
  echo "SSH key is missing or unreadable: ${CPANEL_SSH_KEY_PATH}" >&2
  exit 1
fi

resolved_hostname="$(resolve_ssh_field hostname)"
resolved_user="$(resolve_ssh_field user)"
resolved_port="$(resolve_ssh_field port)"
resolved_identity="$(resolve_ssh_field identityfile)"

if [ "${resolved_hostname}" != "${CPANEL_SSH_HOST}" ]; then
  echo "SSH alias hostname mismatch: expected ${CPANEL_SSH_HOST}, got ${resolved_hostname}" >&2
  exit 1
fi

if [ "${resolved_user}" != "${CPANEL_SSH_USER}" ]; then
  echo "SSH alias user mismatch: expected ${CPANEL_SSH_USER}, got ${resolved_user}" >&2
  exit 1
fi

if [ "${resolved_port}" != "${CPANEL_SSH_PORT}" ]; then
  echo "SSH alias port mismatch: expected ${CPANEL_SSH_PORT}, got ${resolved_port}" >&2
  exit 1
fi

if [ "${resolved_identity}" != "${CPANEL_SSH_KEY_PATH}" ]; then
  echo "SSH alias identity mismatch: expected ${CPANEL_SSH_KEY_PATH}, got ${resolved_identity}" >&2
  exit 1
fi

ssh_exec 'bash -s' -- \
  "${CPANEL_NODE_BIN}" \
  "${LAVPRIS_CMS_REPO_PATH}" \
  "${LAVPRIS_CLIENT_REPO_PATH}" \
  "${LAVPRIS_CMS_SITE_ROOT}" \
  "${LAVPRIS_CLIENT_SITE_ROOT}" \
  "${ARTISAN_WP_REPO_PATH}" \
  "${ARTISAN_WP_SITE_ROOT}" \
  "${ARTISAN_WP_DOMAIN_ROOT}" \
  "${ARTISAN_REPORTING_REPO_PATH}" \
  "${ARTISAN_REPORTING_SITE_ROOT}" \
  "${THIRDWAVE_SITE_ROOT}" \
  "${THIRDWAVE_AUDIT_PROXY_PATH}" <<'REMOTE'
set -euo pipefail

node_bin_dir="$1"
lavpris_repo="$2"
client_repo="$3"
lavpris_root="$4"
client_root="$5"
artisan_repo="$6"
artisan_root="$7"
artisan_domain_root="$8"
reporting_repo="$9"
reporting_root="${10}"
thirdwave_root="${11}"
thirdwave_proxy="${12}"

for path in \
  "${lavpris_repo}" \
  "${client_repo}" \
  "${lavpris_root}" \
  "${client_root}" \
  "${artisan_repo}" \
  "${artisan_root}" \
  "${artisan_domain_root}" \
  "${reporting_repo}" \
  "${reporting_root}" \
  "${thirdwave_root}" \
  "$(dirname "${thirdwave_proxy}")"
do
  if [ ! -e "${path}" ]; then
    echo "Missing required remote path: ${path}" >&2
    exit 1
  fi
done

if [ ! -x "${node_bin_dir}/node" ]; then
  echo "Missing remote node binary: ${node_bin_dir}/node" >&2
  exit 1
fi

if ! grep -q 'Host github-kimjeppesen' "${HOME}/.ssh/config"; then
  echo "Missing remote github-kimjeppesen alias in ${HOME}/.ssh/config" >&2
  exit 1
fi

echo "remote_user=$(whoami)"
echo "remote_host=$(hostname)"
echo "remote_node=${node_bin_dir}/node"
echo "lavpris_repo=${lavpris_repo}"
echo "lavpris_client_repo=${client_repo}"
echo "artisan_repo=${artisan_repo}"
echo "artisan_site_root=${artisan_root}"
echo "reporting_repo=${reporting_repo}"
echo "thirdwave_site_root=${thirdwave_root}"
echo "remote_github_alias=github-kimjeppesen"
REMOTE
