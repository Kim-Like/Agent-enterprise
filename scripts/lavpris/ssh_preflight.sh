#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd ssh
require_cmd awk
load_env

if [ ! -r "${CPANEL_SSH_KEY_PATH}" ]; then
  echo "SSH key is missing or unreadable: ${CPANEL_SSH_KEY_PATH}" >&2
  exit 1
fi

ensure_ssh_alias_defined

resolved_host="$(resolve_ssh_field hostname)"
resolved_user="$(resolve_ssh_field user)"
resolved_port="$(resolve_ssh_field port)"
resolved_identity="$(resolve_ssh_field identityfile)"

if [ "${resolved_host}" != "${CPANEL_SSH_HOST}" ]; then
  echo "SSH alias hostname mismatch: expected ${CPANEL_SSH_HOST}, got ${resolved_host}" >&2
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

ssh_exec 'bash -s' <<REMOTE
set -euo pipefail

if [ ! -x "${LAVPRIS_NODE_BIN}/node" ]; then
  echo "Missing remote node runtime: ${LAVPRIS_NODE_BIN}/node" >&2
  exit 1
fi

for path in \
  "${LAVPRIS_CMS_REPO_PATH}" \
  "${LAVPRIS_CLIENT_REPO_PATH}" \
  "${LAVPRIS_CMS_SITE_ROOT}" \
  "${LAVPRIS_CLIENT_SITE_ROOT}"
do
  if [ ! -d "\${path}" ]; then
    echo "Missing remote path: \${path}" >&2
    exit 1
  fi
done

if [ ! -f "\${HOME}/.ssh/config" ]; then
  echo "Missing remote SSH config: \${HOME}/.ssh/config" >&2
  exit 1
fi

if ! grep -Eq '^[[:space:]]*Host[[:space:]]+github-kimjeppesen([[:space:]]|\$)' "\${HOME}/.ssh/config"; then
  echo "Remote SSH config is missing github-kimjeppesen alias" >&2
  exit 1
fi

printf 'remote_user=%s\n' "\$(whoami)"
printf 'remote_host=%s\n' "\$(hostname)"
printf 'remote_node=%s\n' "${LAVPRIS_NODE_BIN}/node"
printf 'cms_repo=%s\n' "${LAVPRIS_CMS_REPO_PATH}"
printf 'client_repo=%s\n' "${LAVPRIS_CLIENT_REPO_PATH}"
printf 'cms_site_root=%s\n' "${LAVPRIS_CMS_SITE_ROOT}"
printf 'client_site_root=%s\n' "${LAVPRIS_CLIENT_SITE_ROOT}"
printf 'remote_github_alias=%s\n' "github-kimjeppesen"
REMOTE
