#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SSH_ALIAS="cp10-lavpris"
GITHUB_REPO_SSH="git@github.com:kimjeppesen01/lavprishjemmeside.dk.git"
DEFAULT_GIT_BRANCH="main"

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    exit 1
  fi
}

load_env() {
  local env_files=(
    "${PROJECT_ROOT}/.env.local"
    "${PROJECT_ROOT}/.env"
  )
  local loaded=0

  for env_file in "${env_files[@]}"; do
    if [ ! -f "${env_file}" ]; then
      continue
    fi

    # shellcheck disable=SC1090
    set -a
    source "${env_file}"
    set +a
    loaded=1
  done

  if [ "${loaded}" -ne 1 ]; then
    echo "Missing env file. Expected ${PROJECT_ROOT}/.env.local or ${PROJECT_ROOT}/.env" >&2
    exit 1
  fi

  : "${CPANEL_SSH_HOST:?CPANEL_SSH_HOST is required}"
  : "${CPANEL_SSH_PORT:?CPANEL_SSH_PORT is required}"
  : "${CPANEL_SSH_USER:?CPANEL_SSH_USER is required}"
  : "${CPANEL_SSH_KEY_PATH:?CPANEL_SSH_KEY_PATH is required}"
  : "${LAVPRIS_CMS_REPO_PATH:?LAVPRIS_CMS_REPO_PATH is required}"
  : "${LAVPRIS_CLIENT_REPO_PATH:?LAVPRIS_CLIENT_REPO_PATH is required}"
  : "${LAVPRIS_CMS_SITE_ROOT:?LAVPRIS_CMS_SITE_ROOT is required}"
  : "${LAVPRIS_CLIENT_SITE_ROOT:?LAVPRIS_CLIENT_SITE_ROOT is required}"
  : "${LAVPRIS_NODE_BIN:?LAVPRIS_NODE_BIN is required}"
}

ssh_alias() {
  printf '%s\n' "${SSH_ALIAS}"
}

ssh_config_path() {
  printf '%s\n' "${HOME}/.ssh/config"
}

ensure_ssh_alias_defined() {
  local config_path
  config_path="$(ssh_config_path)"

  if [ ! -f "${config_path}" ]; then
    echo "Missing SSH config: ${config_path}" >&2
    exit 1
  fi

  if ! awk '
    /^[[:space:]]*Host[[:space:]]+/ {
      for (i = 2; i <= NF; i += 1) {
        if ($i == "cp10-lavpris") {
          found = 1
        }
      }
    }
    END { exit found ? 0 : 1 }
  ' "${config_path}"; then
    echo "Missing SSH alias cp10-lavpris in ${config_path}" >&2
    exit 1
  fi
}

resolve_ssh_field() {
  local field="$1"
  ssh -G "$(ssh_alias)" 2>/dev/null | awk -v key="${field}" '$1 == key { print $2; exit }'
}

ssh_exec() {
  ensure_ssh_alias_defined
  ssh \
    -F "$(ssh_config_path)" \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=20 \
    "$(ssh_alias)" \
    "$@"
}

default_domains() {
  printf '%s\n' "lavprishjemmeside.dk" "ljdesignstudio.dk"
}

github_repo_ssh() {
  printf '%s\n' "${GITHUB_REPO_SSH}"
}

default_git_branch() {
  printf '%s\n' "${DEFAULT_GIT_BRANCH}"
}

local_mirror_path() {
  if [ -n "${LAVPRIS_LOCAL_MIRROR_PATH:-}" ]; then
    printf '%s\n' "${LAVPRIS_LOCAL_MIRROR_PATH}"
    return 0
  fi

  printf '%s\n' "${PROJECT_ROOT}/programs/lavprishjemmeside/local-mirror"
}

domain_repo() {
  local domain="$1"
  case "${domain}" in
    lavprishjemmeside.dk)
      printf '%s\n' "${LAVPRIS_CMS_REPO_PATH}"
      ;;
    ljdesignstudio.dk)
      printf '%s\n' "${LAVPRIS_CLIENT_REPO_PATH}"
      ;;
    *)
      printf '/home/%s/repositories/%s\n' "${CPANEL_SSH_USER}" "${domain}"
      ;;
  esac
}

domain_site_root() {
  local domain="$1"
  case "${domain}" in
    lavprishjemmeside.dk)
      printf '%s\n' "${LAVPRIS_CMS_SITE_ROOT}"
      ;;
    ljdesignstudio.dk)
      printf '%s\n' "${LAVPRIS_CLIENT_SITE_ROOT}"
      ;;
    *)
      printf '/home/%s/%s\n' "${CPANEL_SSH_USER}" "${domain}"
      ;;
  esac
}

domain_api_url() {
  local domain="$1"
  printf 'https://api.%s\n' "${domain}"
}

runtime_only_status_line() {
  local line="$1"
  case "${line}" in
    "?? api/stderr.log"|"?? api/tmp/"|"?? api/tmp/"*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}
