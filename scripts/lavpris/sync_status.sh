#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/_common.sh"

require_cmd git
require_cmd ssh
load_env

branch="${1:-$(default_git_branch)}"
mirror_path="$(local_mirror_path)"
repo_url="$(github_repo_ssh)"
github_head="$(git ls-remote "${repo_url}" "refs/heads/${branch}" | awk 'NR == 1 { print $1 }')"

if [ -z "${github_head}" ]; then
  echo "Unable to resolve GitHub HEAD for ${repo_url} ${branch}" >&2
  exit 1
fi

echo "github_repo=${repo_url}"
echo "github_branch=${branch}"
echo "github_head=${github_head}"

local_ok=true
local_matches_github=false
local_clean=false

echo
echo "=== local mirror ==="
echo "mirror_path=${mirror_path}"

if [ -d "${mirror_path}/.git" ]; then
  git -C "${mirror_path}" remote set-url origin "${repo_url}"
  git -C "${mirror_path}" fetch origin "${branch}" --prune --quiet

  local_head="$(git -C "${mirror_path}" rev-parse HEAD)"
  local_branch="$(git -C "${mirror_path}" rev-parse --abbrev-ref HEAD)"
  local_origin="$(git -C "${mirror_path}" remote get-url origin)"
  local_status="$(git -C "${mirror_path}" status --porcelain)"
  ahead_behind="$(git -C "${mirror_path}" rev-list --left-right --count "HEAD...origin/${branch}")"
  local_ahead="$(printf '%s' "${ahead_behind}" | awk '{print $1}')"
  local_behind="$(printf '%s' "${ahead_behind}" | awk '{print $2}')"

  if [ -z "${local_status}" ]; then
    local_clean=true
  else
    local_ok=false
  fi

  if [ "${local_head}" = "${github_head}" ]; then
    local_matches_github=true
  else
    local_ok=false
  fi

  echo "origin=${local_origin}"
  echo "branch=${local_branch}"
  echo "head=${local_head}"
  echo "ahead=${local_ahead}"
  echo "behind=${local_behind}"
  echo "clean=${local_clean}"
  echo "-- local status --"
  if [ -z "${local_status}" ]; then
    echo "none"
  else
    printf '%s\n' "${local_status}"
  fi
else
  local_ok=false
  echo "missing=true"
fi

remote_report="$(ssh_exec 'bash -s' -- "${LAVPRIS_CMS_REPO_PATH}" "${branch}" <<'REMOTE'
set -euo pipefail

repo_path="$1"
branch="$2"

echo "repo_path=${repo_path}"

if [ ! -d "${repo_path}/.git" ]; then
  echo "missing=true"
  exit 0
fi

echo "missing=false"
echo "origin=$(git -C "${repo_path}" remote get-url origin)"
echo "branch=$(git -C "${repo_path}" rev-parse --abbrev-ref HEAD)"
echo "head=$(git -C "${repo_path}" rev-parse HEAD)"
echo "-- remote status --"
git -C "${repo_path}" status --short
REMOTE
)"

echo
echo "=== cPanel repo ==="
printf '%s\n' "${remote_report}"

remote_missing="$(printf '%s\n' "${remote_report}" | awk -F= '$1 == "missing" { print $2; exit }')"
remote_head="$(printf '%s\n' "${remote_report}" | awk -F= '$1 == "head" { print $2; exit }')"

remote_tracked_drift=0
remote_runtime_drift=0
remote_other_untracked=0
remote_status_lines="$(printf '%s\n' "${remote_report}" | awk 'seen { print } /^-- remote status --$/ { seen = 1 }')"

while IFS= read -r line; do
  [ -n "${line}" ] || continue
  if runtime_only_status_line "${line}"; then
    remote_runtime_drift=$((remote_runtime_drift + 1))
    continue
  fi
  case "${line}" in
    "?? "*)
      remote_other_untracked=$((remote_other_untracked + 1))
      ;;
    *)
      remote_tracked_drift=$((remote_tracked_drift + 1))
      ;;
  esac
done <<< "${remote_status_lines}"

remote_ok=true
remote_matches_github=false

if [ "${remote_missing}" != "false" ]; then
  remote_ok=false
else
  if [ "${remote_head}" = "${github_head}" ]; then
    remote_matches_github=true
  else
    remote_ok=false
  fi

  if [ "${remote_tracked_drift}" != "0" ]; then
    remote_ok=false
  fi
fi

echo
echo "=== summary ==="
echo "local_matches_github=${local_matches_github}"
echo "cpanel_matches_github=${remote_matches_github}"
echo "local_ready=${local_ok}"
echo "cpanel_ready=${remote_ok}"
echo "cpanel_tracked_drift=${remote_tracked_drift}"
echo "cpanel_runtime_drift=${remote_runtime_drift}"
echo "cpanel_other_untracked=${remote_other_untracked}"

if [ "${local_ok}" = true ] && [ "${remote_ok}" = true ]; then
  echo "sync_status=aligned"
  exit 0
fi

echo "sync_status=drift_detected"
exit 1
