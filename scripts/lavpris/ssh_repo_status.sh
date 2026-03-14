#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd ssh
load_env

DOMAINS=()
if [ "$#" -gt 0 ]; then
  DOMAINS=("$@")
else
  while IFS= read -r domain; do
    DOMAINS+=("${domain}")
  done < <(default_domains)
fi

ssh_exec 'bash -s' -- "${DOMAINS[@]}" <<'REMOTE'
set -euo pipefail

runtime_only() {
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

for domain in "$@"; do
  repo_path="/home/theartis/repositories/${domain}"
  tracked=()
  runtime=()
  other=()
  status_file=""

  if [ ! -d "${repo_path}/.git" ]; then
    echo "=== ${domain} ==="
    echo "missing_repo=${repo_path}"
    echo
    continue
  fi

  status_file="$(mktemp)"
  git -C "${repo_path}" status --short > "${status_file}"

  while IFS= read -r line; do
    [ -n "${line}" ] || continue
    if runtime_only "${line}"; then
      runtime+=("${line}")
      continue
    fi
    case "${line}" in
      "?? "*)
        other+=("${line}")
        ;;
      *)
        tracked+=("${line}")
        ;;
    esac
  done < "${status_file}"
  rm -f "${status_file}"
  status_file=""

  echo "=== ${domain} ==="
  echo "repo_path=${repo_path}"
  echo "branch=$(git -C "${repo_path}" rev-parse --abbrev-ref HEAD)"
  echo "sha=$(git -C "${repo_path}" rev-parse --short=12 HEAD)"
  echo "remote_origin=$(git -C "${repo_path}" remote get-url origin)"

  echo "-- remotes --"
  git -C "${repo_path}" remote -v

  echo "-- tracked drift --"
  if [ "${#tracked[@]}" -eq 0 ]; then
    echo "none"
  else
    printf '%s\n' "${tracked[@]}"
  fi

  echo "-- runtime-only drift --"
  if [ "${#runtime[@]}" -eq 0 ]; then
    echo "none"
  else
    printf '%s\n' "${runtime[@]}"
  fi

  echo "-- other untracked --"
  if [ "${#other[@]}" -eq 0 ]; then
    echo "none"
  else
    printf '%s\n' "${other[@]}"
  fi

  echo
done
REMOTE
