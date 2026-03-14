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
  repo_path="$(surface_repo_path "${surface}")"
  site_root="$(surface_site_root "${surface}")"

  echo "=== ${surface} ==="

  if [ -z "${repo_path}" ]; then
    echo "repo_path=none"
    echo "site_root=${site_root}"
    echo "note=no dedicated repo detected on cp10"
    echo
    continue
  fi

  ssh_exec 'bash -s' -- "${repo_path}" "${site_root}" <<'REMOTE'
set -euo pipefail

repo_path="$1"
site_root="$2"
tracked=()
runtime=()
other=()
status_file=""

if [ ! -d "${repo_path}" ]; then
  echo "repo_path=${repo_path}"
  echo "missing_repo=yes"
  exit 0
fi

if [ ! -d "${repo_path}/.git" ]; then
  echo "repo_path=${repo_path}"
  echo "site_root=${site_root}"
  echo "git_repo=no"
  exit 0
fi

status_file="$(mktemp)"
git -C "${repo_path}" status --short > "${status_file}"

while IFS= read -r line; do
  [ -n "${line}" ] || continue
  case "${line}" in
    "?? api/stderr.log"|"?? api/tmp/"|"?? api/tmp/"*|"?? tmp/"|"?? stderr.log")
      runtime+=("${line}")
      ;;
    "?? "*)
      other+=("${line}")
      ;;
    *)
      tracked+=("${line}")
      ;;
  esac
done < "${status_file}"

rm -f "${status_file}"

echo "repo_path=${repo_path}"
echo "site_root=${site_root}"
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
REMOTE

  echo
done
